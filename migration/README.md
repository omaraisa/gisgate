# Image Migration

This folder contains the consolidated image migration scripts for moving images from local storage to MinIO object storage and updating database references.

## Files

- `image-migration.ts` - Main migration script with utilities

## Usage

### Full Migration
```bash
npm run migrate:images
```

### Dry Run (Preview)
```bash
npm run migrate:images -- --dry-run
```

### Upload Only
```bash
npm run migrate:images -- --upload-only
```

### Database Update Only
```bash
npm run migrate:images -- --update-only
```

### Find Image URLs
```bash
npm run find:image-urls
```

### Validate Migration
```bash
npm run validate:migration
```

## Configuration

The script uses environment variables for server configuration:
- **MinIO Server**: http://`${SERVER_IP}`:9000 (from .env SERVER_IP variable)
- **Bucket**: images
- **Local Images Path**: C:\Users\GIS_J\Downloads\images
- **Old URL Pattern**: http://`${SERVER_IP}`/static/image/
- **New URL Pattern**: http://`${SERVER_IP}`:9000/images/

To change the server IP, update the `SERVER_IP` variable in your `.env` file.

## What It Does

1. **Upload Phase**: Recursively uploads all images from local folder to MinIO bucket
2. **Policy Phase**: Sets public read policy on the bucket
3. **Update Phase**: Updates all database article content to reference new MinIO URLs

## Safety Features

- Dry run mode to preview changes
- Selective execution (upload-only, update-only)
- Validation utilities to check migration success
- Comprehensive logging

## Dependencies

- minio (MinIO SDK)
- @prisma/client (Database access)