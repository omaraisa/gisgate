import { prisma } from './prisma';

// WordPress API types
interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'private';
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: Record<string, unknown>;
  categories: number[];
  tags: number[];
  _links: Record<string, unknown>;
}

interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
}

interface WordPressMedia {
  id: number;
  date: string;
  slug: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, {
      file: string;
      width: number;
      height: number;
      mime_type: string;
      source_url: string;
    }>;
  };
  source_url: string;
  alt_text: string;
  caption: {
    rendered: string;
  };
}

interface MigrationConfig {
  wordpressUrl: string;
  batchSize: number;
  delayBetweenRequests: number;
  includeImages: boolean;
  overwriteExisting: boolean;
  statusMapping: {
    [key: string]: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  };
}

interface MigrationStats {
  totalPosts: number;
  processedPosts: number;
  successfulImports: number;
  failedImports: number;
  skippedPosts: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  link: string;
  avatar_urls: {
    [size: string]: string;
  };
}

interface WordPressSiteInfo {
  name?: string;
  description?: string;
  url?: string;
  home?: string;
  gmt_offset?: number;
  timezone_string?: string;
  namespaces?: string[];
  authentication?: Record<string, unknown>;
  routes?: Record<string, unknown>;
}

export class WordPressMigrator {
  private config: MigrationConfig;
  private stats: MigrationStats;
  private categories: Map<number, string> = new Map();
  private tags: Map<number, string> = new Map();
  private authors: Map<number, WordPressAuthor> = new Map();

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      wordpressUrl: config.wordpressUrl || '',
      batchSize: config.batchSize || 10,
      delayBetweenRequests: config.delayBetweenRequests || 1000,
      includeImages: config.includeImages ?? true,
      overwriteExisting: config.overwriteExisting ?? false,
      statusMapping: config.statusMapping || {
        'publish': 'PUBLISHED',
        'draft': 'DRAFT',
        'private': 'ARCHIVED'
      }
    };

    this.stats = {
      totalPosts: 0,
      processedPosts: 0,
      successfulImports: 0,
      failedImports: 0,
      skippedPosts: 0,
      errors: [],
      startTime: new Date()
    };
  }

  /**
   * Start the complete migration process
   */
  async migrate(): Promise<MigrationStats> {
    try {
      console.log('🚀 Starting WordPress migration...');
      console.log('WordPress URL:', this.config.wordpressUrl);

      // Step 1: Load categories and tags
      await this.loadCategoriesAndTags();

      // Step 2: Get total posts count
      this.stats.totalPosts = await this.getTotalPostsCount();
      console.log(`📊 Found ${this.stats.totalPosts} posts to migrate`);

      // Step 3: Migrate posts in batches
      await this.migratePosts();

      this.stats.endTime = new Date();
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
      
      console.log('✅ Migration completed!');
      console.log(`📈 Stats: ${this.stats.successfulImports}/${this.stats.totalPosts} posts migrated successfully`);
      console.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);

      return this.stats;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.stats.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Load categories, tags, and authors from WordPress
   */
  private async loadCategoriesAndTags(): Promise<void> {
    try {
      console.log('📂 Loading categories, tags, and authors...');

      // Load categories
      const categoriesResponse = await this.fetchFromWordPress('/wp/v2/categories?per_page=100');
      const categories: WordPressCategory[] = await categoriesResponse.json();
      categories.forEach(cat => {
        this.categories.set(cat.id, cat.name);
      });

      // Load tags
      const tagsResponse = await this.fetchFromWordPress('/wp/v2/tags?per_page=100');
      const tags: WordPressTag[] = await tagsResponse.json();
      tags.forEach(tag => {
        this.tags.set(tag.id, tag.name);
      });

      // Load authors
      const authorsResponse = await this.fetchFromWordPress('/wp/v2/users?per_page=100');
      const authors: WordPressAuthor[] = await authorsResponse.json();
      authors.forEach(author => {
        this.authors.set(author.id, author);
      });

      console.log(`📂 Loaded ${this.categories.size} categories, ${this.tags.size} tags, and ${this.authors.size} authors`);
    } catch (error) {
      console.error('Failed to load metadata:', error);
      // Continue without metadata
    }
  }

  /**
   * Get total number of posts to migrate
   */
  private async getTotalPostsCount(): Promise<number> {
    try {
      const response = await this.fetchFromWordPress('/wp/v2/posts?per_page=1&status=publish');
      const totalPosts = response.headers.get('X-WP-Total');
      return totalPosts ? parseInt(totalPosts, 10) : 0;
    } catch (error) {
      console.error('Failed to get total posts count:', error);
      return 0;
    }
  }

  /**
   * Migrate all posts in batches
   */
  private async migratePosts(): Promise<void> {
    const totalPages = Math.ceil(this.stats.totalPosts / this.config.batchSize);
    
    for (let page = 1; page <= totalPages; page++) {
      try {
        console.log(`📄 Processing page ${page}/${totalPages}...`);
        
        const posts = await this.fetchPosts(page);
        await this.processBatch(posts);
        
        // Add delay between requests to be respectful to the WordPress server
        if (page < totalPages) {
          await this.delay(this.config.delayBetweenRequests);
        }
      } catch (error) {
        console.error(`Failed to process page ${page}:`, error);
        this.stats.errors.push(`Failed to process page ${page}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Fetch posts from WordPress API
   */
  private async fetchPosts(page: number): Promise<WordPressPost[]> {
    const response = await this.fetchFromWordPress(
      `/wp/v2/posts?per_page=${this.config.batchSize}&page=${page}&status=publish&_embed`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Process a batch of posts
   */
  private async processBatch(posts: WordPressPost[]): Promise<void> {
    for (const post of posts) {
      try {
        await this.processPost(post);
        this.stats.successfulImports++;
      } catch (error) {
        console.error(`Failed to process post ${post.id} (${post.slug}):`, error);
        this.stats.failedImports++;
        this.stats.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      this.stats.processedPosts++;
      
      // Progress indicator
      if (this.stats.processedPosts % 10 === 0) {
        console.log(`📊 Progress: ${this.stats.processedPosts}/${this.stats.totalPosts} posts processed`);
      }
    }
  }

  /**
   * Process a single WordPress post
   */
  private async processPost(wpPost: WordPressPost): Promise<void> {
    // Decode the slug consistently
    const decodedSlug = this.decodeSlug(wpPost.slug);
    
    // Check if post already exists using the decoded slug
    const existingArticle = await prisma.article.findUnique({
      where: { slug: decodedSlug }
    });

    if (existingArticle && !this.config.overwriteExisting) {
      console.log(`⏭️ Skipping existing post: ${decodedSlug}`);
      this.stats.skippedPosts++;
      return;
    }

    // Extract and clean content
    const title = this.cleanHtml(wpPost.title.rendered);
    const excerpt = this.cleanHtml(wpPost.excerpt.rendered);
    let content = this.processContent(wpPost.content.rendered);

    // Transform image URLs in content to use your server
    content = this.transformImageUrls(content);

    // Map categories, tags, and author
    const categoryName = wpPost.categories.length > 0 ? this.categories.get(wpPost.categories[0]) : null;
    const tagNames = wpPost.tags.map(tagId => this.tags.get(tagId)).filter(Boolean) as string[];
    const author = this.authors.get(wpPost.author);

    // Get and transform featured image URL
    let featuredImageUrl: string | null = null;
    if (this.config.includeImages && wpPost.featured_media && wpPost._links?.['wp:featuredmedia']) {
      try {
        const originalImageUrl = await this.getFeaturedImageUrl(wpPost.featured_media);
        if (originalImageUrl) {
          featuredImageUrl = this.transformImageUrl(originalImageUrl);
        }
      } catch (error) {
        console.warn(`Failed to get featured image for post ${wpPost.id}:`, error);
      }
    }

    // Create or update article
    const articleData = {
      title,
      slug: decodedSlug, // Use the same decoded slug
      excerpt,
      content,
      status: this.config.statusMapping[wpPost.status] || 'DRAFT',
      publishedAt: wpPost.status === 'publish' ? new Date(wpPost.date) : null,
      featuredImage: featuredImageUrl,
      category: categoryName,
      tags: JSON.stringify(tagNames),
      author: author?.name || null,
      authorSlug: author?.slug || null,
      metaTitle: title,
      metaDescription: excerpt,
      aiGenerated: false,
      createdAt: new Date(wpPost.date),
      updatedAt: new Date(wpPost.modified)
    };

    let article;
    if (existingArticle) {
      article = await prisma.article.update({
        where: { id: existingArticle.id },
        data: articleData
      });
      console.log(`📝 Updated article: ${decodedSlug}`);
    } else {
      article = await prisma.article.create({
        data: articleData
      });
      console.log(`✨ Created article: ${decodedSlug}`);
    }

    // Process images in content
    if (this.config.includeImages) {
      await this.processContentImages(article.id, content);
    }
  }

  /**
   * Get featured image URL from WordPress media
   */
  private async getFeaturedImageUrl(mediaId: number): Promise<string | null> {
    try {
      const response = await this.fetchFromWordPress(`/wp/v2/media/${mediaId}`);
      if (response.ok) {
        const media: WordPressMedia = await response.json();
        return media.source_url;
      }
    } catch (error) {
      console.warn(`Failed to fetch media ${mediaId}:`, error);
    }
    return null;
  }

  /**
   * Extract and save images found in content
   */
  private async processContentImages(articleId: string, content: string): Promise<void> {
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
    const images: { url: string; alt: string; caption?: string }[] = [];
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      // Extract additional image attributes
      const imgTag = match[0];
      const captionMatch = imgTag.match(/title="([^"]*)"/);
      
      images.push({
        url: match[1], // URL is already transformed by transformImageUrls()
        alt: match[2] || '',
        caption: captionMatch ? captionMatch[1] : undefined
      });
    }

    if (images.length > 0) {
      try {
        await prisma.articleImage.createMany({
          data: images.map(img => ({
            articleId,
            url: img.url,
            alt: img.alt,
            caption: img.caption
          })),
          skipDuplicates: true
        });
        
        console.log(`📷 Saved ${images.length} images for article`);
      } catch (error) {
        console.warn(`Failed to save images for article ${articleId}:`, error);
      }
    }
  }

  /**
   * Process and clean HTML content
   */
  private processContent(content: string): string {
    return content
      // Remove WordPress-specific shortcodes
      .replace(/\[.*?\]/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Transform WordPress image URLs to use your server
   * Converts: https://gis-gate.com/wp-content/uploads/2025/02/image.jpg
   * To: http://13.61.185.194/static/image/2025/02/image.jpg
   */
  private transformImageUrls(content: string): string {
    const imageUrlRegex = /https?:\/\/gis-gate\.com\/wp-content\/uploads\/([^"'\s>]+)/g;
    
    return content.replace(imageUrlRegex, (match, path) => {
      return `http://13.61.185.194/static/image/${path}`;
    });
  }

  /**
   * Transform single WordPress image URL
   */
  private transformImageUrl(originalUrl: string): string {
    if (!originalUrl.includes('gis-gate.com/wp-content/uploads/')) {
      return originalUrl; // Return as-is if not a WordPress upload URL
    }

    // Extract the path after /wp-content/uploads/
    const match = originalUrl.match(/\/wp-content\/uploads\/(.+)$/);
    if (match) {
      return `http://13.61.185.194/static/image/${match[1]}`;
    }

    return originalUrl;
  }

  /**
   * Decode URL-encoded WordPress slugs
   */
  private decodeSlug(slug: string): string {
    try {
      return decodeURIComponent(slug);
    } catch (error) {
      console.warn(`Failed to decode slug: ${slug}`, error);
      return slug;
    }
  }

  /**
   * Clean HTML from text
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }

  /**
   * Fetch data from WordPress REST API
   */
  private async fetchFromWordPress(endpoint: string): Promise<Response> {
    const url = `${this.config.wordpressUrl}/wp-json${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GIS-Gate Article Migrator 1.0'
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`WordPress API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current migration statistics
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.fetchFromWordPress('/wp/v2');
      return response.ok;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }

  /**
   * Get WordPress site information
   */
  async getSiteInfo(): Promise<WordPressSiteInfo | null> {
    try {
      const response = await this.fetchFromWordPress('/wp/v2');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get WordPress site info:', error);
    }
    return null;
  }
}

// Export utility functions
export async function migrateFromWordPress(wordpressUrl: string, options: Partial<MigrationConfig> = {}) {
  const migrator = new WordPressMigrator({
    wordpressUrl,
    ...options
  });

  // Test connection first
  const isConnected = await migrator.testConnection();
  if (!isConnected) {
    throw new Error(`Cannot connect to WordPress site: ${wordpressUrl}`);
  }

  return await migrator.migrate();
}

// Export default configuration
export const defaultMigrationConfig: MigrationConfig = {
  wordpressUrl: '',
  batchSize: 10,
  delayBetweenRequests: 1000,
  includeImages: true,
  overwriteExisting: false,
  statusMapping: {
    'publish': 'PUBLISHED',
    'draft': 'DRAFT',
    'private': 'ARCHIVED'
  }
};