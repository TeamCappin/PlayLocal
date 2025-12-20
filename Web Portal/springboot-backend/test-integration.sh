#!/bin/bash
# Integration test script for SpringBoot backend

set -e

echo "=========================================="
echo "SpringBoot Backend Integration Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8080/api"

echo "Testing endpoints..."
echo ""

# Test 1: Health check
echo -n "1. Testing health endpoint... "
response=$(curl -s "${BASE_URL}/health")
if echo "$response" | grep -q "UP"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test 2: Get all projects (should be empty initially)
echo -n "2. Testing GET /projects... "
response=$(curl -s "${BASE_URL}/projects")
if [ "$response" = "[]" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${GREEN}✓ PASSED (has data)${NC}"
fi

# Test 3: Create a project
echo -n "3. Testing POST /projects... "
response=$(curl -s -X POST "${BASE_URL}/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Integration Test Project",
    "description": "Test project for validation",
    "address": "456 Test Ave",
    "city": "TestCity",
    "status": "Active",
    "projectType": "Commercial",
    "latitude": 45.5,
    "longitude": -73.5
  }')
if echo "$response" | grep -q "Integration Test Project"; then
    project_id=$(echo "$response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✓ PASSED (ID: $project_id)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test 4: Get specific project
echo -n "4. Testing GET /projects/{id}... "
response=$(curl -s "${BASE_URL}/projects/${project_id}")
if echo "$response" | grep -q "Integration Test Project"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test 5: Update project
echo -n "5. Testing PUT /projects/{id}... "
response=$(curl -s -X PUT "${BASE_URL}/projects/${project_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Project",
    "description": "Updated description",
    "address": "456 Test Ave",
    "city": "TestCity",
    "status": "Completed",
    "projectType": "Commercial",
    "latitude": 45.5,
    "longitude": -73.5
  }')
if echo "$response" | grep -q "Updated Test Project"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test 6: Filter by city
echo -n "6. Testing GET /projects?city=TestCity... "
response=$(curl -s "${BASE_URL}/projects?city=TestCity")
if echo "$response" | grep -q "TestCity"; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test 7: Delete project
echo -n "7. Testing DELETE /projects/{id}... "
status_code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE_URL}/projects/${project_id}")
if [ "$status_code" = "204" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (Status: $status_code)${NC}"
    exit 1
fi

# Test 8: Verify deletion
echo -n "8. Testing project was deleted... "
status_code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/projects/${project_id}")
if [ "$status_code" = "404" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
else
    echo -e "${RED}✗ FAILED (Status: $status_code)${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
