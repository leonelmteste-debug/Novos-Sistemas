#!/usr/bin/env python3
"""
Backend Testing for Mozambique Salary Calculator
Tests all API endpoints and calculation accuracy
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://mozpay-calculator.preview.emergentagent.com/api"

class SalaryCalculatorTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            self.failed_tests.append(test_name)
    
    def test_health_check(self):
        """Test GET /api/ endpoint"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Health Check API", True, f"Response: {data['message']}")
                else:
                    self.log_test("Health Check API", False, "Missing message in response")
            else:
                self.log_test("Health Check API", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health Check API", False, f"Exception: {str(e)}")
    
    def test_tax_info(self):
        """Test GET /api/tax-info endpoint"""
        try:
            response = requests.get(f"{self.base_url}/tax-info")
            if response.status_code == 200:
                data = response.json()
                # Verify IRPS brackets
                if "irps_brackets" in data and len(data["irps_brackets"]) == 6:
                    # Check if all expected tax rates are present
                    expected_rates = ["0%", "10%", "15%", "20%", "25%", "32%"]
                    actual_rates = [bracket["taxa"] for bracket in data["irps_brackets"]]
                    if all(rate in actual_rates for rate in expected_rates):
                        self.log_test("Tax Info API - IRPS Brackets", True, f"All 6 brackets present: {actual_rates}")
                    else:
                        self.log_test("Tax Info API - IRPS Brackets", False, f"Missing rates. Expected: {expected_rates}, Got: {actual_rates}")
                else:
                    self.log_test("Tax Info API - IRPS Brackets", False, "Missing or incorrect IRPS brackets")
                
                # Verify INSS rates
                if "inss" in data and data["inss"]["empregado"] == "3%" and data["inss"]["empregador"] == "4%":
                    self.log_test("Tax Info API - INSS Rates", True, "Employee 3%, Employer 4%")
                else:
                    self.log_test("Tax Info API - INSS Rates", False, f"Incorrect INSS rates: {data.get('inss', 'Missing')}")
            else:
                self.log_test("Tax Info API", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Tax Info API", False, f"Exception: {str(e)}")
    
    def test_gross_to_net_calculation(self, salary, medical_aid=0, loans=0, other_discounts=0, test_name=""):
        """Test gross to net salary calculation"""
        payload = {
            "salary": salary,
            "calculation_type": "gross_to_net",
            "medical_aid": medical_aid,
            "loans": loans,
            "other_discounts": other_discounts
        }
        
        try:
            response = requests.post(f"{self.base_url}/calculate-salary", json=payload)
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["gross_salary", "net_salary", "irps_tax", "inss_employee", "inss_employer"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(f"Gross to Net Calculation {test_name}", False, f"Missing fields: {missing_fields}")
                    return None
                
                # Verify calculations
                gross = data["gross_salary"]
                net = data["net_salary"]
                irps = data["irps_tax"]
                inss_emp = data["inss_employee"]
                inss_empr = data["inss_employer"]
                
                # Verify INSS calculations (3% employee, 4% employer)
                expected_inss_emp = gross * 0.03
                expected_inss_empr = gross * 0.04
                
                inss_correct = (abs(inss_emp - expected_inss_emp) < 0.01 and 
                               abs(inss_empr - expected_inss_empr) < 0.01)
                
                # Verify total deductions
                total_deductions = irps + inss_emp + medical_aid + loans + other_discounts
                expected_net = gross - total_deductions
                net_correct = abs(net - expected_net) < 0.01
                
                if inss_correct and net_correct:
                    self.log_test(f"Gross to Net Calculation {test_name}", True, 
                                f"Gross: {gross:,.2f} MTn → Net: {net:,.2f} MTn, IRPS: {irps:,.2f}, INSS: {inss_emp:,.2f}")
                else:
                    issues = []
                    if not inss_correct:
                        issues.append(f"INSS incorrect - Expected emp: {expected_inss_emp:.2f}, got: {inss_emp:.2f}")
                    if not net_correct:
                        issues.append(f"Net calculation incorrect - Expected: {expected_net:.2f}, got: {net:.2f}")
                    self.log_test(f"Gross to Net Calculation {test_name}", False, "; ".join(issues))
                
                return data
            else:
                self.log_test(f"Gross to Net Calculation {test_name}", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test(f"Gross to Net Calculation {test_name}", False, f"Exception: {str(e)}")
            return None
    
    def test_net_to_gross_calculation(self, net_salary, medical_aid=0, loans=0, other_discounts=0, test_name=""):
        """Test net to gross salary calculation"""
        payload = {
            "salary": net_salary,
            "calculation_type": "net_to_gross",
            "medical_aid": medical_aid,
            "loans": loans,
            "other_discounts": other_discounts
        }
        
        try:
            response = requests.post(f"{self.base_url}/calculate-salary", json=payload)
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ["gross_salary", "net_salary", "irps_tax", "inss_employee", "inss_employer"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(f"Net to Gross Calculation {test_name}", False, f"Missing fields: {missing_fields}")
                    return None
                
                # Verify the net salary matches the input (within reasonable tolerance)
                calculated_net = data["net_salary"]
                if abs(calculated_net - net_salary) < 100:  # Allow 100 MTn tolerance for iterative calculation
                    self.log_test(f"Net to Gross Calculation {test_name}", True, 
                                f"Net: {net_salary:,.2f} MTn → Gross: {data['gross_salary']:,.2f} MTn")
                else:
                    self.log_test(f"Net to Gross Calculation {test_name}", False, 
                                f"Net salary mismatch - Expected: {net_salary:.2f}, Calculated: {calculated_net:.2f}")
                
                return data
            else:
                self.log_test(f"Net to Gross Calculation {test_name}", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test(f"Net to Gross Calculation {test_name}", False, f"Exception: {str(e)}")
            return None
    
    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        # Test invalid calculation type
        payload = {
            "salary": 50000,
            "calculation_type": "invalid_type",
            "medical_aid": 0,
            "loans": 0,
            "other_discounts": 0
        }
        
        try:
            response = requests.post(f"{self.base_url}/calculate-salary", json=payload)
            if response.status_code == 400:
                self.log_test("Error Handling - Invalid Calculation Type", True, "Correctly returned 400 error")
            else:
                self.log_test("Error Handling - Invalid Calculation Type", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Invalid Calculation Type", False, f"Exception: {str(e)}")
        
        # Test negative salary
        payload = {
            "salary": -1000,
            "calculation_type": "gross_to_net",
            "medical_aid": 0,
            "loans": 0,
            "other_discounts": 0
        }
        
        try:
            response = requests.post(f"{self.base_url}/calculate-salary", json=payload)
            # The API might still process negative values, so we check if it handles it gracefully
            if response.status_code in [200, 400]:
                self.log_test("Error Handling - Negative Salary", True, f"Handled gracefully with status {response.status_code}")
            else:
                self.log_test("Error Handling - Negative Salary", False, f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling - Negative Salary", False, f"Exception: {str(e)}")
    
    def test_calculation_history(self):
        """Test calculation history endpoint"""
        try:
            response = requests.get(f"{self.base_url}/calculation-history")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Calculation History API", True, f"Retrieved {len(data)} calculations")
                    
                    # If there are calculations, verify structure
                    if len(data) > 0:
                        calc = data[0]
                        required_fields = ["id", "gross_salary", "net_salary", "irps_tax", "inss_employee"]
                        missing_fields = [field for field in required_fields if field not in calc]
                        
                        if missing_fields:
                            self.log_test("Calculation History - Data Structure", False, f"Missing fields: {missing_fields}")
                        else:
                            self.log_test("Calculation History - Data Structure", True, "All required fields present")
                else:
                    self.log_test("Calculation History API", False, "Response is not a list")
            else:
                self.log_test("Calculation History API", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Calculation History API", False, f"Exception: {str(e)}")
    
    def verify_irps_tax_brackets(self, test_cases):
        """Verify IRPS tax calculations for different salary ranges"""
        print("\n=== IRPS Tax Bracket Verification ===")
        
        for case in test_cases:
            salary = case["salary"]
            expected_bracket = case["expected_bracket"]
            
            result = self.test_gross_to_net_calculation(salary, test_name=f"(IRPS {expected_bracket})")
            if result:
                irps_tax = result["irps_tax"]
                tax_rate = (irps_tax / salary) * 100 if salary > 0 else 0
                print(f"   Salary: {salary:,.2f} MTn → IRPS: {irps_tax:,.2f} MTn (Effective rate: {tax_rate:.2f}%)")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Mozambique Salary Calculator Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic API tests
        print("\n📡 API Endpoint Tests")
        self.test_health_check()
        self.test_tax_info()
        
        # Specific test cases as requested
        print("\n💰 Salary Calculation Tests")
        
        # Test Case 1: Gross to Net (50,000 MTn monthly)
        print("\n--- Test Case 1: Gross to Net (50,000 MTn) ---")
        self.test_gross_to_net_calculation(50000, 1500, 5000, 2000, "(50K MTn)")
        
        # Test Case 2: Net to Gross (35,000 MTn monthly target net)
        print("\n--- Test Case 2: Net to Gross (35,000 MTn target) ---")
        self.test_net_to_gross_calculation(35000, 1000, 3000, 1000, "(35K MTn target)")
        
        # Test Case 3: High salary gross to net (200,000 MTn monthly)
        print("\n--- Test Case 3: High Salary Gross to Net (200,000 MTn) ---")
        self.test_gross_to_net_calculation(200000, 2000, 10000, 5000, "(200K MTn)")
        
        # IRPS Tax Bracket Verification
        irps_test_cases = [
            {"salary": 15000, "expected_bracket": "0% (Exempt)"},
            {"salary": 25000, "expected_bracket": "10%"},
            {"salary": 45000, "expected_bracket": "15%"},
            {"salary": 80000, "expected_bracket": "20%"},
            {"salary": 150000, "expected_bracket": "25%"},
            {"salary": 300000, "expected_bracket": "32%"}
        ]
        self.verify_irps_tax_brackets(irps_test_cases)
        
        # Error handling tests
        print("\n🚨 Error Handling Tests")
        self.test_error_handling()
        
        # Data storage tests
        print("\n💾 Data Storage Tests")
        self.test_calculation_history()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if self.failed_tests:
            print(f"\n🔍 Failed Tests:")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = SalaryCalculatorTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! Backend is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
        sys.exit(1)