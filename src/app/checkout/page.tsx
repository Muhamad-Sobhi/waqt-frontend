'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { getSessionId } from '@/components/SessionTracker';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  
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

  const governorates = [
    'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Dakahlia', 'Sharqia', 
    'Gharbia', 'Monufia', 'Beheira', 'Ismailia', 'Port Said', 'Suez', 
    'Faiyum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan',
    'Red Sea', 'New Valley', 'Matrouh', 'North Sinai', 'South Sinai'
  ];

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

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
      const processedItems = items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        imageUrl: item.image || '',
      }));

      const totalItemsInOrder = processedItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalAmount = totalPrice;

      const batch = writeBatch(db);

      // 1. Customer Profile
      const customerRef = doc(db, 'customers', formData.phone);
      batch.set(customerRef, {
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        defaultAddress: {
          governorate: formData.governorate,
          city: formData.city,
          detailedAddress: formData.detailedAddress
        },
        totalOrdersCount: increment(1),
        totalItemsBought: increment(totalItemsInOrder),
        totalSpend: increment(totalAmount),
        lastPurchaseDate: serverTimestamp(),
      }, { merge: true });

      // 2. Create Order
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        customerPhone: formData.phone,
        customerName: formData.fullName,
        deliveryAddress: {
          governorate: formData.governorate,
          city: formData.city,
          detailedAddress: formData.detailedAddress
        },
        orderNotes: formData.orderNotes || '',
        paymentMethod: formData.paymentMethod || 'Cash on Delivery',
        items: processedItems,
        subtotal: totalAmount,
        deliveryFee: 0,
        totalPrice: totalAmount,
        status: 'pending',
        whatsappStatus: { sent: false },
        trackingSessionId: getSessionId(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Update Session
      const sessionId = getSessionId();
      if (sessionId) {
        const sessionRef = doc(db, 'sessions', sessionId);
        batch.set(sessionRef, {
          linkedPhoneNumber: formData.phone,
          lastActive: serverTimestamp(),
        }, { merge: true });
      }

      // 4. Create Notification
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        type: 'new_order',
        title: 'New Order Received',
        message: `Order from ${formData.fullName} for ${totalAmount.toLocaleString()} EGP`,
        orderId: orderRef.id,
        customerPhone: formData.phone,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Execute all writes atomically
      await batch.commit();

      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          governorate: formData.governorate,
          city: formData.city,
          detailedAddress: formData.detailedAddress
        }));
      }

      clearCart();
      router.push('/checkout/success');
      
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null; // Let useEffect handle redirect

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        <Link href="/cart" className="inline-flex items-center text-gray-500 hover:text-[#D4A853] mb-8 transition-colors">
          ← Back to Cart
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Checkout Form */}
          <div className="lg:w-3/5">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-8">Checkout</h1>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
              {globalError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                  {globalError}
                </div>
              )}
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">Contact Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full bg-white border ${errors.fullName ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all`}
                      placeholder="Ahmed Mohamed"
                      required
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
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
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">Shipping Address</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="governorate" className="block text-sm font-medium text-gray-700 mb-1">Governorate *</label>
                    <select
                      id="governorate"
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/20 outline-none transition-all appearance-none"
                      required
                    >
                      {governorates.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City / Area *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full bg-white border ${errors.city ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all`}
                      placeholder="Nasr City"
                      required
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="detailedAddress" className="block text-sm font-medium text-gray-700 mb-1">Detailed Address *</label>
                  <textarea
                    id="detailedAddress"
                    name="detailedAddress"
                    value={formData.detailedAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full bg-white border ${errors.detailedAddress ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#D4A853] focus:ring-[#D4A853]/20'} rounded-xl px-4 py-3 focus:ring-1 outline-none transition-all resize-none`}
                    placeholder="Street name, Building number, Apartment number..."
                    required
                  ></textarea>
                  {errors.detailedAddress && <p className="text-red-500 text-xs mt-1">{errors.detailedAddress}</p>}
                </div>
                
                <div>
                  <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                  <textarea
                    id="orderNotes"
                    name="orderNotes"
                    value={formData.orderNotes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#D4A853] focus:ring-1 focus:ring-[#D4A853]/20 outline-none transition-all resize-none"
                    placeholder="Any special requests or delivery instructions..."
                  ></textarea>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold text-[#1a1a2e] border-b border-gray-100 pb-2">Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: '💵' },
                    { id: 'Vodafone Cash', label: 'Vodafone Cash', icon: '📱' },
                    { id: 'InstaPay', label: 'InstaPay', icon: '🏦' }
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
                    You have selected <strong>{formData.paymentMethod}</strong>. Our team will contact you on WhatsApp to provide payment details after you place the order.
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-700">
                    Pay securely in cash when your order is delivered to your doorstep.
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
                    <><span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Processing...</>
                  ) : (
                    'Confirm Order'
                  )}
                </button>
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3 text-sm text-green-800">
                  <span className="text-xl">💬</span>
                  <p className="font-medium mt-0.5">You'll get a WhatsApp confirmation right after you order.</p>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                  <span className="text-green-600">🔒</span>
                  <span>Secure checkout. Pay safely.</span>
                </div>
              </div>
            </form>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:w-2/5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">Order Summary</h2>
              
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
                      <p className="text-sm font-medium text-[#D4A853]">
                        {(item.price * item.quantity).toLocaleString()} EGP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{totalPrice.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-center">
                  <span className="text-base font-bold text-[#1a1a2e]">Total</span>
                  <span className="text-xl font-bold text-[#D4A853]">
                    {totalPrice.toLocaleString()} EGP
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
              <h3 className="text-lg font-semibold text-[#1a1a2e] mb-4">Secure Shopping</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 100% Authentic Products
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Secure Checkout
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Pay safely via InstaPay or Vodafone Cash
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Cash on Delivery available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
