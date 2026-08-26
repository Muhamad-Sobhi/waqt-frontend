'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useActiveOffer } from '@/components/OfferProvider';
import { calculateDiscountedPrice } from '@/lib/pricing';
import { getSessionId } from '@/components/SessionTracker';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, originalTotalPrice, clearCart } = useCart();
  const { offer } = useActiveOffer();
  
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    governorate: 'Cairo',
    city: '',
    detailedAddress: '',
    orderNotes: '',
    paymentMethod: 'Cash on Delivery'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const governorates = [
    { id: 'Cairo', name: 'القاهرة' }, { id: 'Giza', name: 'الجيزة' }, { id: 'Alexandria', name: 'الإسكندرية' },
    { id: 'Qalyubia', name: 'القليوبية' }, { id: 'Dakahlia', name: 'الدقهلية' }, { id: 'Sharqia', name: 'الشرقية' },
    { id: 'Gharbia', name: 'الغربية' }, { id: 'Monufia', name: 'المنوفية' }, { id: 'Beheira', name: 'البحيرة' },
    { id: 'Ismailia', name: 'الإسماعيلية' }, { id: 'Port Said', name: 'بورسعيد' }, { id: 'Suez', name: 'السويس' },
    { id: 'Faiyum', name: 'الفيوم' }, { id: 'Beni Suef', name: 'بني سويف' }, { id: 'Minya', name: 'المنيا' },
    { id: 'Asyut', name: 'أسيوط' }, { id: 'Sohag', name: 'سوهاج' }, { id: 'Qena', name: 'قنا' },
    { id: 'Luxor', name: 'الأقصر' }, { id: 'Aswan', name: 'أسوان' }, { id: 'Red Sea', name: 'البحر الأحمر' },
    { id: 'New Valley', name: 'الوادي الجديد' }, { id: 'Matrouh', name: 'مطروح' }, { id: 'North Sinai', name: 'شمال سيناء' },
    { id: 'South Sinai', name: 'جنوب سيناء' }
  ];

  useEffect(() => {
    if (items.length === 0 && !isSubmitted) {
      router.push('/cart');
    }
  }, [items, isSubmitted, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInfo = localStorage.getItem('userInfo');
      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);
          setFormData(prev => ({
            ...prev,
            fullName: parsedInfo.fullName || prev.fullName,
            phone: parsedInfo.phone || prev.phone,
            governorate: parsedInfo.governorate || prev.governorate,
            city: parsedInfo.city || prev.city,
            detailedAddress: parsedInfo.detailedAddress || prev.detailedAddress
          }));
        } catch (e) {
          console.error('Error loading saved info', e);
        }
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError('');
    
    // Inline validation
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
    else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid Egyptian mobile number (e.g., 010...)';
    if (!formData.city.trim()) newErrors.city = 'City / Area is required';
    if (!formData.detailedAddress.trim()) newErrors.detailedAddress = 'Detailed Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('Please fix the errors in the form.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: formData.fullName,
            phone: formData.phone,
            governorate: formData.governorate,
            city: formData.city,
            detailedAddress: formData.detailedAddress,
          },
          items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          orderNotes: formData.orderNotes,
          paymentMethod: formData.paymentMethod,
          sessionId: getSessionId(),
        })
      });

      let result;
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse checkout API response as JSON. Raw response:', responseText);
        throw new Error(`Server error. Please ensure the backend is running correctly.`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process checkout');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          governorate: formData.governorate,
          city: formData.city,
          detailedAddress: formData.detailedAddress
        }));
      }

      setIsSubmitted(true);
      clearCart();
      router.push('/checkout/success');
      
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !isSubmitted) return null; // Let useEffect handle redirect

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        <Link href="/cart" className="inline-flex items-center text-gray-500 hover:text-[#D4A853] mb-8 transition-colors">
          ← العودة للسلة
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Checkout Form */}
          <div className="lg:w-3/5">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-8">إتمام الطلب</h1>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
              {globalError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                  {globalError}
                </div>
              )}
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">بيانات الاتصال</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">الاسم بالكامل *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full bg-white border ${errors.fullName ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all`}
                      placeholder="محمد أحمد"
                      required
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full bg-white border ${errors.phone ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all`}
                      placeholder="01xxxxxxxxx"
                      required
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">عنوان الشحن</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 mb-1">المحافظة *</label>
                    <select
                      id="governorate"
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/20 outline-none transition-all appearance-none"
                      required
                    >
                      {governorates.map(gov => (
                        <option key={gov.id} value={gov.id}>{gov.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">المدينة / المنطقة *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full bg-white border ${errors.city ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all`}
                      placeholder="مدينة نصر"
                      required
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="detailedAddress" className="block text-sm font-medium text-gray-700 mb-1">العنوان بالتفصيل *</label>
                  <textarea
                    id="detailedAddress"
                    name="detailedAddress"
                    value={formData.detailedAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full bg-white border ${errors.detailedAddress ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all resize-none`}
                    placeholder="اسم الشارع، رقم العمارة، رقم الشقة..."
                    required
                  ></textarea>
                  {errors.detailedAddress && <p className="text-red-500 text-xs mt-1">{errors.detailedAddress}</p>}
                </div>
                
                <div>
                  <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات الطلب (اختياري)</label>
                  <textarea
                    id="orderNotes"
                    name="orderNotes"
                    value={formData.orderNotes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/20 outline-none transition-all resize-none"
                    placeholder="أي طلبات خاصة أو تعليمات للتوصيل..."
                  ></textarea>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">طريقة الدفع</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Cash on Delivery', label: 'الدفع عند الاستلام', icon: '💵' },
                    { id: 'Vodafone Cash', label: 'فودافون كاش', icon: '📱' },
                    { id: 'InstaPay', label: 'إنستاباي', icon: '🏦' }
                  ].map((method) => (
                    <label 
                      key={method.id} 
                      className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === method.id 
                          ? 'border-[#D4A853] bg-amber-50 shadow-sm' 
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.id} 
                        checked={formData.paymentMethod === method.id}
                        onChange={handleInputChange}
                        className="sr-only" 
                      />
                      <span className="text-3xl mb-2">{method.icon}</span>
                      <span className={`font-semibold text-sm ${formData.paymentMethod === method.id ? 'text-[#D4A853]' : 'text-gray-700'}`}>
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.paymentMethod !== 'Cash on Delivery' ? (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                    لقد اخترت <strong>{formData.paymentMethod === 'Vodafone Cash' ? 'فودافون كاش' : 'إنستاباي'}</strong>. سيتواصل فريقنا معك على الواتساب لتزويدك بتفاصيل الدفع بعد تأكيد الطلب.
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-700">
                    ادفع بأمان نقداً عند استلام طلبك.
                  </div>
                )}
              </div>
              
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <><span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> جاري التنفيذ...</>
                  ) : (
                    'تأكيد الطلب'
                  )}
                </button>
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3 text-sm text-green-800">
                  <span className="text-xl">💬</span>
                  <p className="font-medium mt-0.5">ستصلك رسالة تأكيد على الواتساب فور إتمام الطلب.</p>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <span className="text-green-600">🔒</span>
                  <span>دفع وتسوق آمن 100%</span>
                </div>
              </div>
            </form>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:w-2/5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <Link href={`/products/${item.productId}`} className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 hover:opacity-80 transition-opacity">
                      <img 
                        src={item.image || '/placeholder-watch.svg'} 
                        alt={item.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-watch.svg';
                        }}
                      />
                      <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm z-10">
                        {item.quantity}
                      </span>
                    </Link>
                    <div className="flex-grow flex flex-col justify-center">
                      <Link href={`/products/${item.productId}`}>
                        <h4 className="text-sm font-semibold text-[#1a1a2e] mb-1 break-words hover:text-[#D4A853] transition-colors">{item.name}</h4>
                      </Link>
                      <p className="text-xs text-gray-500 mb-1 uppercase font-medium">{item.brand}</p>
                      {(() => {
                        const p = calculateDiscountedPrice(item.price, item.productId, offer);
                        return (
                          <div className="flex flex-col">
                            {p.hasDiscount && (
                              <span className="text-gray-400 line-through text-xs">{(p.originalPrice * item.quantity).toLocaleString()} جنيه</span>
                            )}
                            <p className="text-sm font-medium text-[#D4A853]">
                              {(p.finalPrice * item.quantity).toLocaleString()} جنيه
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span>{originalTotalPrice.toLocaleString()} جنيه</span>
                </div>
                {originalTotalPrice > totalPrice && (
                  <div className="flex justify-between text-sm text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 my-1">
                    <span>قيمة الخصم</span>
                    <span>-{(originalTotalPrice - totalPrice).toLocaleString()} جنيه</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>الشحن</span>
                  <span className="text-green-600 font-medium">مجاني</span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-center">
                  <span className="text-base font-bold text-[#1a1a2e]">الإجمالي</span>
                  <span className="text-xl font-bold text-[#D4A853]">
                    {totalPrice.toLocaleString()} جنيه
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
              <h3 className="text-lg font-semibold text-[#1a1a2e] mb-4">تسوق بأمان</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> منتجات أصلية 100%
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> دفع وتسوق آمن
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> متوفر الدفع عبر إنستاباي أو فودافون كاش
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> متوفر الدفع عند الاستلام
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
