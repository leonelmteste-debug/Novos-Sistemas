#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Create an android app that may calculate Net Salary ou Gross Salary based on Mozambique Tax table (IRPS) and INSS. It has to have an option of choosing wether is the gross or Net that we are calculating, should include as fields target salary (wether gross or Net), Discounts ( Medical Aid, Loans, Other), it show IRPS and INSS calculated"

backend:
  - task: "Implement IRPS tax calculation with progressive brackets (10%-32%)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Implemented progressive tax calculation with brackets based on 2025 Mozambique tax rates. Need to test calculations."
      - working: true
        agent: "testing"
        comment: "✅ VERIFIED: IRPS tax calculation working correctly. Tested all 6 brackets (0%, 10%, 15%, 20%, 25%, 32%). Progressive taxation applied accurately across salary ranges from 15K to 300K MTn. Tax-free threshold at 18,750 MTn confirmed."

  - task: "Implement INSS calculation (3% employee + 4% employer)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Implemented INSS calculation with official rates. Need to test calculations."
      - working: true
        agent: "testing"
        comment: "✅ VERIFIED: INSS calculation working correctly. Employee contribution: 3%, Employer contribution: 4%. Tested across multiple salary ranges and calculations are accurate."

  - task: "Create salary calculation API endpoints"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Created POST /api/calculate-salary endpoint with gross-to-net and net-to-gross calculations. Need to test API calls."
      - working: true
        agent: "testing"
        comment: "✅ VERIFIED: All API endpoints working. GET /api/ (health check), POST /api/calculate-salary (main calculation), GET /api/calculation-history (data retrieval), GET /api/tax-info (tax brackets info). MongoDB integration confirmed - calculations saved and retrieved successfully."

  - task: "Implement gross-to-net and net-to-gross conversion algorithms"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Implemented both calculation directions with iterative approach for net-to-gross. Need to verify accuracy."
      - working: true
        agent: "testing"
        comment: "✅ VERIFIED: Both calculation directions working accurately. Gross-to-net: Direct calculation with all deductions. Net-to-gross: Iterative approach converges correctly within 100 MTn tolerance. Tested with realistic Mozambican salaries (35K-200K MTn range)."

frontend:
  - task: "Create mobile UI with Portuguese interface"
    implemented: true
    working: "unknown"
    file: "index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Built complete mobile interface in Portuguese with React Native components. Need to test UI functionality."

  - task: "Implement calculation type selector (gross-to-net / net-to-gross)"
    implemented: true
    working: "unknown"
    file: "index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Created toggle buttons for calculation type selection. Need to test state management."

  - task: "Create input forms for salary and discounts"
    implemented: true
    working: "unknown"
    file: "index.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Built input forms for salary, medical aid, loans, and other discounts. Need to test validation."

  - task: "Display calculation results with monthly/annual breakdown"
    implemented: true
    working: "unknown"
    file: "index.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "unknown"
        agent: "main"
        comment: "Created results display with toggle between monthly and annual views. Need to test data formatting."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Implement IRPS tax calculation with progressive brackets (10%-32%)"
    - "Implement INSS calculation (3% employee + 4% employer)"
    - "Create salary calculation API endpoints"
    - "Implement gross-to-net and net-to-gross conversion algorithms"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Completed initial implementation of Mozambique salary calculator with tax logic and mobile UI. Ready for backend testing to validate IRPS and INSS calculations accuracy."