# Resume Upload System

This system allows you to upload and manage your resume PDF file through the admin interface.

## Features

- Upload PDF files only (max 10MB)
- Automatic renaming to `omar-elhadi.pdf`
- Storage in MinIO `files` bucket
- Clean API endpoint for serving the file
- Admin interface for easy management

## API Endpoints

### Upload Resume
- **URL**: `POST /api/admin/upload-resume`
- **Method**: POST
- **Body**: FormData with `file` field
- **Response**: JSON with upload status and file info

### Serve Resume
- **URL**: `GET /api/resume`
- **Method**: GET
- **Response**: PDF file with proper headers

## File Storage

- **Bucket**: `files`
- **Filename**: `omar-elhadi.pdf` (always)
- **MinIO URL**: `http://SERVER_IP:9000/files/omar-elhadi.pdf`
- **Clean URL**: `https://yourdomain.com/api/resume`

## Nginx Configuration

To serve the resume at `https://gis-gate.com/omar-elhadi.pdf`, add this to your nginx configuration:

```nginx
location /omar-elhadi.pdf {
    proxy_pass http://127.0.0.1:3000/api/resume;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Admin Interface

Access the resume upload interface at `/admin/resume` in your admin panel.

## Environment Variables

Make sure the following environment variables are set:
- `SERVER_IP`: Your MinIO server IP address
- `NEXT_PRIVATE_MINIO_ACCESS_KEY`: MinIO access key (defaults to 'miniomar')
- `NEXT_PRIVATE_MINIO_SECRET_KEY`: MinIO secret key (defaults to '123wasd#@!WDSA')

## Usage

1. Go to Admin → Resume Upload
2. Drag & drop or select a PDF file
3. Click "Upload File"
4. The file will be available at the clean URL

## Security

- Only authenticated admin users can upload files
- File type validation (PDF only)
- File size limits (10MB max)
- Automatic overwriting of existing file