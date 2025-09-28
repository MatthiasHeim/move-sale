# Image Upload Functionality Test Guide - seup.ch

## Overview
This guide provides comprehensive testing for the image upload functionality on your production website https://www.seup.ch. The tests are designed to identify issues with the upload API endpoints and HEIC image processing that were previously causing 405 Method Not Allowed errors.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
# Run the automated test runner
./run-image-upload-tests.sh

# Or run tests manually
npm run test:upload
```

### 3. View Results
```bash
# Open the HTML test report
npx playwright show-report
```

## Test Coverage

### Authentication Tests
- ✅ **Admin Login Flow**: Tests login with credentials `2l4se&HH43dom!`
- ✅ **Session Management**: Verifies proper session creation and persistence
- ✅ **Navigation**: Ensures successful redirect to admin panel

### Upload Interface Tests
- ✅ **Create Listing Tab**: Navigation and interface loading
- ✅ **Drag & Drop Area**: Visual elements and interaction states
- ✅ **File Input**: Hidden file input functionality
- ✅ **Upload Instructions**: User guidance text display

### Image Upload Tests
- ✅ **JPEG Upload**: Single JPEG image upload and processing
- ✅ **PNG Upload**: Single PNG image upload and processing
- ✅ **Multiple Upload**: Batch upload of multiple images
- ✅ **Preview Display**: Verification of uploaded image previews
- ✅ **Error Handling**: Invalid file type rejection

### API Endpoint Tests
- ✅ **POST /api/upload**: Direct API testing for upload functionality
- ✅ **POST /api/agent/draft**: AI generation endpoint testing
- ✅ **Response Validation**: Status codes and response structure
- ✅ **Error Detection**: 405 Method Not Allowed and other errors

### AI Generation Tests
- ✅ **AI Button Availability**: KI-Vorschlag button presence and state
- ✅ **Generation Process**: Full AI workflow from image to description
- ✅ **Form Population**: Verification of auto-filled product details
- ✅ **Timeout Handling**: Long-running AI request management

### Error Monitoring
- ✅ **Console Errors**: JavaScript errors and warnings detection
- ✅ **Network Failures**: Failed HTTP requests monitoring
- ✅ **Error Messages**: User-facing error display
- ✅ **Recovery**: Error state recovery testing

## Key Focus Areas

### 1. HEIC Image Processing
The tests specifically address previous HEIC processing issues:
- Tests both JPEG and PNG formats (HEIC conversion happens server-side)
- Monitors for processing errors during upload
- Verifies proper image display after conversion

### 2. API Endpoint Issues
Previous 405 Method Not Allowed errors are specifically tested:
- Direct API calls to `/api/upload` and `/api/agent/draft`
- Method verification (POST requests)
- Authentication state during API calls
- Error response analysis

### 3. Production Environment
Tests run against the live production environment:
- Real authentication system
- Actual file upload and processing
- Live AI integration with OpenAI
- Production database interactions

## Test Results Interpretation

### ✅ Success Indicators
- Login completes successfully
- Upload interface loads without errors
- Images upload and display correctly
- API endpoints return 200 status codes
- AI generation populates form fields
- No console or network errors

### ❌ Failure Indicators
- 405 Method Not Allowed errors on API endpoints
- Upload interface fails to load
- Images don't appear in preview after upload
- Console errors during upload process
- Network request failures
- Authentication issues

### ⚠️ Warning Signs
- Slow upload times (> 30 seconds)
- Partial image display
- AI generation timeouts
- Non-critical console warnings

## Manual Testing Checklist

If you prefer manual testing, follow these steps:

### 1. Admin Access
- [ ] Navigate to https://www.seup.ch/admin/login
- [ ] Enter password: `2l4se&HH43dom!`
- [ ] Verify successful login and redirect

### 2. Upload Interface
- [ ] Click on "Create Listing" tab
- [ ] Verify drag-and-drop area is visible
- [ ] Check for upload instructions in German

### 3. Image Upload
- [ ] Prepare test images (JPEG, PNG, HEIC if available)
- [ ] Drag images to upload area or use file picker
- [ ] Monitor network tab for API calls
- [ ] Verify images appear in preview section

### 4. AI Generation
- [ ] After uploading images, click "KI-Vorschlag" button
- [ ] Wait for AI processing (up to 30 seconds)
- [ ] Check if form fields auto-populate
- [ ] Verify German product descriptions

### 5. Error Checking
- [ ] Open browser developer tools
- [ ] Check Console tab for JavaScript errors
- [ ] Check Network tab for failed requests
- [ ] Note any 405 or other HTTP errors

## Common Issues and Solutions

### 405 Method Not Allowed
**Symptoms**: Upload fails with 405 error
**Cause**: API route not properly configured for POST requests
**Check**: Server route configuration for `/api/upload`

### HEIC Processing Errors
**Symptoms**: HEIC images fail to upload or convert
**Cause**: Server-side HEIC conversion issues
**Check**: Server logs for `heic-convert` errors

### AI Generation Timeouts
**Symptoms**: AI button doesn't respond or times out
**Cause**: OpenAI API issues or long processing times
**Check**: OpenAI API key configuration and rate limits

### Upload Interface Not Loading
**Symptoms**: Drag-drop area missing or broken
**Cause**: JavaScript bundle or component errors
**Check**: Console errors and network requests

## Browser Compatibility

The tests run across multiple browsers:
- **Desktop Chrome**: Primary testing browser
- **Desktop Firefox**: Cross-browser compatibility
- **Desktop Safari**: WebKit engine testing
- **Mobile Chrome**: Mobile device simulation
- **Mobile Safari**: iOS device simulation

## Running Specific Tests

```bash
# Run only login tests
npx playwright test -g "Admin Login"

# Run only upload tests
npx playwright test -g "Upload"

# Run only API tests
npx playwright test -g "API"

# Run with browser visible (for debugging)
npm run test:headed

# Run with interactive UI
npm run test:ui
```

## Debugging Failed Tests

### 1. Screenshots
Failed tests automatically capture screenshots at the point of failure.
Location: `test-results/`

### 2. Video Recording
Test execution videos are recorded for failed tests.
Location: `test-results/`

### 3. Network Traces
Full network activity is captured during test execution.
View: In the HTML report under "Network" tab

### 4. Console Logs
All browser console output is captured and displayed in test results.

## Production Considerations

### Data Safety
- Tests use minimal test images (1x1 pixel)
- Uploaded test files are small and temporary
- No production data is modified
- Test images may remain in uploads folder

### Performance Impact
- Tests run sequentially to minimize server load
- Upload size limits are respected
- Reasonable timeouts prevent hanging tests

### Clean Up
After testing, you may want to:
- Remove test images from uploads folder
- Clear any test data from database
- Review server logs for any issues

## Support and Troubleshooting

If tests fail or you encounter issues:

1. **Check Server Status**: Ensure seup.ch is accessible
2. **Verify Credentials**: Confirm admin password is correct
3. **Review Logs**: Check server logs for errors
4. **Test Manually**: Use the manual checklist above
5. **Browser Updates**: Ensure browsers are up-to-date

## Test File Locations

- Main test file: `/tests/image-upload.test.ts`
- Configuration: `/playwright.config.ts`
- Global setup: `/tests/global-setup.ts`
- Test runner: `/run-image-upload-tests.sh`
- This guide: `/IMAGE_UPLOAD_TEST_GUIDE.md`

---

**Last Updated**: 2025-09-28
**Target URL**: https://www.seup.ch
**Admin Password**: 2l4se&HH43dom!