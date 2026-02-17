# Image Handling Flow

## 1. Capture Process
1. User selects "Take Photo" from entry screen
2. Camera API activated via browser
3. Image captured and compressed locally
4. Preview shown to user
5. User confirms or retakes

## 2. Storage Process
1. Image converted to base64 format
2. Stored locally in localStorage with entry ID
3. Thumbnail generated for quick display
4. Full image available for viewing

## 3. Attachment Process
1. After entry saved, image linked to entry ID
2. Image stored in entry object: `images: [base64_data]`
3. Thumbnail shown in entry table
4. Full image accessible in entry detail view

## 4. Sync Process
1. When online, images uploaded to Cloudflare R2
2. Image URLs stored in server database
3. Local cache maintained for offline access
4. Sync status shown for each image

## 5. Retrieval Process
1. When viewing entry, check local cache first
2. If not available, download from server
3. Cache locally for future access
4. Show loading indicator during download

## 6. Display Process
1. Thumbnail in entry table
2. Full image in detail view
3. Lightbox for full-screen viewing
4. No gallery view (as per requirements)

## 7. Compression Standards
- Resolution: Max 1024x768
- Quality: 80% JPEG
- Size: < 200KB per image
- Format: JPEG/PNG

## 8. Privacy & Security
- Images encrypted locally
- Secure upload to server
- Access limited to authorized users
- No public sharing without consent

## 9. Error Handling
- Retry failed uploads
- Local fallback if server unavailable
- Clear error messages to user
- Preserve original image quality