'use client'

import { useState } from 'react'
import MapWrapper from '@/app/components/MapWrapper'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSending(false)
    setSent(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const officeLocation: [number, number] = [30.0444, 31.2357] // Cairo

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            تواصل معنا
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو اقتراح.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">أرسل لنا رسالة</h2>
            {sent ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center">
                تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
                <button 
                  onClick={() => setSent(false)}
                  className="block w-full mt-4 text-sm font-medium underline"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    الموضوع
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    الرسالة
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    'جاري الإرسال...'
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-600 text-sm">info@gisgate.com</p>
                <p className="text-gray-600 text-sm">support@gisgate.com</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">الهاتف</h3>
                <p className="text-gray-600 text-sm">+20 123 456 7890</p>
                <p className="text-gray-600 text-sm">الأحد - الخميس: 9ص - 5م</p>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white p-2 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 px-4 pt-4">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-gray-900">موقعنا</h3>
              </div>
              <MapWrapper 
                center={officeLocation}
                zoom={13}
                markers={[
                  {
                    position: officeLocation,
                    title: "GIS Gate HQ",
                    description: "المقر الرئيسي - القاهرة"
                  }
                ]}
                className="h-[300px] w-full rounded-xl z-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
