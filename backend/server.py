from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Tax calculation models
class TaxBracket(BaseModel):
    min_amount: float
    max_amount: Optional[float]  # None for the highest bracket
    rate: float

class CalculationInput(BaseModel):
    salary: float
    calculation_type: str  # "net_to_gross" or "gross_to_net"
    medical_aid: float = 0
    loans: float = 0
    other_discounts: float = 0
    dependents: int = 0

class CalculationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    gross_salary: float
    net_salary: float
    irps_tax: float
    inss_employee: float
    inss_employer: float
    medical_aid: float
    loans: float
    other_discounts: float
    total_discounts: float
    dependents: int
    dependents_deduction: float
    monthly_breakdown: dict
    annual_breakdown: dict
    calculation_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CalculationHistory(BaseModel):
    calculations: List[CalculationResult]

# IRPS Tax Calculation Structure (Official Moçambique Tax Authority 2025)
# Each entry: [lower_limit, coefficient, base_values_by_dependents[0,1,2,3,4]]
IRPS_TAX_TABLE = [
    [0, 0, [0, 0, 0, 0, 0]],                          # 0 - 20,249.99
    [20250, 0, [0, 0, 0, 0, 0]],                      # 20,250 - 20,749.99
    [20750, 0.10, [0, 0, 0, 0, 0]],                   # 20,750 - 20,999.99
    [21000, 0.10, [50, 0, 0, 0, 0]],                  # 21,000 - 21,249.99
    [21250, 0.10, [75, 25, 0, 0, 0]],                 # 21,250 - 21,749.99
    [21750, 0.10, [100, 50, 25, 0, 0]],               # 21,750 - 22,249.99
    [22250, 0.15, [150, 100, 75, 50, 0]],             # 22,250 - 32,749.99
    [32750, 0.20, [1775, 1725, 1700, 1675, 1625]],   # 32,750 - 60,749.99
    [60750, 0.25, [7375, 7325, 7300, 7275, 7225]],   # 60,750 - 144,749.99
    [144750, 0.32, [28375, 28325, 28300, 28275, 28225]]  # Above 144,750
]

# INSS rates
INSS_EMPLOYEE_RATE = 0.03  # 3%
INSS_EMPLOYER_RATE = 0.04  # 4%

def calculate_irps_tax(monthly_salary: float, dependents: int = 0) -> dict:
    """
    Calculate IRPS tax using the official formula from Moçambique Tax Authority:
    IRPS = Valor_base_por_dependentes + (Salário_Bruto - Limite_Inferior_Intervalo) * Coeficiente
    """
    # Cap dependents at 4 (matrix only goes up to 4 dependents)
    dependents_capped = min(dependents, 4)
    
    # Find the appropriate tax bracket
    selected_bracket = None
    for i, bracket in enumerate(IRPS_TAX_TABLE):
        lower_limit, coefficient, base_values = bracket
        
        # Check if salary falls in this bracket
        if i == len(IRPS_TAX_TABLE) - 1:  # Last bracket (no upper limit)
            if monthly_salary >= lower_limit:
                selected_bracket = bracket
                break
        else:
            next_lower_limit = IRPS_TAX_TABLE[i + 1][0]
            if lower_limit <= monthly_salary < next_lower_limit:
                selected_bracket = bracket
                break
    
    if not selected_bracket:
        # Salary below minimum taxable amount
        return {
            "irps_amount": 0,
            "dependents_deduction": 0,
            "calculation_details": {
                "salary": monthly_salary,
                "dependents": dependents_capped,
                "bracket_found": False,
                "lower_limit": 0,
                "coefficient": 0,
                "base_value": 0,
                "additional_amount": 0,
                "formula": "Salary below minimum taxable threshold"
            }
        }
    
    lower_limit, coefficient, base_values = selected_bracket
    base_value = base_values[dependents_capped]
    
    # Apply the official formula
    additional_amount = (monthly_salary - lower_limit) * coefficient
    irps_amount = base_value + additional_amount
    
    # Calculate what the IRPS would be with 0 dependents for comparison
    base_value_0_dep = base_values[0]
    irps_amount_0_dep = base_value_0_dep + additional_amount
    dependents_deduction = irps_amount_0_dep - irps_amount
    
    return {
        "irps_amount": irps_amount,
        "dependents_deduction": dependents_deduction,
        "calculation_details": {
            "salary": monthly_salary,
            "dependents": dependents_capped,
            "bracket_found": True,
            "lower_limit": lower_limit,
            "coefficient": coefficient,
            "base_value": base_value,
            "additional_amount": additional_amount,
            "base_value_0_dep": base_value_0_dep,
            "irps_0_dependents": irps_amount_0_dep,
            "formula": f"{base_value} + ({monthly_salary} - {lower_limit}) * {coefficient} = {irps_amount}"
        }
    }

def calculate_inss(monthly_salary: float) -> tuple:
    """Calculate INSS contributions for employee and employer"""
    employee_contribution = monthly_salary * INSS_EMPLOYEE_RATE
    employer_contribution = monthly_salary * INSS_EMPLOYER_RATE
    return employee_contribution, employer_contribution

def calculate_net_from_gross(gross_salary: float, medical_aid: float = 0, loans: float = 0, other_discounts: float = 0, dependents: int = 0) -> dict:
    """Calculate net salary from gross salary using official IRPS formula"""
    irps_result = calculate_irps_tax(gross_salary, dependents)
    inss_employee, inss_employer = calculate_inss(gross_salary)
    
    irps_tax = irps_result["irps_amount"]
    dependents_deduction = irps_result["dependents_deduction"]
    
    total_deductions = irps_tax + inss_employee + medical_aid + loans + other_discounts
    net_salary = gross_salary - total_deductions
    
    return {
        "gross_salary": gross_salary,
        "net_salary": net_salary,
        "irps_tax": irps_tax,
        "inss_employee": inss_employee,
        "inss_employer": inss_employer,
        "medical_aid": medical_aid,
        "loans": loans,
        "other_discounts": other_discounts,
        "total_discounts": total_deductions,
        "dependents": dependents,
        "dependents_deduction": dependents_deduction,
        "irps_calculation_details": irps_result["calculation_details"]
    }

def calculate_gross_from_net(net_salary: float, medical_aid: float = 0, loans: float = 0, other_discounts: float = 0, dependents: int = 0) -> dict:
    """Calculate gross salary from net salary using iterative approach"""
    # Start with an initial guess
    gross_estimate = net_salary * 1.5
    
    # Iteratively refine the gross salary estimate
    for _ in range(100):  # Maximum iterations to prevent infinite loop
        result = calculate_net_from_gross(gross_estimate, medical_aid, loans, other_discounts, dependents)
        
        if abs(result["net_salary"] - net_salary) < 0.01:  # Precision threshold
            break
            
        # Adjust the estimate based on the difference
        difference = net_salary - result["net_salary"]
        gross_estimate += difference * 1.3  # Adjustment factor
        
        if gross_estimate < 0:
            gross_estimate = net_salary
    
    return calculate_net_from_gross(gross_estimate, medical_aid, loans, other_discounts, dependents)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Calculadora Salarial de Moçambique API"}

@api_router.post("/calculate-salary", response_model=CalculationResult)
async def calculate_salary(input_data: CalculationInput):
    try:
        if input_data.calculation_type == "gross_to_net":
            result = calculate_net_from_gross(
                input_data.salary,
                input_data.medical_aid,
                input_data.loans,
                input_data.other_discounts,
                input_data.dependents
            )
        elif input_data.calculation_type == "net_to_gross":
            result = calculate_gross_from_net(
                input_data.salary,
                input_data.medical_aid,
                input_data.loans,
                input_data.other_discounts,
                input_data.dependents
            )
        else:
            raise HTTPException(status_code=400, detail="Tipo de cálculo inválido")
        
        # Create monthly and annual breakdowns
        monthly_breakdown = {
            "salario_bruto": result["gross_salary"],
            "salario_liquido": result["net_salary"],
            "irps": result["irps_tax"],
            "inss_empregado": result["inss_employee"],
            "inss_empregador": result["inss_employer"],
            "seguro_medico": result["medical_aid"],
            "emprestimos": result["loans"],
            "outros_descontos": result["other_discounts"],
            "total_descontos": result["total_discounts"]
        }
        
        annual_breakdown = {key: value * 12 for key, value in monthly_breakdown.items()}
        
        calculation_result = CalculationResult(
            gross_salary=result["gross_salary"],
            net_salary=result["net_salary"],
            irps_tax=result["irps_tax"],
            inss_employee=result["inss_employee"],
            inss_employer=result["inss_employer"],
            medical_aid=result["medical_aid"],
            loans=result["loans"],
            other_discounts=result["other_discounts"],
            total_discounts=result["total_discounts"],
            dependents=result["dependents"],
            dependents_deduction=result["dependents_deduction"],
            monthly_breakdown=monthly_breakdown,
            annual_breakdown=annual_breakdown,
            calculation_type=input_data.calculation_type
        )
        
        # Save to database
        await db.salary_calculations.insert_one(calculation_result.dict())
        
        return calculation_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no cálculo: {str(e)}")

@api_router.get("/calculation-history", response_model=List[CalculationResult])
async def get_calculation_history(limit: int = 10):
    try:
        calculations = await db.salary_calculations.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [CalculationResult(**calc) for calc in calculations]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico: {str(e)}")

@api_router.get("/tax-info")
async def get_tax_info():
    return {
        "irps_matrix": [
            {"faixa": "0 - 20,249.99 MTn", "0_dep": "0 MTn", "1_dep": "0 MTn", "2_dep": "0 MTn", "3_dep": "0 MTn", "4_dep": "0 MTn"},
            {"faixa": "20,250 - 20,749.99 MTn", "0_dep": "0 MTn", "1_dep": "0 MTn", "2_dep": "0 MTn", "3_dep": "0 MTn", "4_dep": "0 MTn"},
            {"faixa": "20,750 - 20,999.99 MTn", "0_dep": "50 MTn", "1_dep": "0 MTn", "2_dep": "0 MTn", "3_dep": "0 MTn", "4_dep": "0 MTn"},
            {"faixa": "21,000 - 21,249.99 MTn", "0_dep": "75 MTn", "1_dep": "25 MTn", "2_dep": "0 MTn", "3_dep": "0 MTn", "4_dep": "0 MTn"},
            {"faixa": "21,250 - 21,749.99 MTn", "0_dep": "100 MTn", "1_dep": "50 MTn", "2_dep": "25 MTn", "3_dep": "0 MTn", "4_dep": "0 MTn"},
            {"faixa": "21,750 - 22,249.99 MTn", "0_dep": "150 MTn", "1_dep": "100 MTn", "2_dep": "75 MTn", "3_dep": "50 MTn", "4_dep": "0 MTn"},
            {"faixa": "22,250 - 32,749.99 MTn", "0_dep": "200 MTn", "1_dep": "150 MTn", "2_dep": "125 MTn", "3_dep": "100 MTn", "4_dep": "50 MTn"},
            {"faixa": "32,750 - 60,749.99 MTn", "0_dep": "1,775 MTn", "1_dep": "1,725 MTn", "2_dep": "1,700 MTn", "3_dep": "1,675 MTn", "4_dep": "1,625 MTn"},
            {"faixa": "60,750 - 144,749.99 MTn", "0_dep": "7,375 MTn", "1_dep": "7,325 MTn", "2_dep": "7,300 MTn", "3_dep": "7,275 MTn", "4_dep": "7,225 MTn"},
            {"faixa": "Acima de 144,750 MTn", "0_dep": "28,375 MTn", "1_dep": "28,325 MTn", "2_dep": "28,300 MTn", "3_dep": "28,275 MTn", "4_dep": "28,225 MTn"}
        ],
        "inss": {
            "empregado": "3%",
            "empregador": "4%",
            "total": "7%"
        },
        "dependentes_info": {
            "descricao": "Valores de IRPS variam conforme número de dependentes (0-4)",
            "nota": "Cônjuge e filhos menores/estudantes até 25 anos"
        },
        "moeda": "Metical Moçambicano (MTn)",
        "ano": "2025",
        "fonte": "Matriz Oficial IRPS - Autoridade Tributária de Moçambique"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()