// Test script for the AI Article Creation API
// Run with: npx tsx scripts/test-ai-article-api.ts

import { createAIArticle } from './ai-article-api-example'

async function testAIArticleAPI() {
  console.log('🧪 Testing AI Article Creation API...')

  const testArticle = {
    article_title: "اختبار إنشاء مقالة بالذكاء الاصطناعي",
    article_excerpt: "هذه مقالة اختبار تم إنشاؤها عبر API الذكاء الاصطناعي",
    content: {
      text: `
        <h1>مقدمة الاختبار</h1>
        <p>هذه المقالة تم إنشاؤها لاختبار API إنشاء المقالات بالذكاء الاصطناعي.</p>

        <img src="http://13.61.185.194/static/image/2025/02/Digital-Twin-cover.jpg" alt="صورة اختبار" style="max-width: 100%;">

        <h2>كيف يعمل النظام</h2>
        <ul>
          <li>يستقبل البيانات بتنسيق JSON</li>
          <li>يدعم HTML كامل للتنسيق</li>
          <li>يستخدم الصور من الخادم المعد</li>
        </ul>

        <blockquote>
          "الذكاء الاصطناعي يساعد في إنشاء المحتوى بكفاءة"
        </blockquote>
      `,
      image: "http://13.61.185.194/static/image/2025/02/Digital-Twin-cover.jpg"
    },
    category: "اختبار",
    tags: "API, ذكاء اصطناعي, اختبار",
    status: "DRAFT" as const,
    aiPrompt: "أنشئ مقالة اختبار للتحقق من عمل API"
  }

  try {
    const result = await createAIArticle(testArticle)
    console.log('✅ Article created successfully!')
    console.log('📄 Article ID:', result.article.id)
    console.log('🔗 Article Slug:', result.article.slug)
    console.log('📊 Status:', result.article.status)
    console.log('🤖 AI Generated:', result.article.aiGenerated)
    return result
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIArticleAPI()
    .then(() => {
      console.log('🎉 Test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test failed:', error)
      process.exit(1)
    })
}

export { testAIArticleAPI }