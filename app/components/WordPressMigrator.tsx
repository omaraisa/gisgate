import React, { useState } from 'react';

interface MigrationStats {
  totalPosts: number;
  processedPosts: number;
  successfulImports: number;
  failedImports: number;
  skippedPosts: number;
  errors: string[];
  startTime: string;
  endTime?: string;
}

interface PreviewPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  date: string;
  author: string;
  featuredImage: string | null;
  excerpt: string;
}

interface SiteInfo {
  name?: string;
  description?: string;
  url?: string;
  namespaces?: string[];
}

export default function WordPressMigrator() {
  const [wordpressUrl, setWordpressUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [previewPosts, setPreviewPosts] = useState<PreviewPost[]>([]);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Migration options
  const [includeImages, setIncludeImages] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(1000);

  const testConnection = async () => {
    if (!wordpressUrl.trim()) {
      setErrors(['Please enter a WordPress URL']);
      return;
    }

    setIsConnecting(true);
    setErrors([]);
    
    try {
      const response = await fetch(`/api/wordpress-migrate?action=test&url=${encodeURIComponent(wordpressUrl)}`);
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('success');
        // Get site info and preview
        await Promise.all([getSiteInfo(), getPreview()]);
      } else {
        setConnectionStatus('error');
        setErrors(['Failed to connect to WordPress site. Please check the URL.']);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrors([error instanceof Error ? error.message : 'Connection failed']);
    } finally {
      setIsConnecting(false);
    }
  };

  const getSiteInfo = async () => {
    try {
      const response = await fetch(`/api/wordpress-migrate?action=info&url=${encodeURIComponent(wordpressUrl)}`);
      const data = await response.json();
      setSiteInfo(data.siteInfo);
    } catch (error) {
      console.warn('Failed to get site info:', error);
    }
  };

  const getPreview = async () => {
    try {
      const response = await fetch(`/api/wordpress-migrate?action=preview&url=${encodeURIComponent(wordpressUrl)}`);
      const data = await response.json();
      setPreviewPosts(data.preview || []);
    } catch (error) {
      console.warn('Failed to get preview:', error);
    }
  };

  const startMigration = async () => {
    setIsMigrating(true);
    setErrors([]);
    setMigrationStats(null);

    try {
      const response = await fetch('/api/wordpress-migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordpressUrl,
          includeImages,
          overwriteExisting,
          batchSize,
          delayBetweenRequests,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMigrationStats(data.stats);
      } else {
        setErrors([data.error || 'Migration failed']);
        if (data.details) {
          setErrors(prev => [...prev, data.details]);
        }
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Migration failed']);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">WordPress to PostgreSQL Migrator</h1>
        <p className="text-gray-600">
          Import your WordPress articles into the PostgreSQL database using the WordPress REST API.
        </p>
      </div>

      {/* Connection Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Connect to WordPress Site</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="url"
            value={wordpressUrl}
            onChange={(e) => setWordpressUrl(e.target.value)}
            placeholder="https://your-wordpress-site.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isMigrating}
          />
          <button
            onClick={testConnection}
            disabled={isConnecting || isMigrating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isConnecting ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {connectionStatus === 'success' && (
          <div className="p-4 bg-green-100 border border-green-400 rounded-md">
            <p className="text-green-700 font-medium">✅ Connection successful!</p>
            {siteInfo && (
              <div className="mt-2 text-sm text-green-600">
                <p><strong>Site:</strong> {siteInfo.name || 'Unknown'}</p>
                <p><strong>Description:</strong> {siteInfo.description || 'No description'}</p>
                <p><strong>URL:</strong> {siteInfo.url || wordpressUrl}</p>
              </div>
            )}
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="p-4 bg-red-100 border border-red-400 rounded-md">
            <p className="text-red-700 font-medium">❌ Connection failed</p>
            <p className="text-sm text-red-600 mt-1">
              Make sure the WordPress site is accessible and has the REST API enabled.
            </p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {connectionStatus === 'success' && previewPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Preview Articles</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600 mb-4">
              Here are the first 5 articles that will be migrated:
            </p>
            <div className="space-y-3">
              {previewPosts.map((post) => (
                <div key={post.id} className="bg-white p-4 rounded border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800 flex-1">{post.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ml-2 ${
                      post.status === 'publish' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  {post.featuredImage && (
                    <div className="mb-3">
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.excerpt}</p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div><strong>Author:</strong> {post.author}</div>
                    <div><strong>Slug:</strong> {post.slug}</div>
                    <div><strong>Date:</strong> {new Date(post.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Migration Options */}
      {connectionStatus === 'success' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Migration Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Content Options</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="mr-2"
                  />
                  Include images in migration
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="mr-2"
                  />
                  Overwrite existing articles
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Performance Options</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Size: {batchSize}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Between Requests: {delayBetweenRequests}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={delayBetweenRequests}
                    onChange={(e) => setDelayBetweenRequests(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Migration */}
      {connectionStatus === 'success' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Start Migration</h2>
          <button
            onClick={startMigration}
            disabled={isMigrating}
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isMigrating ? 'Migrating Articles...' : 'Start Migration'}
          </button>
          
          {isMigrating && (
            <div className="mt-4 p-4 bg-blue-100 border border-blue-400 rounded-md">
              <p className="text-blue-700 font-medium">🚀 Migration in progress...</p>
              <p className="text-sm text-blue-600 mt-1">
                This may take several minutes depending on the number of articles.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Migration Results */}
      {migrationStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
          <div className="bg-green-100 border border-green-400 rounded-md p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{migrationStats.totalPosts}</div>
                <div className="text-sm text-green-600">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{migrationStats.successfulImports}</div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">{migrationStats.failedImports}</div>
                <div className="text-sm text-yellow-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{migrationStats.skippedPosts}</div>
                <div className="text-sm text-blue-600">Skipped</div>
              </div>
            </div>
            
            {migrationStats.endTime && (
              <p className="text-sm text-green-600">
                Migration completed in {Math.round((new Date(migrationStats.endTime).getTime() - new Date(migrationStats.startTime).getTime()) / 1000)}s
              </p>
            )}

            {migrationStats.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-red-700 mb-2">Errors:</h3>
                <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                  {migrationStats.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-8">
          <div className="bg-red-100 border border-red-400 rounded-md p-4">
            <h3 className="font-medium text-red-700 mb-2">Errors:</h3>
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 mb-1">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Enter your WordPress site URL (e.g., https://yoursite.com)</li>
          <li>2. Test the connection to ensure the WordPress REST API is accessible</li>
          <li>3. Review the preview of articles that will be migrated</li>
          <li>4. Configure migration options as needed</li>
          <li>5. Start the migration process</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Note: The WordPress REST API must be enabled (it's enabled by default in WordPress 4.7+).
          The migration will preserve article content, categories, tags, and featured images.
        </p>
      </div>
    </div>
  );
}