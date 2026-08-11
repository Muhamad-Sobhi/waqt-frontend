'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: string[];
  category?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  createdAt?: any;
}

export default function HomeClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState<Product[]>(initialProducts);
  const [loading] = useState(false);
  const [error] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addItem } = useCart();

  // Filter out inactive/unavailable products and sort by createdAt desc if available
  const activeProducts = products
    .filter(p => p.isActive !== false && p.isAvailable !== false)
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

  const displayProducts = activeProducts.filter(p => selectedCategory === 'All' || p.category === selectedCategory);

  // Products are fetched via SSR

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images?.[0] || '',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 1. Hero Section */}
      <section className="w-full bg-gradient-to-b from-[#f5f0e8] to-[#FAFAFA] pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold text-[#1a1a2e] tracking-tight">
              Timeless Elegance
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Discover our curated collection of premium watches and luxury wallets. Elevate your style with accessories that speak volumes.
            </p>
            <div className="pt-4 flex gap-4">
              <Link href="/products" className="btn-primary px-8 py-4 rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#2d2d44] text-white font-bold hover:shadow-[0_0_20px_rgba(26,26,46,0.3)] hover:-translate-y-1 transition-all">
                Shop Now
              </Link>
            </div>
            
            <div className="pt-8 flex flex-wrap gap-4 text-sm font-medium text-gray-700">
              <span className="flex items-center gap-1"><span className="text-[#D4A853]">✓</span> Free Shipping</span>
              <span className="flex items-center gap-1"><span className="text-[#D4A853]">✓</span> Cash on Delivery</span>
              <span className="flex items-center gap-1"><span className="text-[#D4A853]">✓</span> Authentic Products</span>
              <span className="flex items-center gap-1"><span className="text-[#D4A853]">✓</span> 24/7 Support</span>
            </div>
          </div>
          <div className="relative flex justify-center items-center h-full animate-scale-in hidden md:flex mt-10 md:mt-0">
            {loading ? (
              <div className="relative w-full max-w-md h-[400px]">
                <div className="absolute top-0 right-10 w-64 h-80 bg-gray-200 rounded-2xl animate-pulse transform rotate-3 shadow-xl"></div>
                <div className="absolute bottom-0 left-0 w-56 h-72 bg-gray-300 rounded-2xl animate-pulse transform -rotate-6 shadow-2xl"></div>
              </div>
            ) : activeProducts.length > 0 ? (
              (() => {
                const heroWatch = activeProducts.find(p => p.category === 'Watches' || p.name.toLowerCase().includes('watch') || p.name.includes('ساعة') || p.name.toLowerCase().includes('rolex')) || activeProducts[0];
                const heroWallet = activeProducts.find(p => p.category === 'Wallets' || p.name.toLowerCase().includes('wallet') || p.name.includes('محفظة') || p.brand?.toLowerCase().includes('premium')) || (activeProducts.length > 1 ? activeProducts[1] : activeProducts[0]);

                return (
                  <div className="relative w-full max-w-md h-[450px]">
                    {/* Background decorative blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#D4A853]/20 rounded-full blur-3xl"></div>
                    
                    {/* Main Featured Card (Watch) */}
                    {heroWatch && (
                      <Link href={`/products/${heroWatch.id}`} className="absolute top-4 right-4 md:right-8 w-64 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/50 z-10 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500 group">
                        <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-50 relative">
                          {heroWatch.images?.[0] ? (
                            <Image 
                              src={heroWatch.images[0]} 
                              alt={heroWatch.name} 
                              fill
                              priority
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">⌚</div>
                          )}
                          <div className="absolute top-2 right-2 bg-[#1a1a2e] text-white text-xs font-bold px-2 py-1 rounded-lg">Featured</div>
                        </div>
                        <h2 className="font-bold text-[#1a1a2e] truncate">{heroWatch.name}</h2>
                        <p className="text-[#D4A853] font-bold mt-1 text-lg">{heroWatch.price.toLocaleString('en-US')} EGP</p>
                      </Link>
                    )}

                    {/* Secondary Featured Card (Wallet) */}
                    {heroWallet && heroWallet.id !== heroWatch.id && (
                      <Link href={`/products/${heroWallet.id}`} className="absolute bottom-4 left-4 md:left-0 w-56 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/50 z-20 transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 group">
                        <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50 relative">
                          {heroWallet.images?.[0] ? (
                            <Image 
                              src={heroWallet.images[0]} 
                              alt={heroWallet.name} 
                              fill
                              priority
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">👛</div>
                          )}
                          <div className="absolute top-2 left-2 bg-[#D4A853] text-[#1a1a2e] text-xs font-bold px-2 py-1 rounded-lg">Trending</div>
                        </div>
                        <h2 className="font-bold text-[#1a1a2e] truncate text-sm">{heroWallet.name}</h2>
                        <p className="text-[#D4A853] font-bold mt-1 text-sm">{heroWallet.price.toLocaleString('en-US')} EGP</p>
                      </Link>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-[12rem] animate-bounce" style={{ animationDuration: '3s' }}>
                ⌚
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Products Section */}
      <section className="py-20 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1a1a2e] inline-block relative">
            New Arrivals
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#D4A853] rounded-full"></span>
          </h2>
        </div>

        <div className="flex justify-center mb-10">
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            {['All', 'Watches', 'Wallets'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-[#1a1a2e] text-[#D4A853]' 
                    : 'text-gray-500 hover:text-[#1a1a2e]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`skeleton bg-gray-200 animate-pulse h-80 rounded-2xl stagger-${(i % 4) + 1}`}></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayProducts.slice(0, 8).map((product, idx) => (
                <div key={product.id} className={`product-card animate-fade-in-up group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform stagger-${(idx % 8) + 1}`}>
                  <Link href={`/products/${product.id}`} className="block relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <Image 
                          src={product.images[0]} 
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className={`object-cover transition-all duration-500 group-hover:scale-105 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                        />
                        {product.images[1] && (
                          <Image 
                            src={product.images[1]} 
                            alt={`${product.name} alternate`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="absolute inset-0 object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                        ⌚
                      </div>
                    )}
                  </Link>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{product.brand}</p>
                      <div className="flex text-amber-400 text-xs">
                        ★★★★★
                      </div>
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-[#1a1a2e] hover:text-[#D4A853] transition-colors line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#D4A853] to-[#B8860B] text-lg drop-shadow-sm">
                      {product.price.toLocaleString('en-US')} EGP
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-[#1a1a2e] bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-center"
                        title="Add to Cart"
                        aria-label="Add to Cart"
                      >
                        🛒
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          handleAddToCart(product); 
                          window.location.href = '/checkout';
                        }}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1a1a2e] to-[#2d2d44] hover:from-[#D4A853] hover:to-[#B8860B] transition-all flex items-center justify-center"
                      >
                        Buy Now ⚡
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/products" className="inline-flex items-center font-semibold text-[#1a1a2e] hover:text-[#D4A853] transition-colors group">
                View All Products 
                <span className="ml-2 transform transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 3. Why Choose Us Section */}
      <section className="py-20 bg-white px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1a1a2e]">Why Choose Waqt</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
              <div className="w-16 h-16 mx-auto bg-[#FAFAFA] rounded-full flex items-center justify-center text-3xl mb-4">
                🔒
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Authentic & Guaranteed</h3>
              <p className="text-gray-600">Every watch is 100% authentic with original documentation and warranty.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
              <div className="w-16 h-16 mx-auto bg-[#FAFAFA] rounded-full flex items-center justify-center text-3xl mb-4">
                🚚
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Free, insured, and expedited shipping across Egypt to your doorstep.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
              <div className="w-16 h-16 mx-auto bg-[#FAFAFA] rounded-full flex items-center justify-center text-3xl mb-4">
                💳
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Cash on Delivery</h3>
              <p className="text-gray-600">Pay securely when you receive and inspect your order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Social Media */}
      <section className="py-20 px-6 lg:px-8 bg-white border-y border-gray-100 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-[#1a1a2e]">Join Our Community</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow us on social media for the latest collections, exclusive offers, and watch styling tips.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <a href="https://www.facebook.com/share/1DNkUbSCwp/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-[#1a1a2e] hover:bg-[#1877F2] hover:text-white transition-all hover:scale-110 shadow-sm border border-gray-100">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://www.tiktok.com/@waqt.watches2?_r=1&_t=ZS-987REM2Ij2L" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-[#1a1a2e] hover:bg-black hover:text-white transition-all hover:scale-110 shadow-sm border border-gray-100">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.18 1.85-5.18 2.68-7.98 2.06-2.82-.6-5.26-2.55-6.3-5.22-1.07-2.67-.73-5.74 1.03-7.99 1.73-2.18 4.46-3.41 7.23-3.32v4.06c-1.4.02-2.82.52-3.8 1.52-.98.98-1.52 2.4-1.39 3.8.12 1.39.87 2.67 2.03 3.42 1.15.74 2.62 1.03 3.98.63 1.35-.41 2.46-1.41 3-2.68.53-1.25.68-2.67.66-4.04-.03-5.59-.01-11.17-.01-16.76h.8z"/></svg>
            </a>
            <a href="https://www.instagram.com/waqtwatch2?igsh=ZDB1cXF4M3Q1NDVt" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-[#1a1a2e] hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all hover:scale-110 shadow-sm border border-gray-100">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* 5. CTA Banner */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4a] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Ready to find your perfect watch?
          </h2>
          <p className="text-xl text-gray-300">
            Explore our vast collection of luxury timepieces and elevate your everyday style.
          </p>
          <div className="pt-4">
            <Link href="/products" className="btn-gold inline-flex items-center justify-center px-10 py-4 rounded-xl text-[#1a1a2e] bg-gradient-to-r from-[#D4A853] to-[#E8C97A] font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-[#D4A853]/20">
              Browse Collection
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
