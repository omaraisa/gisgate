# WordPress to PostgreSQL Migration System

This system allows you to migrate your WordPress articles to a PostgreSQL database using the WordPress REST API. It preserves article content, metadata, categories, tags, and images.

## Features

- ✅ **Complete Article Migration**: Migrates titles, content, excerpts, and metadata
- ✅ **Category & Tag Support**: Preserves WordPress categories and tags
- ✅ **Image Migration**: Downloads and stores featured images and content images
- ✅ **Status Mapping**: Maps WordPress post statuses to application statuses
- ✅ **Batch Processing**: Processes articles in configurable batches
- ✅ **Error Handling**: Comprehensive error reporting and recovery
- ✅ **Preview Mode**: Preview articles before migration
- ✅ **Progress Tracking**: Real-time migration progress and statistics
- ✅ **Web Interface**: User-friendly React interface
- ✅ **CLI Support**: Command-line interface for server environments

## Prerequisites

1. **WordPress Site** with REST API enabled (WordPress 4.7+)
2. **PostgreSQL Database** set up and configured
3. **Prisma Client** generated (`npx prisma generate`)
4. **Database Migrations** applied (`npx prisma migrate deploy`)

## Usage Methods

### 1. Web Interface (Recommended for beginners)

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the migration page:
   ```
   http://localhost:3000/migrate
   ```

3. Follow the step-by-step interface:
   - Enter your WordPress URL
   - Test the connection
   - Preview articles
   - Configure options
   - Start migration

### 2. API Endpoints

#### Test Connection
```bash
GET /api/wordpress-migrate?action=test&url=https://your-site.com
```

#### Get Site Info
```bash
GET /api/wordpress-migrate?action=info&url=https://your-site.com
```

#### Preview Articles
```bash
GET /api/wordpress-migrate?action=preview&url=https://your-site.com
```

#### Start Migration
```bash
POST /api/wordpress-migrate
Content-Type: application/json

{
  "wordpressUrl": "https://your-site.com",
  "includeImages": true,
  "overwriteExisting": false,
  "batchSize": 10,
  "delayBetweenRequests": 1000
}
```

### 3. Command Line Interface

#### Test Connection
```bash
npm run migrate:test -- -u https://your-wordpress-site.com
```

#### Preview Articles
```bash
npm run migrate:preview -- -u https://your-wordpress-site.com -n 10
```

#### Start Migration
```bash
npm run migrate:wp -- -u https://your-wordpress-site.com -b 10 -d 1000 --overwrite
```

#### CLI Options
- `-u, --url <url>`: WordPress site URL (required)
- `-b, --batch-size <number>`: Posts per batch (default: 10)
- `-d, --delay <number>`: Delay between requests in ms (default: 1000)
- `--no-images`: Skip image migration
- `--overwrite`: Overwrite existing articles
- `--verbose`: Verbose output

## Configuration Options

### Migration Settings

```typescript
interface MigrationConfig {
  wordpressUrl: string;              // WordPress site URL
  batchSize: number;                 // Posts per batch (1-50)
  delayBetweenRequests: number;      // Delay in ms (100-5000)
  includeImages: boolean;            // Include image migration
  overwriteExisting: boolean;        // Overwrite existing posts
  statusMapping: {                   // WordPress to app status mapping
    'publish': 'PUBLISHED',
    'draft': 'DRAFT',
    'private': 'ARCHIVED'
  };
}
```

### Performance Tuning

- **Batch Size**: Lower values (5-10) for slower connections, higher (20-50) for fast connections
- **Request Delay**: Increase if getting rate limited, decrease for faster migration
- **Image Migration**: Disable for faster text-only migration

## Database Schema Mapping

| WordPress Field | Database Field | Notes |
|----------------|---------------|-------|
| `post_title` | `title` | HTML entities decoded |
| `post_name` | `slug` | Used as unique identifier |
| `post_excerpt` | `excerpt` | HTML stripped |
| `post_content` | `content` | Processed for images |
| `post_status` | `status` | Mapped via statusMapping |
| `post_date` | `publishedAt` | Only for published posts |
| `categories` | `category` | First category name |
| `tags` | `tags` | JSON array of tag names |
| `featured_media` | `featuredImage` | Downloaded image URL |

## Error Handling

The system includes comprehensive error handling:

### Connection Errors
- **Invalid URL**: Check WordPress site URL format
- **REST API Disabled**: Ensure WordPress REST API is accessible
- **Network Issues**: Check internet connection and firewall

### Migration Errors
- **Duplicate Slugs**: Existing articles with same slug (use overwrite option)
- **Invalid Content**: Malformed HTML or missing required fields
- **Image Download Failures**: Network issues or invalid image URLs
- **Database Errors**: Connection issues or constraint violations

### Recovery Options
- **Partial Migration**: Completed articles remain in database
- **Resume Migration**: Re-run with different batch size or settings
- **Manual Cleanup**: Use database queries to clean partial data

## Monitoring and Logging

### Real-time Statistics
```typescript
interface MigrationStats {
  totalPosts: number;          // Total posts found
  processedPosts: number;      // Posts processed so far
  successfulImports: number;   // Successfully migrated
  failedImports: number;       // Failed migrations
  skippedPosts: number;        // Skipped (existing) posts
  errors: string[];            // Detailed error messages
  startTime: Date;            // Migration start time
  endTime?: Date;             // Migration end time
}
```

### Console Output
```
🚀 Starting WordPress migration...
📂 Loaded 5 categories and 23 tags
📊 Found 156 posts to migrate
📄 Processing page 1/16...
✨ Created article: digital-twin-technology
📝 Updated article: smart-cities-overview
📊 Progress: 50/156 posts processed
✅ Migration completed!
📈 Stats: 150/156 posts migrated successfully
⏱️ Duration: 245s
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to WordPress site"**
   - Check URL format (include https://)
   - Verify site is accessible
   - Check if REST API is enabled

2. **"Empty host in database URL"**
   - Check DATABASE_URL in .env file
   - Ensure PostgreSQL is running
   - Verify connection string format

3. **"Migration timeout"**
   - Increase delayBetweenRequests
   - Reduce batchSize
   - Check network stability

4. **"Duplicate key error"**
   - Enable overwriteExisting option
   - Check for slug conflicts
   - Manually resolve duplicates

### Debug Mode

Enable verbose logging:
```bash
# CLI
npm run migrate:wp -- -u https://site.com --verbose

# Environment variable
DEBUG=wp-migrator npm run migrate:wp -- -u https://site.com
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in .env files
2. **Database Access**: Use restricted database user permissions
3. **Rate Limiting**: Respect WordPress server limits
4. **SSL/TLS**: Use HTTPS for production deployments
5. **Input Validation**: All URLs and inputs are validated

## Examples

### Basic Migration
```bash
npm run migrate:wp -- -u https://myblog.com
```

### Advanced Migration with Options
```bash
npm run migrate:wp -- \
  -u https://myblog.com \
  -b 20 \
  -d 500 \
  --overwrite \
  --no-images
```

### Programmatic Usage
```typescript
import { migrateFromWordPress } from './lib/wordpress-migrator';

const stats = await migrateFromWordPress('https://myblog.com', {
  batchSize: 15,
  includeImages: true,
  overwriteExisting: true
});

console.log(`Migrated ${stats.successfulImports} articles`);
```

## Support

For issues and questions:

1. Check the console output for detailed error messages
2. Review the migration statistics for partial failures
3. Test connection with smaller batch sizes
4. Verify WordPress site accessibility and REST API status

## License

This migration system is part of the GIS-Gate project and follows the same license terms.