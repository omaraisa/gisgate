# Docker Image Management for GIS Gate

## Current Setup
Images are stored at: `/var/www/static/image/` on the server
App will be deployed in Docker containers

## Recommended Docker Configuration

### 1. Docker Compose with Volume Mount
```yaml
version: '3.8'
services:
  gisgate:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /var/www/static/image:/app/public/uploads/images
    environment:
      - NODE_ENV=production
```

### 2. Nginx Configuration (for image serving)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve static images
    location /static/image/ {
        alias /var/www/static/image/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Serve uploaded images
    location /uploads/images/ {
        alias /app/public/uploads/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Image Upload API (Optional)

If you need to upload new images programmatically:

```typescript
// POST /api/admin/upload-image
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('image') as File
  
  // Save to mounted volume
  const buffer = await file.arrayBuffer()
  const path = join(process.cwd(), 'public', 'uploads', 'images', file.name)
  await writeFile(path, Buffer.from(buffer))
  
  return Response.json({ 
    url: `/uploads/images/${file.name}` 
  })
}
```

## AI Article Workflow

1. **For existing images**: AI references them directly
   ```json
   {
     "content": {
       "text": "<img src='http://your-domain.com/static/image/2025/02/image.jpg'>",
       "image": "http://your-domain.com/static/image/2025/02/featured.jpg"
     }
   }
   ```

2. **For new images**: Upload first, then reference
   ```javascript
   // Upload image
   const uploadResponse = await fetch('/api/admin/upload-image', {
     method: 'POST',
     body: formData
   })
   const { url } = await uploadResponse.json()

   // Use in article
   const articleData = {
     content: {
       text: `<img src='${url}'>`,
       image: url
     }
   }
   ```

## Benefits of This Approach

✅ **Simple**: Uses existing image infrastructure  
✅ **Docker-friendly**: Volume mounting works perfectly  
✅ **Scalable**: Nginx handles static file serving efficiently  
✅ **Flexible**: Supports both existing and new images  
✅ **Performance**: Images served directly by Nginx, not Node.js  

## Deployment Steps

1. Mount the image directory in Docker
2. Configure Nginx to serve images
3. Update AI to use full URLs for existing images
4. Optionally add upload API for new images

This setup will work seamlessly with your current infrastructure!