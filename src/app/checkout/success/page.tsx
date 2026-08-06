'use client';

import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4" dir="rtl">تم استلام طلبك بنجاح!</h1>
        <p className="text-gray-600 mb-8 leading-relaxed font-medium" dir="rtl">
          شكراً لتسوقك من وقت (Waqt). لقد وصل طلبك للمسؤول بنجاح، وسنقوم بالتواصل معك قريباً عبر الواتساب لتأكيد التفاصيل ومتابعة الأوردر.
        </p>
        
        <div className="space-y-4">
          <Link href="/products" className="btn-gold block w-full py-4 rounded-xl text-center font-semibold text-white shadow-md hover:shadow-lg transition-all">
            متابعة التسوق
          </Link>
          <Link href="/" className="block w-full py-4 rounded-xl text-center font-semibold text-[#1a1a2e] bg-gray-50 hover:bg-gray-100 transition-colors">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
