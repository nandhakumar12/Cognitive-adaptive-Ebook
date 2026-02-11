/**
 * TROUBLESHOOTING GUIDE
 * Common issues and solutions
 */

## Audio Not Playing

### Issue: No sound when clicking Play button

**Possible Causes:**
1. **Audio file not loaded** - URLs in audiobooks.json may be incorrect
2. **CORS issues** - External audio URLs may be blocked
3. **Browser autoplay policy** - Some browsers block autoplay

**Solutions:**

1. **Check Browser Console**:
   - Press F12 to open Developer Tools
   - Look for errors in Console tab
   - Common errors:
     * "Failed to load resource" → Audio URL is wrong
     * "CORS policy" → Audio URL blocked by CORS
     * "NotAllowedError" → Browser blocked autoplay

2. **Test if audio element works**:
   - Right-click page → Inspect
   - Find the `<audio>` element in Elements tab
   - Check if `src` attribute has a valid URL
   - Try playing the audio directly from the element

3. **Use local audio files**:
   - Download MP3 files to `frontend/public/audio/`
   - Update audiobooks.json to use `/audio/filename.mp3`
   - Restart dev server

4. **User interaction required**:
   - Modern browsers require user interaction before playing audio
   - Make sure you CLICK the Play button (keyboard might not work first time)

### Issue: Audio loads but no sound

**Check:**
- Computer volume (not muted)
- Browser tab volume (unmute icon in browser tab)
- Try different audiobook

---

## Research Dashboard Not Showing

### Issue: Clicking "My Library" or "Research Dashboard" does nothing

**Check:**
1. **Is it already open?**
   - Look for panel sliding in from right side of screen
   - May be off-screen on smaller displays

2. **Check browser console for errors**:
   - Press F12
   - Look for React errors or JavaScript errors

3. **Verify button clicked**:
   - Button should be in top-right (Library view)
   - Button should be in bottom-right (Player view)

4. **Check z-index**:
   - Panel might be behind other elements
   - Scroll to top of page

### Issue: Panel appears but is empty

**Check:**
- Backend server running on http://localhost:3001
- Check Network tab in DevTools for API errors
- Research Dashboard component requires active session

---

## Quick Fixes

### 1. Restart Everything
```bash
# Stop servers (Ctrl+C)
cd frontend
npm run dev

# In new terminal
cd backend
npm start
```

### 2. Hard Refresh Browser
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- This clears cached files

### 3. Check Dev Server URL
- Frontend should be: `http://localhost:3000`
- Backend should be: `http://localhost:3001`
- Check terminal for actual URLs

### 4. Clear Browser Cache
- Press F12
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

---

## Common Error Messages

### TypeError: Cannot read property 'X' of undefined
**Cause**: Data not loaded yet or wrong structure
**Fix**: Check audiobooks.json format matches expected structure

### Failed to fetch
**Cause**: Backend not running or wrong URL
**Fix**: Start backend server and check URL in .env file

### CORS error
**Cause**: External audio URL blocks cross-origin requests
**Fix**: Use local audio files instead

---

## Need More Help?

1. Open browser console (F12)
2. Copy full error message
3. Check Network tab for failed requests
4. Note which button/feature doesn't work
5. Screenshot the issue

### Test Audio Works:
Try this minimal test:
1. Open localhost:3000
2. Click any book
3. Click Play button WITH YOUR MOUSE
4. Wait 2-3 seconds
5. Check if you hear sound

If still not working, the issue is likely:
- Audio URL is broken (check console)
- Backend is not running
- Browser is blocking audio
