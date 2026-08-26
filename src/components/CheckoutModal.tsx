'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useActiveOffer } from '@/components/OfferProvider';
import { calculateDiscountedPrice } from '@/lib/pricing';
import { getSessionId } from '@/components/SessionTracker';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CheckoutModal() {
  const { items, totalPrice, originalTotalPrice, clearCart, isCheckoutModalOpen, setCheckoutModalOpen } = useCart();
  const { offer } = useActiveOffer();
  
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingRates, setShippingRates] = useState<Record<string, number>>({});
  
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isCheckoutModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCheckoutModalOpen]);

  // If cart gets empty while modal is open (and not submitted), close it
  useEffect(() => {
    if (items.length === 0 && !isSubmitted && isCheckoutModalOpen) {
      setCheckoutModalOpen(false);
    }
  }, [items, isSubmitted, isCheckoutModalOpen, setCheckoutModalOpen]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const docRef = doc(db, 'settings', 'shipping');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists() && snapshot.data().rates) {
          setShippingRates(snapshot.data().rates);
        }
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
      }
    };
    fetchRates();
  }, []);

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
    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم بالكامل مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    else if (!/^01[0125][0-9]{8}$/.test(formData.phone)) newErrors.phone = 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 010...)';
    if (!formData.city.trim()) newErrors.city = 'المدينة / المنطقة مطلوبة';
    if (!formData.detailedAddress.trim()) newErrors.detailedAddress = 'العنوان بالتفصيل مطلوب';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('يرجى تصحيح الأخطاء في الاستمارة.');
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
        throw new Error(`خطأ في الخادم. يرجى التأكد من أن الواجهة الخلفية تعمل بشكل صحيح.`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل في إتمام الطلب');
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
      
    } catch (err: any) {
      setGlobalError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCheckoutModalOpen(false);
    // Reset state after a delay to allow for animation
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData(prev => ({ ...prev, orderNotes: '', paymentMethod: 'Cash on Delivery' }));
    }, 300);
  };

  if (!isCheckoutModalOpen) return null;

  const deliveryFee = shippingRates[formData.governorate] !== undefined ? shippingRates[formData.governorate] : 50;
  const finalTotal = totalPrice + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-cairo bg-black/60 backdrop-blur-sm transition-opacity" dir="rtl">
      <div 
        className="bg-[#FAFAFA] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-4 sm:p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-[#1a1a2e]">
            {isSubmitted ? 'تأكيد الطلب' : 'إتمام الطلب'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-2 transition-colors w-10 h-10 flex items-center justify-center"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {isSubmitted ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4">تم استلام طلبك بنجاح!</h1>
              <p className="text-gray-600 mb-8 leading-relaxed font-medium max-w-md mx-auto">
                شكراً لتسوقك من وقت (Waqt). لقد وصل طلبك للمسؤول بنجاح، وسنقوم بالتواصل معك قريباً عبر الواتساب لتأكيد التفاصيل ومتابعة الأوردر.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                <Link href="/products" onClick={handleClose} className="btn-gold py-4 px-8 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all text-center flex-1">
                  متابعة التسوق
                </Link>
                <button onClick={handleClose} className="py-4 px-8 rounded-xl font-semibold text-[#1a1a2e] bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-center flex-1">
                  إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form and Summary */
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Checkout Form */}
              <div className="lg:w-3/5">
                <form id="checkout-form" onSubmit={handleSubmit} className="bg-white rounded-xl p-5 md:p-7 shadow-sm border border-gray-100 space-y-6">
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
                        rows={2}
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
                </form>
              </div>
              
              {/* Order Summary Sidebar */}
              <div className="lg:w-2/5 flex flex-col gap-6">
                <div className="bg-white rounded-xl p-5 md:p-7 shadow-sm border border-gray-100 sticky top-0">
                  <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">ملخص الطلب</h2>
                  
                  <div className="space-y-4 mb-6 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4">
                        <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          <img 
                            src={item.image || '/placeholder-watch.svg'} 
                            alt={item.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-watch.svg';
                            }}
                          />
                          <span className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-lg z-10">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-grow flex flex-col justify-center">
                          <h4 className="text-sm font-semibold text-[#1a1a2e] mb-1 break-words">{item.name}</h4>
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
                      <span>الشحن ({governorates.find(g => g.id === formData.governorate)?.name})</span>
                      <span className="font-medium">{deliveryFee > 0 ? `${deliveryFee} جنيه` : 'مجاني'}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-center">
                      <span className="text-base font-bold text-[#1a1a2e]">الإجمالي</span>
                      <span className="text-xl font-bold text-[#D4A853]">
                        {finalTotal.toLocaleString()} جنيه
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 md:p-7 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-[#1a1a2e] mb-4">تسوق بأمان</h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> منتجات أصلية 100%
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> دفع وتسوق آمن
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> متوفر الدفع عند الاستلام
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Actions) */}
        {!isSubmitted && (
          <div className="bg-white border-t border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-0 z-10">
            <div className="hidden sm:flex items-center gap-3 text-sm text-green-800 bg-green-50 py-2 px-4 rounded-xl border border-green-100">
              <span className="text-lg">💬</span>
              <p className="font-medium">ستصلك رسالة تأكيد على الواتساب فور إتمام الطلب.</p>
            </div>
            
            <div className="flex w-full sm:w-auto gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="py-3 px-6 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors w-1/3 sm:w-auto"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="btn-gold py-3 px-8 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-70 flex-1 sm:flex-none min-w-[200px]"
              >
                {loading ? (
                  <><span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> جاري التنفيذ...</>
                ) : (
                  'تأكيد الطلب'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
