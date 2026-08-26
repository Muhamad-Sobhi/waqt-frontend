'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useActiveOffer } from '@/components/OfferProvider';
import { calculateDiscountedPrice } from '@/lib/pricing';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stockQuantity: number;
  category?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  images: string[];
}

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(
    initialProducts.filter(p => p.isActive !== false && p.isAvailable !== false)
  );
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedBrand, setSelectedBrand] = useState('الكل');
  const [sortBy, setSortBy] = useState('newest');
  const { addItem, setCheckoutModalOpen } = useCart();
  const { offer } = useActiveOffer();
  const router = useRouter();

  useEffect(() => {
    if (initialProducts.length === 0) {
      const fetchProducts = async () => {
        try {
          const q = query(collection(db, 'products'));
          const snapshot = await getDocs(q);
          const fetchedProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          setProducts(fetchedProducts.filter(p => p.isActive !== false && p.isAvailable !== false));
        } catch (error) {
          console.error("Error fetching products on client:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [initialProducts]);

  // Extract unique brands and categories for filter
  const uniqueBrands = ['الكل', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean) as string[]))];
  const uniqueCategories = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || (product.category || 'ساعات') === selectedCategory;
      const matchesBrand = selectedBrand === 'الكل' || product.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    })
    .sort((a, b) => {
      const priceA = calculateDiscountedPrice(a.price, a.id, offer).finalPrice;
      const priceB = calculateDiscountedPrice(b.price, b.id, offer).finalPrice;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      return 0; // newest could be handled if we had proper timestamps, for now just original order
    });

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a2e]">تشكيلة المتجر</h1>
            <p className="text-gray-500 mt-2">{filteredAndSortedProducts.length} منتجات</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Category Filter Pills */}
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto hide-scrollbar max-w-full">
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 sm:px-6 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-[#1a1a2e] text-[#D4A853]' 
                      : 'text-gray-500 hover:text-[#1a1a2e]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="ابحث عن الساعات..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="py-2 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4A853] bg-white text-[#1a1a2e] w-full sm:w-auto"
            >
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b === 'الكل' ? 'جميع الماركات' : b}</option>
              ))}
            </select>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4A853] bg-white text-[#1a1a2e] w-full sm:w-auto"
            >
              <option value="newest">الأحدث</option>
              <option value="price-low">السعر: من الأقل للأعلى</option>
              <option value="price-high">السعر: من الأعلى للأقل</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm skeleton h-[250px] sm:h-[350px]"></div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">لم يتم العثور على ساعات تطابق بحثك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredAndSortedProducts.map((product, index) => (
              <div key={product.id} className="product-card bg-white rounded-xl p-3 sm:p-4 shadow-sm flex flex-col group animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <Link href={`/products/${product.id}`} className="flex-grow flex flex-col">
                  <div className="relative aspect-square rounded-xl bg-gray-100 mb-3 sm:mb-4 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <>
                        <Image 
                          src={product.images[0]} 
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className={`object-cover transition-all duration-500 group-hover:scale-105 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                        />
                        {product.images[1] && (
                          <Image 
                            src={product.images[1]} 
                            alt={`${product.name} alternate`}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="absolute inset-0 object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">لا توجد صورة</div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md">
                        نفدت الكمية
                      </div>
                    )}
                    {(() => {
                      const p = calculateDiscountedPrice(product.price, product.id, offer);
                      if (p.hasDiscount && p.discountBadge) {
                        return (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-lg shadow-sm z-10">
                            {p.discountBadge}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex justify-between items-start mb-1 mt-1">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400">{product.brand}</p>
                    <div className="flex text-amber-400 text-[10px] sm:text-xs">★★★★★</div>
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#1a1a2e] mb-1 sm:mb-2 line-clamp-2 leading-tight">{product.name}</h3>
                </Link>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto pt-2 sm:pt-4 border-t border-gray-100 gap-2">
                  <div className="flex flex-col">
                    {(() => {
                      const p = calculateDiscountedPrice(product.price, product.id, offer);
                      return (
                        <>
                          {p.hasDiscount && (
                            <span className="text-gray-400 line-through text-xs">{p.originalPrice.toLocaleString()} EGP</span>
                          )}
                          <span className="text-[#D4A853] font-bold text-sm sm:text-base">{p.finalPrice.toLocaleString()} EGP</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => addItem({
                        productId: product.id,
                        name: product.name,
                        brand: product.brand,
                        price: product.price,
                        image: product.images?.[0] || '',
                      })}
                      disabled={product.stockQuantity === 0}
                      className="p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-xl font-bold text-[#1a1a2e] bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add to Cart"
                    >
                      🛒
                    </button>
                    <button 
                      onClick={() => {
                        addItem({
                          productId: product.id,
                          name: product.name,
                          brand: product.brand,
                          price: product.price,
                          image: product.images?.[0] || '',
                        });
                        setCheckoutModalOpen(true);
                      }}
                      disabled={product.stockQuantity === 0}
                      className="flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-xl font-bold text-white bg-[#1a1a2e] hover:bg-[#D4A853] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      شراء ⚡
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
