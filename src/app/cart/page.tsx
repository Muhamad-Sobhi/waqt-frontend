'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#FAFAFA] text-center">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-amber-100">
          <span className="text-4xl">🛍️</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2" dir="rtl">سلة المشتريات فارغة</h1>
        <p className="text-gray-500 mb-8 max-w-md leading-relaxed text-sm sm:text-base" dir="rtl">
          لم تقم بإضافة أي منتجات إلى السلة بعد، أو تم إكمال طلبك الأخير بنجاح.
        </p>
        <Link href="/products" className="btn-gold px-8 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all">
          تصفح المنتجات ➔
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1a1a2e] mb-8">Shopping Cart ({totalItems})</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-4">
            {items.map((item, index) => (
              <div 
                key={item.productId} 
                className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="object-cover w-full h-full" 
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-watch.svg';
                      }}
                    />
                  ) : (
                    <img src="/placeholder-watch.svg" alt="Placeholder" className="object-cover w-full h-full" />
                  )}
                </div>
                
                <div className="flex-grow text-center sm:text-left flex flex-col justify-between h-full w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">{item.brand}</p>
                      <h3 className="text-lg font-semibold text-[#1a1a2e] line-clamp-1">{item.name}</h3>
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hidden sm:block"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-[#D4A853] transition-colors font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-[#D4A853] transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      <p className="font-bold text-[#D4A853]">
                        {(item.price * item.quantity).toLocaleString()} EGP
                      </p>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-red-400 hover:text-red-600 sm:hidden"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24 animate-fade-in-up stagger-3">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>{totalPrice.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-semibold text-[#1a1a2e]">Total</span>
                  <span className="text-2xl font-bold text-[#D4A853]">
                    {totalPrice.toLocaleString()} EGP
                  </span>
                </div>
              </div>
              
              <Link 
                href="/checkout" 
                className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg hover:shadow-lg transition-shadow"
              >
                Proceed to Checkout
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/products" className="text-sm text-gray-500 hover:text-[#D4A853] transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
