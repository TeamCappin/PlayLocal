# US 7.15: Integration Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing all US 7.15 action feedback and confirmation features in a production-like environment.

---

## Prerequisites

### 1. Backend Running
```bash
cd playlocal/backend
./mvnw spring-boot:run
```
Backend should be accessible at `http://localhost:8080`

### 2. Frontend Running
```bash
cd playlocal/frontend
npm run dev
```
Frontend should be accessible at `http://localhost:3000`

### 3. Test Accounts
- **User A**: Primary test account (organizer)
- **User B**: Secondary test account (participant)

---

## Test Scenarios

### ✅ Test 1: Create Game - Success Flow

**Steps:**
1. Log in as User A
2. Navigate to "Create Game" page
3. Fill in all required fields:
   - Title: "Test Game - US 7.15"
   - Sport: Basketball
   - Date: Tomorrow
   - Time: 2:00 PM
   - Location: Any valid address
   - Max players: 10
4. Click "Create Game"

**Expected Results:**
- ✅ Loading spinner appears on button
- ✅ Button disabled during creation
- ✅ Green toast appears: "Game created"
- ✅ Redirects to game details page
- ✅ Game appears in Discover page

**Edge Cases:**
- Validation error (missing required field):
  - Form validation prevents submission
  - Red error messages appear under invalid fields

---

### ✅ Test 2: Edit Game - Success Flow

**Steps:**
1. As User A (organizer), open the game created in Test 1
2. Click "Edit Game" button
3. Change description to "Updated description for US 7.15"
4. Click "Save Changes"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Button disabled during update
- ✅ Green toast appears: "Game updated"
- ✅ Modal closes
- ✅ Updated description visible immediately
- ✅ No page refresh needed

**Edge Cases:**
- Cancel edit:
  - Changes discarded
  - No toast shown
  - Modal closes

---

### ✅ Test 3: Delete Game - Confirmation & Success

**Steps:**
1. As User A (organizer), open any game you created
2. Click "Delete Game" button
3. **Confirmation dialog appears**
4. Read the warning message
5. Click "Keep Game" (cancel)
6. Verify nothing happens
7. Click "Delete Game" again
8. Click "Yes, Delete" (confirm)

**Expected Results:**
- ✅ Confirmation dialog shows:
  - "Delete this game?"
  - "All participants will be notified"
  - "This cannot be undone"
  - "Keep Game" button (secondary)
  - "Yes, Delete" button (red, primary)
- ✅ Cancel works - dialog closes, game not deleted
- ✅ Confirm shows loading: "Deleting..."
- ✅ Green toast appears: "Game deleted"
- ✅ Redirects to Discover page
- ✅ Game no longer appears in Discover
- ✅ Direct link to game shows "Game Not Found"

**Edge Cases:**
- Network error during delete:
  - Red toast: "Couldn't delete game. Check your connection and try again."
  - User stays on game page
  - Game NOT deleted

---

### ✅ Test 4: Join Game - Success Flow

**Steps:**
1. Log in as User B
2. Find a game with available spots
3. Click "Join Game"

**Expected Results:**
- ✅ Button shows loading spinner
- ✅ Button disabled during join
- ✅ Green toast appears: "Joined game"
- ✅ Button changes to "Leave Game"
- ✅ User appears in roster immediately
- ✅ Spot count updates

**Edge Cases:**
- Waitlist scenario:
  - Game is full
  - Green toast: "Added to waitlist #3"
  - Waitlist position shown
- Game has restricted tags:
  - Confirmation dialog appears
  - Must acknowledge tags before joining

---

### ✅ Test 5: Leave Game - Confirmation & Success

**Steps:**
1. As User B, open a game you've joined
2. Click "Leave Game"
3. **Confirmation dialog appears**
4. Click "Stay in Game" (cancel)
5. Verify you're still in the game
6. Click "Leave Game" again
7. Click "Leave Game" in dialog (confirm)

**Expected Results:**
- ✅ Confirmation dialog shows:
  - "Leave Game?"
  - "Are you sure you want to leave [Game Title]?"
  - "You can rejoin if spots are available..."
  - "Stay in Game" button (secondary)
  - "Leave Game" button (red, primary)
- ✅ Cancel works - you stay in game
- ✅ Confirm shows loading: "Leaving..."
- ✅ Green toast appears: "Left game"
- ✅ Dialog closes
- ✅ Button changes to "Join Game"
- ✅ You're removed from roster
- ✅ Spot count updates

---

### ✅ Test 6: Upload Photo - Success Flow

**Steps:**
1. As a participant, open a game
2. Go to "Photos" tab
3. Click "Upload photo" or click "+" placeholder
4. Select an image file (< 5MB)
5. Wait for upload

**Expected Results:**
- ✅ "Uploading..." text appears
- ✅ Upload button disabled
- ✅ Green toast appears: "Photo uploaded"
- ✅ Photo appears in gallery immediately
- ✅ Photo counter updates (e.g., "2/5 photos")

**Edge Cases:**
- File too large:
  - Red toast with error message
  - Photo not uploaded
- Network error:
  - Red toast: "Couldn't upload photo. Check your connection and try again."
- Max photos reached (5):
  - Upload button disabled
  - Message: "Maximum 5 photos reached"

---

### ✅ Test 7: Delete Photo - Confirmation & Success

**Steps:**
1. As uploader or organizer, open a game with photos
2. Click on a photo to view it
3. Look for delete button (trash icon, red)
4. Click delete button
5. **Confirmation dialog appears**
6. Click "Cancel"
7. Click delete again
8. Click "Delete Photo" (confirm)

**Expected Results:**
- ✅ Delete button visible only to uploader or organizer
- ✅ Confirmation dialog shows:
  - "Delete Photo?"
  - "This photo will be permanently deleted"
  - "This action cannot be undone"
  - "Cancel" button
  - "Delete Photo" button (red)
- ✅ Cancel preserves photo
- ✅ Confirm shows loading: "Deleting..."
- ✅ Green toast appears: "Photo deleted"
- ✅ Photo removed from gallery
- ✅ Photo counter updates
- ✅ Next photo auto-selected in viewer

**Edge Cases:**
- Non-uploader, non-organizer:
  - Delete button not visible
- Already deleted:
  - 410 Gone error
  - Red toast: "Photo already deleted"

---

### ✅ Test 8: Edit Profile - Success Flow

**Steps:**
1. Navigate to Profile Settings
2. Click "Edit Profile"
3. Change display name to "Test User Updated"
4. Change bio
5. Click "Save Changes"

**Expected Results:**
- ✅ Button shows loading: "Saving..."
- ✅ Button disabled during save
- ✅ Green toast appears: "Profile updated"
- ✅ Redirects to profile page
- ✅ New name visible in header/navigation
- ✅ Changes persist on page reload

**Edge Cases:**
- Validation error:
  - Red toast with specific field error
  - Form shows error messages
  - Changes not saved

---

### ✅ Test 9: Deactivate Account - Confirmation & Success

**Steps:**
1. Navigate to Settings → Security
2. Scroll to "Account Actions"
3. Click "Deactivate Account"
4. **Confirmation dialog appears**
5. Read the consequences
6. Click "Cancel"
7. Click "Deactivate Account" again
8. Click "Deactivate Account" button in dialog

**Expected Results:**
- ✅ Confirmation dialog shows:
  - "Deactivate Account?"
  - Bullets explaining what happens:
    - Hide profile
    - Remove from all upcoming games
    - Prevent creating/joining games
  - "✓ You can reactivate within 30 days"
  - "Cancel" button
  - "Deactivate Account" button (orange)
- ✅ Cancel keeps account active
- ✅ Confirm shows loading: "Deactivating..."
- ✅ Green toast: "Account deactivated"
- ✅ User logged out
- ✅ Redirected to home page
- ✅ Cannot log in (account deactivated)

**Edge Cases:**
- Server error:
  - Red toast: "Couldn't deactivate account. Please try again later or contact support."
  - User stays logged in
  - Account still active

---

### ✅ Test 10: Delete Account - Type-to-Confirm

**Steps:**
1. Navigate to Settings → Security
2. Scroll to "Account Actions"
3. Click "Delete Account"
4. **Confirmation dialog appears**
5. Try clicking "Delete Forever" without typing
6. Verify button is disabled
7. Type "delete" (lowercase)
8. Verify button still disabled
9. Clear input and type "DELETE" (uppercase)
10. Button becomes enabled
11. Click "Delete Forever"

**Expected Results:**
- ✅ Confirmation dialog shows:
  - "Permanently Delete Account?"
  - "⚠ This action is IRREVERSIBLE" (red box)
  - Bullets explaining deletion:
    - Delete all personal information
    - Remove from all games
    - Erase game history and stats
    - Delete all photos
    - Cannot be recovered
  - Input field with placeholder "DELETE"
  - "Delete Forever" button (red, disabled initially)
- ✅ Button disabled until exact text "DELETE" entered
- ✅ Case-sensitive validation works
- ✅ Clicking "Delete Forever" shows: "Deleting..."
- ✅ Green toast: "Account deleted"
- ✅ User logged out immediately
- ✅ Redirected to home page
- ✅ Account permanently deleted
- ✅ Cannot log in
- ✅ Profile shows "User Not Found"

**Edge Cases:**
- Network timeout:
  - Red toast: "Couldn't delete account. Check your connection and try again."
  - User stays logged in
  - Account not deleted

---

## Error Scenarios Testing

### Network Errors

**Test:** Disconnect internet during action

**Steps:**
1. Start any major action (create game, join game, etc.)
2. Immediately disconnect internet
3. Wait for timeout

**Expected:**
- Red toast appears
- Message includes: "Check your connection and try again"
- No data corruption
- UI returns to normal state

### Server Errors (500)

**Test:** Backend down during action

**Steps:**
1. Stop backend server
2. Try to perform action

**Expected:**
- Red toast: "[Action] failed. Please try again later or contact support."
- UI remains functional
- No infinite spinner

### Authentication Errors (401)

**Test:** JWT token expired

**Steps:**
1. Use expired token (modify in dev tools)
2. Try any action

**Expected:**
- Red toast: "[Action] failed. You may need to sign in again."
- Redirect to login (optional)

---

## UI/UX Verification Checklist

### Toast Notifications
- [ ] Always appear in top-right corner
- [ ] Success toasts are green with checkmark
- [ ] Error toasts are red with X icon
- [ ] Disappear after 3-4 seconds
- [ ] Readable text, proper contrast
- [ ] Stack properly if multiple toasts
- [ ] Don't block critical UI elements

### Confirmation Dialogs
- [ ] Modal overlay prevents accidental clicks outside
- [ ] ESC key closes dialog (cancel action)
- [ ] Tab navigation works
- [ ] Buttons clearly labeled
- [ ] Destructive actions use red color
- [ ] Warning text prominent
- [ ] Cannot trigger by accident (explicit button click required)

### Loading States
- [ ] Spinners visible during operations
- [ ] Buttons disabled while loading
- [ ] Loading text clear ("Saving...", "Deleting...")
- [ ] No double submissions possible
- [ ] Loading state removes on completion/error

### Consistency
- [ ] All success messages use past tense
- [ ] Error messages include next steps
- [ ] Confirmations explain consequences
- [ ] No technical jargon in user-facing messages
- [ ] Tone is consistent across all messages

---

## Performance Checklist

- [ ] Toast appears within 1 second of server response
- [ ] Confirmations render immediately on click
- [ ] No lag when opening dialogs
- [ ] Photo upload shows progress
- [ ] UI updates reflect immediately after success

---

## Accessibility Checklist

- [ ] All dialogs keyboard navigable
- [ ] Buttons have clear labels
- [ ] Error messages have ARIA labels
- [ ] Toasts announced to screen readers
- [ ] Focus management in dialogs correct
- [ ] Color is not the only indicator (icons + text)

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Production Readiness Sign-Off

After completing all tests:

- [ ] All 10 test scenarios pass
- [ ] All error scenarios handled gracefully
- [ ] UI/UX checklist complete
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Browser compatibility confirmed
- [ ] Backend endpoints return correct status codes
- [ ] Backend logs show no errors
- [ ] Frontend console shows no errors
- [ ] Database integrity verified (soft deletes work, no orphaned records)

---

## Known Issues / Future Enhancements

### Out of Scope (Not Implemented)
1. **Undo Functionality**
   - Decided not to implement due to complexity
   - Confirmations mitigate the need
   - Can be added in future iteration

2. **Offline Support**
   - Network errors detected and handled
   - But no offline queue/retry mechanism
   - Future: Implement service worker for offline actions

### Future Improvements
1. **Batch Operations**
   - Currently individual toasts for each action
   - Could show "3 photos deleted" instead of 3 separate toasts

2. **Persistent Notifications**
   - Some actions might benefit from banner vs toast
   - E.g., account deactivation countdown

3. **Toast History**
   - Users can't see past notifications
   - Could add notification center

---

## Troubleshooting

### Toast Not Appearing
**Problem:** Success/error toast doesn't show

**Solution:**
1. Check browser console for errors
2. Verify Toaster mounted in app/layout.tsx
3. Verify sonner package installed: `npm list sonner`
4. Check if toast import correct: `import { toast } from '@/lib/toast'`

### Confirmation Dialog Not Opening
**Problem:** Click button but dialog doesn't appear

**Solution:**
1. Check state management (showDialog = true)
2. Verify AlertDialog props correct
3. Check z-index conflicts in CSS
4. Verify component imported correctly

### Backend Endpoint 404
**Problem:** API call returns 404

**Solution:**
1. Verify endpoint path matches frontend API call
2. Check backend controller has correct @RequestMapping
3. Verify method has correct HTTP verb (@DeleteMapping, @PostMapping)
4. Restart backend server
5. Check backend logs for routing errors

### Photo Delete Fails with 403
**Problem:** "Only the photo uploader or game organizer can delete"

**Solution:**
1. Verify you're logged in as uploader or organizer
2. Check userId in JWT token matches
3. Verify backend permission logic correct
4. Check game createdBy relationship in database

---

## Support & Documentation

- **Frontend Code:** `playlocal/frontend/`
- **Backend Code:** `playlocal/backend/`
- **Implementation Summary:** `US-7.15-IMPLEMENTATION-SUMMARY.md`
- **Tests:** `playlocal/frontend/test/components/ActionFeedback.test.tsx`

For questions or issues, refer to the main implementation summary or check the GitHub issue #198.

---

**Last Updated:** 2026-03-20
**Story:** US 7.15
**Status:** Ready for QA
