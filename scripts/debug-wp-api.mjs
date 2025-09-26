import fetch from 'node-fetch';

async function debugWordPressAPI() {
  const baseUrl = 'https://gis-gate.com';
  
  console.log('🔍 Debugging WordPress REST API...\n');
  
  try {
    // Test 1: Basic API endpoint
    console.log('1. Testing basic API endpoint...');
    const apiResponse = await fetch(`${baseUrl}/wp-json/wp/v2`);
    console.log(`Status: ${apiResponse.status} ${apiResponse.statusText}`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('Available namespaces:', apiData.namespaces);
    } else {
      console.log('Error response:', await apiResponse.text());
    }
    
    // Test 2: Posts endpoint with different parameters
    console.log('\n2. Testing posts endpoint...');
    const postsResponse = await fetch(`${baseUrl}/wp-json/wp/v2/posts`);
    console.log(`Status: ${postsResponse.status} ${postsResponse.statusText}`);
    
    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      console.log(`Found ${posts.length} posts`);
      
      if (posts.length > 0) {
        const post = posts[0];
        console.log('\nFirst post details:');
        console.log(`- ID: ${post.id}`);
        console.log(`- Title: ${post.title?.rendered || 'No title'}`);
        console.log(`- Slug: ${post.slug}`);
        console.log(`- Status: ${post.status}`);
        console.log(`- Date: ${post.date}`);
        console.log(`- Author: ${post.author}`);
      }
    } else {
      console.log('Error response:', await postsResponse.text());
    }
    
    // Test 3: Check different post statuses
    console.log('\n3. Testing different post statuses...');
    const statusesToTest = ['publish', 'draft', 'any'];
    
    for (const status of statusesToTest) {
      try {
        const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts?status=${status}&per_page=1`);
        console.log(`Status "${status}": ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const posts = await response.json();
          const totalHeader = response.headers.get('X-WP-Total');
          console.log(`  Total posts with status "${status}": ${totalHeader || posts.length}`);
        }
      } catch (error) {
        console.log(`  Error testing status "${status}":`, error.message);
      }
    }
    
    // Test 4: Categories and Tags
    console.log('\n4. Testing categories and tags...');
    
    try {
      const categoriesResponse = await fetch(`${baseUrl}/wp-json/wp/v2/categories?per_page=10`);
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        console.log(`Found ${categories.length} categories`);
      }
    } catch (error) {
      console.log('Categories error:', error.message);
    }
    
    try {
      const tagsResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags?per_page=10`);
      if (tagsResponse.ok) {
        const tags = await tagsResponse.json();
        console.log(`Found ${tags.length} tags`);
      }
    } catch (error) {
      console.log('Tags error:', error.message);
    }
    
    // Test 5: Media/Images
    console.log('\n5. Testing media endpoint...');
    try {
      const mediaResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media?per_page=3`);
      console.log(`Media Status: ${mediaResponse.status} ${mediaResponse.statusText}`);
      
      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
        console.log(`Found ${media.length} media items`);
        
        if (media.length > 0) {
          const item = media[0];
          console.log(`Sample media: ${item.source_url}`);
        }
      }
    } catch (error) {
      console.log('Media error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugWordPressAPI();