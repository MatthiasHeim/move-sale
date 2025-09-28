#!/bin/bash

echo "🚀 Setting up Playwright tests for seup.ch image upload functionality..."

# Install Playwright if not already installed
if ! command -v npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm install @playwright/test
    npx playwright install
else
    echo "✅ Playwright is already installed"
fi

echo ""
echo "🧪 Running Image Upload Tests on seup.ch..."
echo "================================================"
echo ""

# Create test results directory
mkdir -p test-results

# Run the specific image upload tests
npx playwright test tests/image-upload.test.ts --reporter=list

echo ""
echo "📊 Test Results Summary:"
echo "========================"

# Check if test results exist and display summary
if [ -f "test-results/results.json" ]; then
    echo "✅ Test results generated successfully"
    echo "📁 Full HTML report available in: playwright-report/index.html"
    echo "📱 To open the report, run: npx playwright show-report"
else
    echo "⚠️  No detailed results file found"
fi

echo ""
echo "🔍 Key Areas Tested:"
echo "- Admin login functionality"
echo "- Create Listing tab navigation"
echo "- Drag and drop upload interface"
echo "- JPEG and PNG image uploads"
echo "- Multiple image upload"
echo "- AI generation functionality"
echo "- API endpoint testing (/api/upload, /api/agent/draft)"
echo "- Error handling and console monitoring"
echo ""
echo "📝 Check the console output above for detailed test results"
echo "🔗 Login URL: https://www.seup.ch/admin/login"
echo "🔑 Admin Password: 2l4se&HH43dom!"
echo ""