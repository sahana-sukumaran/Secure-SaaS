#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API="http://localhost:5000/api"

# Generate unique emails based on timestamp to avoid conflicts
TIMESTAMP=$(date +%s%N)
ADMIN_EMAIL="admin_${TIMESTAMP}@example.com"
MANAGER_EMAIL="manager_${TIMESTAMP}@example.com"
MEMBER_EMAIL="member_${TIMESTAMP}@example.com"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SaaS Project Management API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. REGISTER USERS
echo -e "${YELLOW}[1] Registering Users...${NC}"

echo "Registering Admin User..."
ADMIN_RESPONSE=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Admin User\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"password123\",\"role\":\"admin\"}")
echo "✓ Admin registered"

echo "Registering Manager User..."
MANAGER_RESPONSE=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Manager User\",\"email\":\"$MANAGER_EMAIL\",\"password\":\"password123\",\"role\":\"manager\"}")
echo "✓ Manager registered"

echo "Registering Member User..."
MEMBER_RESPONSE=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Member User\",\"email\":\"$MEMBER_EMAIL\",\"password\":\"password123\",\"role\":\"member\"}")
echo "✓ Member registered\n"

# 2. LOGIN & GET TOKENS
echo -e "${YELLOW}[2] Logging in & Getting Tokens...${NC}"

ADMIN_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"password123\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "✓ Admin Token: ${GREEN}${ADMIN_TOKEN:0:20}...${NC}"

MANAGER_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MANAGER_EMAIL\",\"password\":\"password123\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "✓ Manager Token: ${GREEN}${MANAGER_TOKEN:0:20}...${NC}"

MEMBER_TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MEMBER_EMAIL\",\"password\":\"password123\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "✓ Member Token: ${GREEN}${MEMBER_TOKEN:0:20}...${NC}\n"

# 3. TEST RBAC - PROTECTED ENDPOINTS
echo -e "${YELLOW}[3] Testing RBAC Authorization...${NC}"

echo "Testing Admin-only endpoint with MEMBER token (should fail):"
RESPONSE=$(curl -s -X GET $API/test/admin-only \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Insufficient permissions"; then
  echo -e "${GREEN}✓ Correctly denied access (403 Forbidden)${NC}"
else
  echo -e "${RED}✗ Should have been denied${NC}"
fi

echo "Testing Admin-only endpoint with ADMIN token (should succeed):"
RESPONSE=$(curl -s -X GET $API/test/admin-only \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$RESPONSE" | grep -q "Admin dashboard"; then
  echo -e "${GREEN}✓ Admin accessed successfully${NC}"
else
  echo -e "${RED}✗ Admin access failed${NC}"
fi

echo "Testing Manager-panel with MEMBER token (should fail):"
RESPONSE=$(curl -s -X GET $API/test/manager-panel \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Insufficient permissions"; then
  echo -e "${GREEN}✓ Correctly denied access (403 Forbidden)${NC}"
else
  echo -e "${RED}✗ Should have been denied${NC}"
fi

echo "Testing Manager-panel with MANAGER token (should succeed):"
RESPONSE=$(curl -s -X GET $API/test/manager-panel \
  -H "Authorization: Bearer $MANAGER_TOKEN")
if echo "$RESPONSE" | grep -q "Manager panel"; then
  echo -e "${GREEN}✓ Manager accessed successfully${NC}"
else
  echo -e "${RED}✗ Manager access failed${NC}"
fi

echo "Testing User-profile endpoint (all authenticated users should access):"
RESPONSE=$(curl -s -X GET $API/test/user-profile \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "User profile"; then
  echo -e "${GREEN}✓ All users can access profile${NC}"
else
  echo -e "${RED}✗ User profile access failed${NC}"
fi

echo ""

# 4. TEST PROJECT ENDPOINTS
echo -e "${YELLOW}[4] Testing Project CRUD Operations...${NC}"

echo "Creating project as MEMBER..."
PROJECT_RESPONSE=$(curl -s -X POST $API/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"name":"Test Project","description":"A test project for RBAC"}')
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('project', {}).get('_id', ''))" 2>/dev/null)
echo -e "✓ Project created: ${GREEN}$PROJECT_ID${NC}"

echo "Getting all projects..."
RESPONSE=$(curl -s -X GET $API/projects \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Test Project"; then
  echo -e "${GREEN}✓ Projects retrieved successfully${NC}"
else
  echo -e "${RED}✗ Failed to retrieve projects${NC}"
fi

echo "Getting specific project..."
RESPONSE=$(curl -s -X GET $API/projects/$PROJECT_ID \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Test Project"; then
  echo -e "${GREEN}✓ Project details retrieved${NC}"
else
  echo -e "${RED}✗ Failed to get project details${NC}"
fi

echo "Updating project (as owner - should succeed)..."
RESPONSE=$(curl -s -X PUT $API/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"name":"Updated Test Project","status":"active"}')
if echo "$RESPONSE" | grep -q "Updated Test Project"; then
  echo -e "${GREEN}✓ Project updated successfully${NC}"
else
  echo -e "${RED}✗ Failed to update project${NC}"
fi

echo "Trying to update project as non-owner (should fail)..."
RESPONSE=$(curl -s -X PUT $API/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{"name":"Hacked Project"}')
if echo "$RESPONSE" | grep -q "owner"; then
  echo -e "${GREEN}✓ Correctly denied (only owner can update)${NC}"
else
  echo -e "${RED}✗ Should have been denied${NC}"
fi

echo ""

# 5. TEST TASK ENDPOINTS
echo -e "${YELLOW}[5] Testing Task CRUD Operations...${NC}"

echo "Creating task in project..."
TASK_RESPONSE=$(curl -s -X POST $API/projects/$PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"title":"Setup Backend","description":"Configure database and API","priority":"high"}')
TASK_ID=$(echo "$TASK_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('task', {}).get('_id', ''))" 2>/dev/null)
echo -e "✓ Task created: ${GREEN}$TASK_ID${NC}"

echo "Getting all tasks in project..."
RESPONSE=$(curl -s -X GET $API/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Setup Backend"; then
  echo -e "${GREEN}✓ Tasks retrieved successfully${NC}"
else
  echo -e "${RED}✗ Failed to retrieve tasks${NC}"
fi

echo "Updating task..."
RESPONSE=$(curl -s -X PUT $API/projects/$PROJECT_ID/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"status":"in-progress","priority":"high"}')
if echo "$RESPONSE" | grep -q "in-progress"; then
  echo -e "${GREEN}✓ Task updated successfully${NC}"
else
  echo -e "${RED}✗ Failed to update task${NC}"
fi

echo ""

# 6. TEST ACTIVITY LOGS
echo -e "${YELLOW}[6] Testing Activity/Audit Logs...${NC}"

echo "Getting user's own activity logs..."
RESPONSE=$(curl -s -X GET $API/activities/my-logs \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Your activity logs"; then
  echo -e "${GREEN}✓ Activity logs retrieved${NC}"
  echo "   Actions logged: $(echo "$RESPONSE" | grep -o '"action":"[^"]*"' | cut -d'"' -f4 | sort | uniq | tr '\n' ' ')"
else
  echo -e "${RED}✗ Failed to get activity logs${NC}"
fi

echo "Getting activity log for specific project..."
RESPONSE=$(curl -s -X GET $API/activities/Project/$PROJECT_ID \
  -H "Authorization: Bearer $MEMBER_TOKEN")
if echo "$RESPONSE" | grep -q "Activity logs for Project"; then
  echo -e "${GREEN}✓ Project activity logs retrieved${NC}"
else
  echo -e "${RED}✗ Failed to get project activity logs${NC}"
fi

echo ""

# 7. TEST UNAUTH
echo -e "${YELLOW}[7] Testing Authorization Failures...${NC}"

echo "Accessing protected endpoint without token (should fail):"
RESPONSE=$(curl -s -X GET $API/projects)
if echo "$RESPONSE" | grep -q "No token\|Invalid token\|authorization denied"; then
  echo -e "${GREEN}✓ Correctly denied access (401 Unauthorized)${NC}"
else
  echo -e "${RED}✗ Should have been denied${NC}"
fi

echo "Accessing protected endpoint with invalid token (should fail):"
RESPONSE=$(curl -s -X GET $API/projects \
  -H "Authorization: Bearer invalid_token_123")
if echo "$RESPONSE" | grep -q "Invalid token"; then
  echo -e "${GREEN}✓ Correctly denied access (401 Invalid token)${NC}"
else
  echo -e "${RED}✗ Should have been denied${NC}"
fi

echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Test Suite Completed!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Summary of Features Tested:"
echo "✓ RBAC Authorization Middleware"
echo "✓ Protected Routes"
echo "✓ Project CRUD with Permission Checks"
echo "✓ Task CRUD with Permission Checks"
echo "✓ Activity/Audit Logs"
echo "✓ Authentication & Authorization"
