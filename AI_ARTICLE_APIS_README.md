# AI Article Creation APIs

This document explains how to use the AI-powered article creation APIs for the GIS Gate platform.

## Overview

The system provides an AI-powered article creation API that allows AI tools to directly create articles with content and images hosted on the pre-configured image server.

**Image Server:** `http://13.61.185.194/static/image/`
- All WordPress images have been copied here
- Nginx is configured to serve images from this location
- Images can be referenced directly in article content

## API Endpoints

### AI Article Creation API

**Endpoint:** `POST /api/admin/articles/create-ai`

**Purpose:** Create new articles with AI-generated content using images from the pre-configured server.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body: JSON object with article data

**Request Format:**
```json
{
  "article_title": "عنوان المقالة",
  "article_excerpt": "ملخص قصير للمقالة",
  "content": {
    "text": "<h1>عنوان رئيسي</h1><p>محتوى المقالة مع <strong>تنسيق</strong></p><img src='http://13.61.185.194/static/image/2025/02/image.jpg' alt='صورة'>",
    "image": "http://13.61.185.194/static/image/2025/02/featured-image.jpg"
  },
  "category": "تصنيف المقالة",
  "tags": "وسم1, وسم2, وسم3",
  "status": "DRAFT",
  "aiPrompt": "النص الذي استخدم لتوليد المقالة"
}
```

**Endpoint:** `POST /api/admin/articles/create-ai`

**Purpose:** Create new articles with AI-generated content using a simplified JSON format.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body: JSON object with article data

**Request Format:**
```json
{
  "article_title": "عنوان المقالة",
  "article_excerpt": "ملخص قصير للمقالة",
  "content": {
    "text": "<h1>عنوان رئيسي</h1><p>محتوى المقالة مع <strong>تنسيق</strong></p>",
    "image": "/uploads/articles/uuid.jpg"
  },
  "category": "تصنيف المقالة",
  "tags": "وسم1, وسم2, وسم3",
  "status": "DRAFT",
  "aiPrompt": "النص الذي استخدم لتوليد المقالة"
}
```

**Field Descriptions:**
- `article_title` (required): The title of the article
- `article_excerpt` (optional): Short summary of the article
- `content.text` (required): HTML content of the article
- `content.image` (optional): URL of the featured image
- `category` (optional): Article category
- `tags` (optional): Comma-separated tags
- `status` (optional): "DRAFT" or "PUBLISHED" (defaults to "DRAFT")
- `aiPrompt` (optional): The AI prompt used to generate the content

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/admin/articles/create-ai \
  -H "Content-Type: application/json" \
  -d '{
    "article_title": "دليل شامل لنظم المعلومات الجغرافية",
    "article_excerpt": "تعرف على أساسيات نظم المعلومات الجغرافية",
    "content": {
      "text": "<h1>مقدمة</h1><p>نظم المعلومات الجغرافية هي أدوات قوية...</p><img src=\"http://13.61.185.194/static/image/2025/02/gis-diagram.jpg\" alt=\"مخطط GIS\">",
      "image": "http://13.61.185.194/static/image/2025/02/featured-gis.jpg"
    },
    "category": "تعليم",
    "tags": "GIS, خرائط, تعليم",
    "status": "DRAFT",
    "aiPrompt": "اكتب مقالة تعليمية عن نظم المعلومات الجغرافية"
  }'
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "uuid",
    "title": "دليل شامل لنظم المعلومات الجغرافية",
    "slug": "دليل-شامل-لنظم-المعلومات-الجغرافية",
    "excerpt": "تعرف على أساسيات نظم المعلومات الجغرافية",
    "content": "<h1>مقدمة</h1><p>نظم المعلومات الجغرافية هي أدوات قوية...</p>",
    "featuredImage": "/uploads/articles/123.jpg",
    "status": "DRAFT",
    "publishedAt": null,
    "category": "تعليم",
    "tags": "GIS, خرائط, تعليم",
    "aiGenerated": true,
    "createdAt": "2025-09-27T18:30:00.000Z"
  }
}
```

## Complete Workflow Example

Since images are already hosted on the pre-configured server, the workflow is simplified:

```javascript
const articleData = {
  article_title: "عنوان المقالة",
  article_excerpt: "ملخص المقالة",
  content: {
    text: `<h1>عنوان رئيسي</h1>
           <p>محتوى المقالة مع HTML</p>
           <img src="http://13.61.185.194/static/image/2025/02/image.jpg" alt="صورة">`,
    image: "http://13.61.185.194/static/image/2025/02/featured.jpg"
  },
  category: "تصنيف",
  tags: "وسوم",
  status: "DRAFT",
  aiPrompt: "النص المستخدم لتوليد المحتوى"
}

const response = await fetch('/api/admin/articles/create-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Add authorization if needed
    // 'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify(articleData)
})

const result = await response.json()
console.log('Article created:', result)
```

## HTML Content Support

The `content.text` field supports full HTML markup including:

- Headings: `<h1>`, `<h2>`, `<h3>`, etc.
- Paragraphs: `<p>`
- Text formatting: `<strong>`, `<em>`, `<u>`, `<s>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Links: `<a href="...">`
- Images: `<img src="..." alt="...">`
- Blockquotes: `<blockquote>`
- Code: `<code>`, `<pre>`
- Tables: `<table>`, `<tr>`, `<td>`, etc.

## Authentication

Both APIs require authentication. Make sure to include the appropriate authorization headers:

```javascript
headers: {
  'Authorization': 'Bearer your-jwt-token'
}
```

## Error Handling

Both APIs return appropriate HTTP status codes and error messages:

- `400`: Bad request (missing required fields, invalid data)
- `401`: Unauthorized (missing or invalid authentication)
- `500`: Internal server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Image Server Configuration

**Server URL:** `http://13.61.185.194/static/image/`

- All WordPress images have been migrated to this server
- Nginx is configured to serve images from this location
- Images can be referenced directly using the full URL: `http://13.61.185.194/static/image/2025/02/image.jpg`
- The Next.js configuration has been updated to allow images from this hostname

**Example Image URLs:**
- `http://13.61.185.194/static/image/2025/02/Digital-Twin-cover.jpg`
- `http://13.61.185.194/static/image/2025/01/gis-tutorial.png`