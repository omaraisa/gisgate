# AI Article Creation Guide

This guide explains how AI agents can create articles with text and images for the GIS Gate platform.

## Overview

The GIS Gate platform provides APIs for AI agents to create articles with integrated image uploads. The system uses MinIO for image storage and supports both text content and image attachments.

## API Endpoints

### 1. Create Article with Images (Recommended)

**Endpoint:** `POST /api/admin/articles/create`

**Content-Type:** `multipart/form-data`

**Description:** Create a complete article with text content and upload images in a single request.

#### Request Format

```javascript
const formData = new FormData();

// Required fields
formData.append('title', 'Your Article Title');
formData.append('content', 'Your article content in Markdown format...');

// Optional fields
formData.append('excerpt', 'Brief description of the article');
formData.append('slug', 'custom-article-slug'); // Auto-generated if not provided
formData.append('status', 'DRAFT'); // DRAFT, PUBLISHED, ARCHIVED
formData.append('category', 'GIS Tutorials');
formData.append('tags', 'gis,mapping,tutorial');
formData.append('metaTitle', 'SEO Title');
formData.append('metaDescription', 'SEO Description');
formData.append('featuredImage', 'https://example.com/featured-image.jpg');

// Image uploads (multiple files allowed)
formData.append('images', imageFile1); // File object
formData.append('images', imageFile2); // File object

// Send request
const response = await fetch('/api/admin/articles/create', {
  method: 'POST',
  body: formData
});
```

#### Image Placeholder System

When writing content, use placeholders for images that will be replaced with actual URLs:

```markdown
# My GIS Article

This is an introduction to GIS mapping.

[IMAGE_1]

Here we can see the coordinate system explained.

[IMAGE_2]

The final result shows the complete map.
```

The system will automatically replace `[IMAGE_1]`, `[IMAGE_2]`, etc. with the uploaded image URLs in Markdown image syntax.

#### Response

```json
{
  "id": "article-uuid",
  "title": "Your Article Title",
  "slug": "your-article-title",
  "content": "# My GIS Article\n\nThis is an introduction...\n\n![Image 1](http://13.61.185.194:9000/images/2025/01/abc123.jpg)\n\n...",
  "status": "DRAFT",
  "uploadedImages": [
    "http://13.61.185.194:9000/images/2025/01/abc123.jpg",
    "http://13.61.185.194:9000/images/2025/01/def456.jpg"
  ],
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 2. Upload Images Separately

**Endpoint:** `POST /api/admin/upload-image`

**Content-Type:** `multipart/form-data`

**Description:** Upload individual images and get their URLs for later use.

#### Request Format

```javascript
const formData = new FormData();
formData.append('image', imageFile); // Single image file

const response = await fetch('/api/admin/upload-image', {
  method: 'POST',
  body: formData
});
```

#### Response

```json
{
  "success": true,
  "imageUrl": "http://13.61.185.194:9000/images/2025/01/abc123.jpg",
  "objectKey": "2025/01/abc123.jpg",
  "fileName": "original-filename.jpg",
  "size": 245760,
  "type": "image/jpeg"
}
```

### 3. Create Article with Pre-uploaded Images (JSON)

**Endpoint:** `POST /api/admin/articles/create`

**Content-Type:** `application/json`

**Description:** Create an article using pre-uploaded image URLs.

#### Request Format

```javascript
const articleData = {
  title: "Your Article Title",
  slug: "your-article-slug",
  content: `# Article Content

![Map Example](http://13.61.185.194:9000/images/2025/01/map.jpg)

More content here...`,
  excerpt: "Brief description",
  status: "DRAFT",
  category: "GIS Tutorials",
  tags: "gis,mapping",
  featuredImage: "http://13.61.185.194:9000/images/2025/01/featured.jpg"
};

const response = await fetch('/api/admin/articles/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(articleData)
});
```

## Image Specifications

- **Supported Formats:** JPEG, PNG, GIF, WebP
- **Maximum Size:** 10MB per image
- **Storage:** MinIO object storage at `http://13.61.185.194:9000/images/`
- **Organization:** Images are stored with year/month structure (e.g., `2025/01/filename.jpg`)

## Best Practices for AI Agents

### 1. Content Structure
- Use Markdown format for article content
- Include descriptive alt text for images
- Provide meaningful titles and excerpts
- Use appropriate categories and tags

### 2. Image Handling
- Upload images before referencing them in content
- Use the placeholder system `[IMAGE_1]`, `[IMAGE_2]`, etc. for automatic replacement
- Ensure images are relevant and add value to the content
- Compress images when possible to reduce file sizes

### 3. Error Handling
- Check response status codes
- Handle validation errors (400 status)
- Implement retry logic for network failures
- Log errors for debugging

### 4. Article Status
- Use `DRAFT` for initial creation
- Change to `PUBLISHED` when ready for public viewing
- Use `ARCHIVED` for outdated content

## Example Workflow

```javascript
async function createGISArticle() {
  // Step 1: Prepare images
  const images = [
    await loadImageFile('coordinate-system-diagram.png'),
    await loadImageFile('gis-map-example.jpg'),
    await loadImageFile('projection-explanation.gif')
  ];

  // Step 2: Prepare article data
  const formData = new FormData();
  formData.append('title', 'Understanding GIS Coordinate Systems');
  formData.append('content', `# GIS Coordinate Systems Explained

Geographic Information Systems (GIS) rely on coordinate systems to accurately represent locations on Earth.

## What are Coordinate Systems?

Coordinate systems provide a framework for defining positions on the Earth's surface.

[IMAGE_1]

## Common Coordinate Systems

### Geographic Coordinate System (GCS)
Uses latitude and longitude to define positions.

[IMAGE_2]

### Projected Coordinate System (PCS)
Transforms the 3D Earth onto a 2D surface for mapping.

[IMAGE_3]

## Choosing the Right System

The choice of coordinate system depends on your mapping needs and the scale of your project.`);
  formData.append('excerpt', 'Learn about GIS coordinate systems and how they work');
  formData.append('category', 'GIS Fundamentals');
  formData.append('tags', 'gis,coordinates,mapping,projections');
  formData.append('status', 'DRAFT');

  // Step 3: Add images
  images.forEach((image, index) => {
    formData.append('images', image);
  });

  // Step 4: Create article
  try {
    const response = await fetch('/api/admin/articles/create', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Article created successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to create article:', error);
    throw error;
  }
}
```

## Authentication

Currently, the APIs are open for development. In production, include appropriate authentication headers as required by your security setup.

## Support

For issues or questions about the article creation APIs, refer to the backend logs or contact the development team.