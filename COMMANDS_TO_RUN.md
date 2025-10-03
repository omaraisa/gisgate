# Commands to Run - Certificate Builder Implementation

## Run these commands in order:

### 1. Install npm dependencies
```powershell
npm install
```
This installs the new `use-image` package needed for Konva image loading.

### 2. Create and apply database migration
```powershell
npx prisma migrate dev --name add_certificate_dimensions
```
This will:
- Add `backgroundWidth` and `backgroundHeight` columns to the `CertificateTemplate` table
- Set default values (2480 x 3508 pixels - A4 at 300 DPI)
- Regenerate Prisma Client with updated types

### 3. Start development server
```powershell
npm run dev
```

### 4. Test the new certificate builder
1. Navigate to http://localhost:3000/admin/certificates (or your dev URL)
2. Click "إنشاء قالب جديد" (Create New Template)
3. Upload a background image (use PNG files from `/public/certificate_templates/`)
4. Try adding fields and dragging them around
5. Save the template

---

## What Changed

### New Dependencies
- ✅ `use-image@^1.1.1` - Hook for loading images in Konva
- ✅ `react-konva@^18.2.10` - Already in package.json
- ✅ `konva@^9.3.6` - Already in package.json
- ✅ `pdf-lib@^1.17.1` - Already in package.json

### Database Schema
- ✅ Added `backgroundWidth` (Int, default 2480)
- ✅ Added `backgroundHeight` (Int, default 3508)

### New Files
- ✅ `app/admin/certificates/builder/CertificateCanvas.tsx` - Konva canvas component
- ✅ `CERTIFICATE_BUILDER_IMPLEMENTATION.md` - Full documentation

### Modified Files
- ✅ `package.json` - Added use-image dependency
- ✅ `prisma/schema.prisma` - Added dimension fields
- ✅ `app/admin/certificates/builder/page.tsx` - Complete rewrite
- ✅ `app/api/admin/certificates/templates/route.ts` - Handle dimensions in POST
- ✅ `app/api/admin/certificates/templates/[id]/route.ts` - Handle dimensions in PUT

---

## Key Features

### 1. Pixel-Perfect Positioning
- Canvas coordinates = PDF coordinates
- No more element shifting on export

### 2. Visual Drag-and-Drop Editor
- Real-time preview
- Zoom controls (25% - 200%)
- Direct manipulation of field positions
- Transformer handles for precise adjustments

### 3. Comprehensive Field Controls
- X, Y coordinates (absolute pixels)
- Font size, family, weight
- Color (with color picker)
- Text alignment
- Rotation
- QR code dimensions

### 4. Any Background Size Supported
- Automatically detects image dimensions on upload
- Scales display for comfortable editing
- Stores exact dimensions for accurate PDF generation

---

## Troubleshooting

### If TypeScript shows errors after migration:
```powershell
npx prisma generate
```
Then restart VS Code TypeScript server:
- Press F1 or Ctrl+Shift+P
- Type "TypeScript: Restart TS Server"
- Press Enter

### If canvas doesn't show:
- Check browser console for errors
- Ensure all npm packages installed successfully
- Try hard refresh (Ctrl+Shift+R)

### If migration fails:
```powershell
# Reset database (⚠️ This deletes all data!)
npx prisma migrate reset

# Then rerun:
npx prisma migrate dev --name add_certificate_dimensions
```

---

## Next Steps (After Testing Builder)

1. Update certificate generation service (`lib/certificate-service.ts`) to use pdf-lib instead of Puppeteer
2. Load template dimensions from database in generation
3. Use exact coordinates for text placement
4. Remember: PDF Y-coordinates are inverted (0 at bottom)

See `CERTIFICATE_BUILDER_IMPLEMENTATION.md` for full implementation details and migration guide.
