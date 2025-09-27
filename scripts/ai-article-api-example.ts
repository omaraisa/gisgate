// Example usage of the AI Article Creation API
// Images are hosted on the pre-configured server: http://13.61.185.194/static/image/

const API_BASE = 'http://localhost:3000' // Change this to your actual API URL

// Create an AI-generated article
async function createAIArticle(articleData: {
  article_title: string
  article_excerpt?: string
  content: {
    text: string
    image?: string
  }
  category?: string
  tags?: string
  status?: 'DRAFT' | 'PUBLISHED'
  aiPrompt?: string
}) {
  const response = await fetch(`${API_BASE}/api/admin/articles/create-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authorization header if needed
      // 'Authorization': 'Bearer your-token-here'
    },
    body: JSON.stringify(articleData),
  })

  if (!response.ok) {
    throw new Error('Failed to create article')
  }

  const result = await response.json()
  return result
}

// Example usage with images from the pre-configured server
async function createArticleExample() {
  const articleData = {
    article_title: "دليل شامل لنظم المعلومات الجغرافية",
    article_excerpt: "تعرف على أساسيات نظم المعلومات الجغرافية وتطبيقاتها",
    content: {
      text: `
        <h1>مقدمة في نظم المعلومات الجغرافية</h1>
        <p>نظم المعلومات الجغرافية (GIS) هي أدوات قوية لتحليل وتصور البيانات المكانية.</p>

        <img src="http://13.61.185.194/static/image/2025/02/Digital-Twin-cover.jpg" alt="غلاف التوأم الرقمي" style="max-width: 100%; height: auto;">

        <h2>ما هي نظم المعلومات الجغرافية؟</h2>
        <p>GIS هي نظام يجمع بين البيانات الجغرافية والمعلومات المرتبطة بها لإنشاء خرائط تفاعلية وتحليلات مكانية.</p>

        <h2>تطبيقات GIS</h2>
        <ul>
          <li>التخطيط الحضري</li>
          <li>إدارة الموارد الطبيعية</li>
          <li>النقل واللوجستيات</li>
          <li>البيئة والتغير المناخي</li>
        </ul>

        <blockquote>
          "نظم المعلومات الجغرافية تغير طريقة تفكيرنا في البيانات"
        </blockquote>
      `,
      image: "http://13.61.185.194/static/image/2025/02/Digital-Twin-cover.jpg"
    },
    category: "تعليم",
    tags: "GIS, خرائط, تحليل مكاني",
    status: "DRAFT" as const,
    aiPrompt: "اكتب مقالة تعليمية عن نظم المعلومات الجغرافية"
  }

  try {
    console.log('Creating article...')
    const article = await createAIArticle(articleData)
    console.log('Article created successfully:', article)
    return article
  } catch (error) {
    console.error('Error creating article:', error)
    throw error
  }
}

export { createAIArticle, createArticleExample }