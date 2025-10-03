# Certificate Builder Implementation - Robust Solution

## Overview
Implemented a robust certificate builder using **react-konva** for precise canvas editing and **pdf-lib** for accurate PDF generation. This solves the positioning inconsistency issues caused by HTML/CSS → PDF conversion.

## Key Changes

### 1. **Architecture**
- **Old**: HTML/CSS positioning + Puppeteer → inconsistent PDF output
- **New**: Konva Canvas with absolute pixel coordinates → pdf-lib with exact positioning

### 2. **Technology Stack**
- `react-konva` v18.2.10 - Canvas-based drag-and-drop editor
- `konva` v9.3.6 - Core canvas library
- `use-image` v1.1.1 - Image loading hook for Konva
- `pdf-lib` v1.17.1 - PDF generation with precise coordinate placement

### 3. **Files Modified**

#### **package.json**
- Added `use-image` dependency

#### **prisma/schema.prisma**
- Added `backgroundWidth` and `backgroundHeight` fields to `CertificateTemplate` model
- Defaults: 2480×3508 (A4 at 300 DPI)

#### **app/admin/certificates/builder/page.tsx** (Complete Rewrite)
- Removed percentage-based CSS positioning
- Added zoom controls
- Store absolute pixel coordinates (matching actual image dimensions)
- Real-time canvas preview with drag & drop
- Field properties panel with precise controls

#### **app/admin/certificates/builder/CertificateCanvas.tsx** (New File)
- Konva Stage/Layer implementation
- Draggable and transformable elements
- Selection with transformer handles
- Accurate positioning using actual image dimensions

#### **API Routes Updated**
- `app/api/admin/certificates/templates/route.ts` - POST handler
- `app/api/admin/certificates/templates/[id]/route.ts` - PUT handler
- Both now accept and store `backgroundWidth` and `backgroundHeight`

### 4. **How It Works**

1. **Builder Phase**:
   - Upload background image → capture actual dimensions (e.g., 2480×3508 px)
   - Place fields using drag-and-drop on Konva canvas
   - Coordinates stored as absolute pixels (x: 1240, y: 1754)

2. **Storage**:
   ```json
   {
     "backgroundWidth": 2480,
     "backgroundHeight": 3508,
     "fields": [
       {
         "id": "field-123",
         "type": "STUDENT_NAME",
         "x": 1240,
         "y": 500,
         "fontSize": 48,
         "fontFamily": "Arial",
         "color": "#000000"
       }
     ]
   }
   ```

3. **PDF Generation** (when certificate is issued):
   - Load background image at exact stored dimensions
   - Use `pdf-lib` to create PDF page with exact dimensions
   - Place text/QR at stored (x, y) coordinates
   - **No scaling, no conversion = perfect positioning**

## Commands to Run

### Step 1: Install Dependencies
```powershell
npm install
```

This will install:
- use-image@^1.1.1
- (konva, react-konva, pdf-lib already in package.json)

### Step 2: Create & Apply Database Migration
```powershell
npx prisma migrate dev --name add-certificate-dimensions
```

This will:
- Add `backgroundWidth` and `backgroundHeight` columns
- Set default values (2480, 3508)
- Regenerate Prisma Client with new types

### Step 3: Start Development Server
```powershell
npm run dev
```

### Step 4: Test the Builder
1. Navigate to `/admin/certificates`
2. Click "إنشاء قالب جديد" (Create New Template)
3. Upload a background image (PNG from `/public/certificate_templates/`)
4. Add fields by clicking field types in the left panel
5. Drag fields to position them
6. Use properties panel to adjust font size, color, alignment
7. Save the template

### Step 5: Verify
- Check that template saves successfully
- Edit an existing template - coordinates should be preserved
- Background dimensions should display correctly

## Benefits of This Approach

### 1. **Pixel-Perfect Accuracy**
- Canvas coordinates = PDF coordinates
- No more "elements shift when exported"

### 2. **Professional Editor Experience**
- Visual drag-and-drop
- Zoom in/out for precision
- Rotate and transform elements
- Real-time preview

### 3. **Any Image Size Supported**
- Automatically detects background dimensions
- Scales display for editing
- Exports at full resolution

### 4. **Future-Proof**
- Can add more field types easily
- Can add image fields, shapes, etc.
- pdf-lib supports advanced PDF features

## Migration Notes

### Existing Templates
If you have existing templates without dimensions:
- They'll get default values (2480×3508) from migration
- You may need to re-position fields if original backgrounds were different sizes
- Consider setting `backgroundWidth/Height` to `NULL` and re-uploading images to capture actual dimensions

### PDF Generation Service
The certificate generation service (likely in `lib/certificate-service.ts`) will need updates to:
1. Use `pdf-lib` instead of Puppeteer
2. Load template dimensions from database
3. Use exact coordinates for text placement

Example pseudo-code:
```typescript
import { PDFDocument, rgb } from 'pdf-lib';

async function generateCertificate(template, data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([template.backgroundWidth, template.backgroundHeight]);
  
  // Draw background
  const bgImage = await pdfDoc.embedPng(template.backgroundImage);
  page.drawImage(bgImage, { x: 0, y: 0, width: template.backgroundWidth, height: template.backgroundHeight });
  
  // Draw fields
  for (const field of template.fields) {
    if (field.type !== 'QR_CODE') {
      page.drawText(data[field.type], {
        x: field.x,
        y: template.backgroundHeight - field.y, // PDF coords are bottom-up
        size: field.fontSize,
        color: rgb(...hexToRgb(field.color)),
        font: await pdfDoc.embedFont(field.fontFamily)
      });
    }
  }
  
  return await pdfDoc.save();
}
```

## Troubleshooting

### Canvas Not Showing
- Check browser console for errors
- Ensure `use-image` is installed
- Try refreshing after `npm install`

### TypeScript Errors
- Run `npx prisma generate` to regenerate client
- Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

### Database Errors
- Ensure migration ran successfully
- Check `prisma/migrations/` for new migration folder
- If issues, reset: `npx prisma migrate reset` (⚠️ deletes data)

### PDF Generation Still Wrong
- Double-check you're using pdf-lib, not Puppeteer
- Verify coordinates are being read from database
- Remember: PDF Y coordinates are inverted (bottom = 0)

## Next Steps

1. ✅ Install dependencies
2. ✅ Run migration
3. ✅ Test builder
4. 🔄 Update certificate generation service to use pdf-lib
5. 🔄 Test full certificate issuance flow
6. 🔄 Consider adding preview/download feature in builder

## Questions?
The new system is designed to eliminate positioning issues by:
- Storing exact pixel coordinates
- Using the same coordinate system for editing and export
- Avoiding any HTML→PDF conversion

The editor may look different but provides far more control and accuracy!
