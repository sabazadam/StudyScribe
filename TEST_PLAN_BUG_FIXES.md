# Test Plan - Bug Fixes Validation

## Overview
This document provides a comprehensive test plan to validate the fixes for Bug 1 (Custom Prompt Race Condition) and Bug 2 (Study Hub Transcript Tab Memory Issue).

---

## Test Environment Setup

### Prerequisites
1. Start the development server: `npm run dev`
2. Ensure you have test files ready:
   - Audio file (e.g., lecture.mp3 or lecture.mp4)
   - PDF slides (optional)
   - Images (optional)
3. Have Study Hub with at least 2 materials:
   - One material WITH transcript (created from audio/video)
   - One material WITHOUT transcript (created from slides/photos only)

---

## Bug 1: Custom Prompt Double Error Race Condition

### Test Suite 1: Initial Custom Prompt Flow

#### Test 1.1: Create Material with Custom Prompt (Happy Path)
**Steps:**
1. Navigate to home page
2. Upload an audio file
3. Click "Continue to Select Material Type"
4. Click "Custom" button
5. VERIFY: Should stay on step 2 (not proceed to step 3)
6. VERIFY: Custom prompt textarea should be visible
7. Enter a custom prompt (e.g., "Create flashcards with definitions")
8. Click "Generate with Custom Prompt" button
9. VERIFY: Should proceed to step 3 (processing)
10. VERIFY: Material should generate successfully
11. VERIFY: No errors displayed

**Expected Result:** ✅ Custom prompt flow works smoothly, material generates correctly

**Actual Result:** _____________

---

#### Test 1.2: Custom Prompt Validation - Empty Prompt
**Steps:**
1. Navigate to home page
2. Upload an audio file
3. Click "Continue to Select Material Type"
4. Click "Custom" button
5. VERIFY: Custom prompt textarea is visible
6. Leave the textarea empty (or enter only whitespace)
7. Click "Generate with Custom Prompt" button
8. VERIFY: Should show error: "Please enter a custom prompt."
9. VERIFY: Should NOT proceed to step 3
10. VERIFY: Should remain on step 2
11. Now enter a valid prompt
12. Click "Generate with Custom Prompt" button
13. VERIFY: Should proceed to step 3 and generate successfully

**Expected Result:** ✅ Empty prompt is rejected with clear error, valid prompt works after

**Actual Result:** _____________

---

#### Test 1.3: Custom Prompt - Button Disabled State
**Steps:**
1. Navigate to home page
2. Upload an audio file
3. Click "Continue to Select Material Type"
4. Click "Custom" button
5. VERIFY: "Generate with Custom Prompt" button is disabled (grayed out)
6. VERIFY: Cursor shows "not-allowed" on hover
7. Type one character in the textarea
8. VERIFY: Button becomes enabled
9. Clear all text (make it empty again)
10. VERIFY: Button becomes disabled again

**Expected Result:** ✅ Button state correctly reflects whether prompt is entered

**Actual Result:** _____________

---

### Test Suite 2: Create Another with Custom Prompt

#### Test 2.1: Create Another - Custom Type Flow
**Steps:**
1. Create a material successfully (any type, e.g., "Exam Prep")
2. Wait for results to display (step 4)
3. Click "Create Another" button
4. In the modal, click "Custom"
5. VERIFY: Modal should close
6. VERIFY: Should return to step 2 (not step 3)
7. VERIFY: outputType should be set to 'custom'
8. VERIFY: Custom prompt textarea should be visible
9. VERIFY: Custom prompt should be EMPTY (cleared from any previous value)
10. Enter a new custom prompt
11. Click "Generate with Custom Prompt"
12. VERIFY: Should generate new material with custom prompt
13. VERIFY: Should use cached extraction (transcript, slides, images)
14. VERIFY: Processing steps should show "Using cached..." messages

**Expected Result:** ✅ Create Another with custom type works, returns to prompt input, uses cached data

**Actual Result:** _____________

---

#### Test 2.2: Create Another - Regular Type Flow (No Regression)
**Steps:**
1. Create a material successfully (any type)
2. Wait for results to display (step 4)
3. Click "Create Another" button
4. In the modal, click "Summary" (or any non-custom type)
5. VERIFY: Modal should close
6. VERIFY: Should proceed DIRECTLY to step 3 (processing)
7. VERIFY: Should NOT show step 2
8. VERIFY: Should generate immediately using cached data
9. VERIFY: Processing steps should show "Using cached..." messages
10. VERIFY: New material should generate successfully

**Expected Result:** ✅ Regular types still work as before (immediate generation), no regression

**Actual Result:** _____________

---

#### Test 2.3: Create Another - Switch Between Types
**Steps:**
1. Create a material with "Exam Prep"
2. Click "Create Another" → Select "Custom"
3. VERIFY: Returns to step 2, custom prompt visible
4. Enter a custom prompt: "Create a summary"
5. Click "Generate with Custom Prompt"
6. Wait for generation to complete
7. Click "Create Another" → Select "Quiz"
8. VERIFY: Should proceed directly to step 3 (no prompt needed for Quiz)
9. VERIFY: Quiz generates successfully
10. Click "Create Another" → Select "Custom" again
11. VERIFY: Prompt field is EMPTY (not showing previous "Create a summary")
12. Enter new prompt: "Create flashcards"
13. Generate successfully

**Expected Result:** ✅ Switching between custom and regular types works correctly, prompt clears each time

**Actual Result:** _____________

---

### Test Suite 3: Edge Cases and Error Handling

#### Test 3.1: Custom Prompt with Only Whitespace
**Steps:**
1. Upload files and reach step 2
2. Click "Custom"
3. Enter only spaces/tabs/newlines in textarea (no actual text)
4. Click "Generate with Custom Prompt"
5. VERIFY: Should show error (whitespace-only counts as empty)
6. VERIFY: Should not proceed to generation

**Expected Result:** ✅ Whitespace-only prompt is rejected

**Actual Result:** _____________

---

#### Test 3.2: Custom Prompt - State Reset
**Steps:**
1. Upload files and reach step 2
2. Click "Custom"
3. Enter a custom prompt
4. Click "Generate with Custom Prompt"
5. Wait for generation to complete
6. Click "Start Over" button
7. Upload files again and reach step 2
8. Click "Custom"
9. VERIFY: Custom prompt textarea should be EMPTY
10. VERIFY: No errors displayed

**Expected Result:** ✅ Reset clears all state including custom prompt

**Actual Result:** _____________

---

#### Test 3.3: Error State Cleanup
**Steps:**
1. Upload files and reach step 2
2. Click "Custom"
3. Try to submit empty prompt → Error appears
4. Now select a different type (e.g., "Summary")
5. VERIFY: Error message should clear
6. VERIFY: Should proceed to generation
7. After completion, click "Start Over"
8. VERIFY: All errors cleared, clean slate

**Expected Result:** ✅ Errors properly cleared when changing types or resetting

**Actual Result:** _____________

---

## Bug 2: Study Hub Transcript Tab Memory Issue

### Test Suite 4: Transcript Tab Switching

#### Test 4.1: Switch from Material WITH Transcript to WITHOUT
**Steps:**
1. Navigate to Study Hub (`/hub`)
2. VERIFY: You have at least one material with transcript and one without
3. Click on a material that HAS a transcript
4. VERIFY: Material modal opens showing "Study Material" and "Transcript" tabs
5. Click "Transcript" tab
6. VERIFY: Transcript is displayed correctly
7. Close the modal
8. Click on a different material that does NOT have a transcript
9. VERIFY: Modal opens and shows "Study Material" tab (NOT transcript tab)
10. VERIFY: Content is displayed (not blank page)
11. VERIFY: "Transcript" button shows "(Not available)" text
12. VERIFY: "Transcript" button is grayed out and disabled

**Expected Result:** ✅ Automatically switches to content tab when new material has no transcript

**Actual Result:** _____________

---

#### Test 4.2: Transcript Button Disabled State
**Steps:**
1. Navigate to Study Hub
2. Click on a material WITHOUT transcript
3. VERIFY: "Transcript" button is visible but disabled
4. VERIFY: Button has opacity-50 (grayed out appearance)
5. VERIFY: Cursor shows "not-allowed" on hover
6. VERIFY: Button text shows "Transcript (Not available)"
7. Hover over the button
8. VERIFY: Tooltip appears: "No transcript available for this material"
9. Try clicking the disabled button
10. VERIFY: Nothing happens (click is prevented)
11. Close modal and open a material WITH transcript
12. VERIFY: "Transcript" button is enabled and clickable
13. VERIFY: No "(Not available)" text shown

**Expected Result:** ✅ Disabled state properly prevents interaction and shows clear visual feedback

**Actual Result:** _____________

---

#### Test 4.3: Fallback UI for Missing Transcript
**Steps:**
1. Navigate to Study Hub
2. Click on a material WITHOUT transcript
3. Use browser dev tools to manually set activeTab state to 'transcript'
   - Open React DevTools
   - Find MaterialModal component
   - Set activeTab to 'transcript'
4. VERIFY: Should display fallback UI (not blank page)
5. VERIFY: Shows icon (article_off)
6. VERIFY: Shows message: "No transcript available for this material"
7. VERIFY: Shows sub-message: "This material was created without an audio/video source"
8. VERIFY: Shows "View Study Material" button
9. Click "View Study Material" button
10. VERIFY: Switches to content tab and shows material

**Expected Result:** ✅ Fallback UI handles edge case gracefully

**Actual Result:** _____________

---

#### Test 4.4: Multiple Material Switching
**Steps:**
1. Navigate to Study Hub with at least 3 materials (mix of with/without transcripts)
2. Click Material A (has transcript)
3. Click "Transcript" tab → Verify transcript shows
4. Close modal
5. Click Material B (no transcript)
6. VERIFY: Opens on "Study Material" tab (auto-switched)
7. Close modal
8. Click Material C (has transcript)
9. Click "Transcript" tab → Verify transcript shows
10. Close modal
11. Click Material B again (no transcript)
12. VERIFY: Opens on "Study Material" tab again
13. Repeat steps 2-12 several times
14. VERIFY: Consistent behavior every time

**Expected Result:** ✅ Tab state properly resets for each material regardless of order

**Actual Result:** _____________

---

#### Test 4.5: Normal Transcript Viewing (No Regression)
**Steps:**
1. Navigate to Study Hub
2. Click on a material that HAS a transcript
3. VERIFY: Modal opens on "Study Material" tab by default
4. Click "Transcript" tab
5. VERIFY: Tab switches smoothly
6. VERIFY: Transcript is displayed in monospace font
7. VERIFY: Transcript is readable and formatted correctly
8. VERIFY: Can scroll through long transcripts
9. Click "Study Material" tab
10. VERIFY: Switches back to content
11. Toggle between tabs multiple times
12. VERIFY: Both tabs work correctly

**Expected Result:** ✅ Normal transcript functionality unchanged and working perfectly

**Actual Result:** _____________

---

## Regression Testing

### Test Suite 5: Ensure No Breaking Changes

#### Test 5.1: Standard Material Generation Flow
**Steps:**
1. Upload audio/slides/photos
2. Select "Exam Prep" (or any non-custom type)
3. VERIFY: Proceeds directly to processing (step 3)
4. VERIFY: Generates successfully
5. Repeat with "Summary", "Quiz", "Mock Exam", "Explain"
6. VERIFY: All types work as before

**Expected Result:** ✅ Non-custom types unchanged

**Actual Result:** _____________

---

#### Test 5.2: File Upload Flow
**Steps:**
1. Test audio file upload
2. Test slide upload (single and multiple)
3. Test photo upload (single and multiple)
4. Test removing files
5. Test instructor materials selection
6. VERIFY: All file operations work correctly

**Expected Result:** ✅ File handling unchanged

**Actual Result:** _____________

---

#### Test 5.3: Save to Hub Flow
**Steps:**
1. Generate a material
2. Click "Save to Hub"
3. VERIFY: Saves successfully
4. Navigate to Study Hub
5. VERIFY: Material appears in list
6. Click material to open
7. VERIFY: Content and transcript (if applicable) are saved correctly

**Expected Result:** ✅ Save functionality unchanged

**Actual Result:** _____________

---

## Browser Compatibility Testing

### Test Suite 6: Cross-Browser Validation

Test all scenarios above in:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Testing

### Test Suite 7: Performance Validation

#### Test 7.1: No Performance Regression
**Steps:**
1. Use browser DevTools Performance tab
2. Record during material generation with custom prompt
3. VERIFY: No significant performance degradation
4. Check for memory leaks
5. VERIFY: useEffect doesn't cause infinite loops

**Expected Result:** ✅ No performance issues introduced

**Actual Result:** _____________

---

## Summary Checklist

### Bug 1: Custom Prompt Race Condition
- [ ] Test 1.1: Happy path works
- [ ] Test 1.2: Empty prompt validation
- [ ] Test 1.3: Button disabled state
- [ ] Test 2.1: Create Another with custom type
- [ ] Test 2.2: Create Another with regular type (no regression)
- [ ] Test 2.3: Switch between types
- [ ] Test 3.1: Whitespace validation
- [ ] Test 3.2: State reset
- [ ] Test 3.3: Error cleanup

### Bug 2: Transcript Tab Memory Issue
- [ ] Test 4.1: Switch from WITH to WITHOUT transcript
- [ ] Test 4.2: Disabled button state
- [ ] Test 4.3: Fallback UI
- [ ] Test 4.4: Multiple material switching
- [ ] Test 4.5: Normal transcript viewing (no regression)

### Regression Tests
- [ ] Test 5.1: Standard material generation
- [ ] Test 5.2: File upload flow
- [ ] Test 5.3: Save to hub

### Cross-Browser
- [ ] All tests pass in Chrome
- [ ] All tests pass in Firefox
- [ ] All tests pass in Safari
- [ ] All tests pass in Edge
- [ ] All tests pass on Mobile

### Performance
- [ ] Test 7.1: No performance regression

---

## Notes for Tester

1. **Test Data Setup**: Ensure you have materials in Study Hub before testing Bug 2
2. **Clear State**: Use browser dev tools to clear localStorage if needed between test runs
3. **Console Errors**: Check browser console for any errors during testing
4. **Visual Inspection**: Verify UI elements appear correctly (buttons, colors, spacing)
5. **Accessibility**: Test keyboard navigation and screen reader compatibility

---

## Issue Reporting Template

If you find an issue, report it with:
```
**Test Case:** [Test number and name]
**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Steps to Reproduce:** [Detailed steps]
**Browser:** [Browser and version]
**Screenshots:** [If applicable]
**Console Errors:** [Any errors in console]
```

---

## Sign-off

**Tester Name:** _____________
**Date:** _____________
**Overall Status:** [ ] PASS [ ] FAIL [ ] PARTIAL
**Notes:** _____________________________________________
