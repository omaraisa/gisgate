import Header from './components/Header';
import Footer from './components/Footer';
import PostCard from './components/PostCard';

export default function Home() {
  const videoPosts = [
    { title: 'تصميم الخرائط والتطبيقات على ArcGIS Online', link: '#' },
    { title: 'تبويب المعرض، المجموعات والمحتويات في ArcGIS Online', link: '#' },
    { title: 'تصميم خريطة ألغاز', link: '#' },
    { title: 'إنشاء المشاهد ثلاثية الأبعاد في ArcGIS Online', link: '#' },
    { title: 'كيف تستعمل الترميز الكمي والنوعي بطريقة خاطئة!', link: '#' },
    { title: 'مقدمة في ArcGIS Online', link: '#' },
  ];

  const articlePosts = [
    { title: 'الذكاء المكاني Location Intelligence', link: '#' },
    { title: 'تكامل GIS مع الطائرات بدون طيار (الدرونز)', link: '#' },
    { title: 'ألوان الخرائط', link: '#' },
    { title: 'التوأم الرقمي Digital Twin', link: '#' },
    { title: 'إضافات ازري الجديدة للمطورين', link: '#' },
    { title: 'خريطتك كما يراها أصحاب عمى الألوان', link: '#' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">بوابة نظم المعلومات الجغرافية</h2>
          <p className="text-xl text-gray-600">منصة تعليمية شاملة لتعلم نظم المعلومات الجغرافية</p>
        </section>

        {/* Watch a Lesson Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">شاهد درساً</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videoPosts.map((post, index) => (
              <PostCard key={index} title={post.title} link={post.link} />
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              تصفح المزيد &gt;&gt;
            </a>
          </div>
        </section>

        {/* Read an Article Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">أو اقرأ مقالة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articlePosts.map((post, index) => (
              <PostCard key={index} title={post.title} link={post.link} />
            ))}
          </div>
        </section>

        {/* What the Portal Offers */}
        <section className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">ما الذي تقدمه البوابة؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">الدروس التقنية</h3>
              <p className="text-gray-600">
                توفر البوابة باقة واسعة من الدروس التقنية مصحوبة بالبيانات الجغرافية والكتيبات
                الإرشادية وشتى المعينات التدريبية
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">التطبيقات</h3>
              <p className="text-gray-600">
                منصة جي بورتال عبارة عن تطبيق نظم معلومات جغرافية GeoApp متعدد المهام تم تطويره
                ليسمح للمستخدمين بإضافة ورفع مختلف أنواع البيانات
              </p>
            </div>
          </div>
        </section>

        {/* Applications Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">تطبيقات البوابة</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">جي بورتال</h3>
                <p className="text-gray-600">
                  منصة جي بورتال عبارة عن تطبيق نظم معلومات جغرافية GeoApp متعدد المهام تم تطويره
                  ليسمح للمستخدمين بإضافة ورفع مختلف أنواع البيانات مثل الشيبفايل وملفات الاكسل
                  ومن ثم إجراء مختلف العمليات عليها كالاستكشاف، التحرير، الاستعلام، التحليل، الترميز
                  ومن ثم تصدير النتائج وطباعة الخرائط. تم تطوير هذه المنصة لتكون برنامجاً خدمياً
                  SaaS يمكن الوصول إليه من أي مكان وعبر مختلف أنواع الأجهزة ونظم التشغيل.
                </p>
                <a href="https://rebrand.ly/gportal" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                  جرب الآن
                </a>
              </div>
              <div className="md:w-1/2 md:ml-8">
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">صورة التطبيق</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
