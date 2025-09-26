#!/bin/bash

# MöbelMarkt Deployment Test Script

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3

    echo -n "Testing $description... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status)"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local url=$1
    local description=$2

    echo -n "Testing $description... "

    response=$(curl -s "$url")
    status=$?

    if [ $status -eq 0 ] && echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC} (Valid JSON response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Invalid JSON or connection error)"
        return 1
    fi
}

# Check if URL is provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: $0 <deployment-url>${NC}"
    echo "Example: $0 https://mobelmarkt.vercel.app"
    exit 1
fi

BASE_URL=$1

echo "🧪 Testing MöbelMarkt deployment at: $BASE_URL"
echo "=================================================="

# Test counter
total_tests=0
passed_tests=0

# Test homepage
total_tests=$((total_tests + 1))
if test_endpoint "$BASE_URL" 200 "Homepage"; then
    passed_tests=$((passed_tests + 1))
fi

# Test API endpoints
total_tests=$((total_tests + 1))
if test_json_endpoint "$BASE_URL/api/auth/status" "Auth status endpoint"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if test_json_endpoint "$BASE_URL/api/products" "Products endpoint"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if test_json_endpoint "$BASE_URL/api/faqs" "FAQs endpoint"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if test_json_endpoint "$BASE_URL/api/pickup-times" "Pickup times endpoint"; then
    passed_tests=$((passed_tests + 1))
fi

# Test admin routes (should require auth)
total_tests=$((total_tests + 1))
if test_endpoint "$BASE_URL/api/admin/products" 401 "Admin products (unauthorized)"; then
    passed_tests=$((passed_tests + 1))
fi

# Test static assets
total_tests=$((total_tests + 1))
if test_endpoint "$BASE_URL/vite.svg" 200 "Static assets"; then
    passed_tests=$((passed_tests + 1))
fi

# Test SPA routing
total_tests=$((total_tests + 1))
if test_endpoint "$BASE_URL/admin" 200 "SPA routing (admin page)"; then
    passed_tests=$((passed_tests + 1))
fi

echo "=================================================="
echo "Test Results: $passed_tests/$total_tests tests passed"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment looks good.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the deployment.${NC}"
    exit 1
fi