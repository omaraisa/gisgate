'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">جاري تحميل الخريطة...</div>
    </div>
  ),
})

export default Map;
