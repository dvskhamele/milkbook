# PWA + Deployment Checklist

## 1. PWA Requirements
- [ ] Web App Manifest (manifest.json)
- [ ] Service Worker for caching
- [ ] HTTPS (production)
- [ ] App icons (192x192, 512x512)
- [ ] Splash screen
- [ ] Install prompt

## 2. Offline Architecture
- [ ] IndexedDB for structured data
- [ ] localStorage for small flags/settings
- [ ] Service worker caching strategy
- [ ] App works without internet
- [ ] Data persists offline

## 3. Sync Architecture
- [ ] Background sync capability
- [ ] Queue management for offline changes
- [ ] Conflict resolution (last-write + proof preserved)
- [ ] Sync status indicators (not controls)
- [ ] Auto-sync when network available

## 4. Media Handling
- [ ] Camera access via browser APIs
- [ ] Local image storage first
- [ ] Auto-sync images to Cloudflare R2
- [ ] Retrieve on demand
- [ ] Subtle upload/download progress

## 5. Deployment
- [ ] Web-installable PWA
- [ ] "Install on Desktop" supported
- [ ] Windows/macOS via Chrome install
- [ ] No .exe required initially
- [ ] Notifications for sync and backup

## 6. Performance
- [ ] Fast loading times
- [ ] Efficient caching strategy
- [ ] Minimal data usage
- [ ] Responsive design
- [ ] Touch-friendly interface

## 7. Security
- [ ] Secure data transmission
- [ ] Local data encryption
- [ ] Privacy-compliant
- [ ] No unauthorized access
- [ ] Secure API endpoints

## 8. Compatibility
- [ ] Works on all modern browsers
- [ ] Mobile and desktop support
- [ ] Cross-platform compatibility
- [ ] Legacy browser fallback
- [ ] Different screen sizes

## 9. Testing
- [ ] Offline functionality
- [ ] Sync behavior
- [ ] Image handling
- [ ] Data integrity
- [ ] Performance benchmarks

## 10. User Experience
- [ ] Intuitive installation
- [ ] Smooth transitions
- [ ] Clear status indicators
- [ ] Error handling
- [ ] Accessibility compliance