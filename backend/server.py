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

# IRPS tax brackets for 2025 (based on official matrix provided)
# Values are monthly amounts in MTn
IRPS_BRACKETS = [
    TaxBracket(min_amount=0, max_amount=20249.99, rate=0.0),        # 0% até 20,249.99 MTn
    TaxBracket(min_amount=20250, max_amount=20749.99, rate=0.0),    # 0% de 20,250 a 20,749.99 MTn
    TaxBracket(min_amount=20750, max_amount=20999.99, rate=0.10),   # 10% de 20,750 a 20,999.99 MTn
    TaxBracket(min_amount=21000, max_amount=21249.99, rate=0.10),   # 10% de 21,000 a 21,249.99 MTn
    TaxBracket(min_amount=21250, max_amount=21749.99, rate=0.10),   # 10% de 21,250 a 21,749.99 MTn
    TaxBracket(min_amount=21750, max_amount=22249.99, rate=0.10),   # 10% de 21,750 a 22,249.99 MTn
    TaxBracket(min_amount=22250, max_amount=32749.99, rate=0.15),   # 15% de 22,250 a 32,749.99 MTn
    TaxBracket(min_amount=32750, max_amount=60749.99, rate=0.20),   # 20% de 32,750 a 60,749.99 MTn
    TaxBracket(min_amount=60750, max_amount=144749.99, rate=0.25),  # 25% de 60,750 a 144,749.99 MTn
    TaxBracket(min_amount=144750, max_amount=None, rate=0.32),      # 32% acima de 144,750 MTn
]

# INSS rates
INSS_EMPLOYEE_RATE = 0.03  # 3%
INSS_EMPLOYER_RATE = 0.04  # 4%

# Dependents deduction (official value from AT Moçambique for 2025)
DEPENDENTS_DEDUCTION_PER_MONTH = 200  # MTn per dependent per month (official value)

def calculate_irps_tax(monthly_salary: float, dependents: int = 0) -> tuple:
    """Calculate IRPS tax based on progressive brackets with dependents deduction"""
    # Calculate dependents deduction
    dependents_deduction = dependents * DEPENDENTS_DEDUCTION_PER_MONTH
    
    # Apply deduction to salary (taxable income)
    taxable_salary = max(0, monthly_salary - dependents_deduction)
    
    tax = 0.0
    
    for bracket in IRPS_BRACKETS:
        if bracket.max_amount is None:
            # Highest bracket
            if taxable_salary > bracket.min_amount:
                taxable_amount = taxable_salary - bracket.min_amount
                tax += taxable_amount * bracket.rate
        else:
            # Regular bracket
            if taxable_salary > bracket.min_amount:
                taxable_amount = min(taxable_salary, bracket.max_amount) - bracket.min_amount
                tax += taxable_amount * bracket.rate
    
    return tax, dependents_deduction

def calculate_inss(monthly_salary: float) -> tuple:
    """Calculate INSS contributions for employee and employer"""
    employee_contribution = monthly_salary * INSS_EMPLOYEE_RATE
    employer_contribution = monthly_salary * INSS_EMPLOYER_RATE
    return employee_contribution, employer_contribution

def calculate_net_from_gross(gross_salary: float, medical_aid: float = 0, loans: float = 0, other_discounts: float = 0, dependents: int = 0) -> dict:
    """Calculate net salary from gross salary"""
    irps_tax, dependents_deduction = calculate_irps_tax(gross_salary, dependents)
    inss_employee, inss_employer = calculate_inss(gross_salary)
    
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
        "dependents_deduction": dependents_deduction
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
        "irps_brackets": [
            {"faixa": "0 - 20,249.99 MTn", "taxa": "0%", "descricao": "Isento - Primeira faixa"},
            {"faixa": "20,250 - 20,749.99 MTn", "taxa": "0%", "descricao": "Isento - Segunda faixa"},
            {"faixa": "20,750 - 20,999.99 MTn", "taxa": "10%", "descricao": "Primeira faixa tributável"},
            {"faixa": "21,000 - 21,249.99 MTn", "taxa": "10%", "descricao": "Segunda faixa 10%"},
            {"faixa": "21,250 - 21,749.99 MTn", "taxa": "10%", "descricao": "Terceira faixa 10%"},
            {"faixa": "21,750 - 22,249.99 MTn", "taxa": "10%", "descricao": "Quarta faixa 10%"},
            {"faixa": "22,250 - 32,749.99 MTn", "taxa": "15%", "descricao": "Faixa de 15%"},
            {"faixa": "32,750 - 60,749.99 MTn", "taxa": "20%", "descricao": "Faixa de 20%"},
            {"faixa": "60,750 - 144,749.99 MTn", "taxa": "25%", "descricao": "Faixa de 25%"},
            {"faixa": "Acima de 144,750 MTn", "taxa": "32%", "descricao": "Faixa máxima de 32%"}
        ],
        "inss": {
            "empregado": "3%",
            "empregador": "4%",
            "total": "7%"
        },
        "moeda": "Metical Moçambicano (MTn)",
        "ano": "2025",
        "fonte": "Matriz Oficial IRPS - Governo de Moçambique"
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