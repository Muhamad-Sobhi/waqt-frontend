'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';

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
  // Filter out inactive/unavailable products first
  const [products] = useState<Product[]>(
    initialProducts.filter(p => p.isActive !== false && p.isAvailable !== false)
  );
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const { addItem } = useCart();
  const router = useRouter();

  // SSR provides products instantly, no need for useEffect fetch

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (product.category || 'Watches') === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0; // newest could be handled if we had proper timestamps, for now just original order
    });

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a2e]">Shop Collection</h1>
            <p className="text-gray-500 mt-2">{filteredAndSortedProducts.length} products</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Category Filter Pills */}
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              {['All', 'Watches', 'Wallets'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                placeholder="Search watches..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4A853]"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4A853] bg-white text-[#1a1a2e]"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm skeleton h-[350px]"></div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No watches found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product, index) => (
              <div key={product.id} className="product-card bg-white rounded-xl p-4 shadow-sm flex flex-col group animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <Link href={`/products/${product.id}`} className="flex-grow">
                  <div className="relative aspect-square rounded-xl bg-gray-100 mb-4 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <>
                        <Image 
                          src={product.images[0]} 
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className={`object-cover transition-all duration-500 group-hover:scale-105 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
                        />
                        {product.images[1] && (
                          <Image 
                            src={product.images[1]} 
                            alt={`${product.name} alternate`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="absolute inset-0 object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1 mt-1">
                    <p className="text-xs uppercase tracking-wider text-gray-400">{product.brand}</p>
                    <div className="flex text-amber-400 text-xs">★★★★★</div>
                  </div>
                  <h3 className="font-semibold text-[#1a1a2e] mb-2 line-clamp-2">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 gap-2">
                  <span className="text-[#D4A853] font-bold text-sm sm:text-base">{product.price.toLocaleString('en-US')} EGP</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addItem({
                        productId: product.id,
                        name: product.name,
                        brand: product.brand,
                        price: product.price,
                        image: product.images?.[0] || '',
                      })}
                      disabled={product.stockQuantity === 0}
                      className="btn-primary px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                        router.push('/checkout');
                      }}
                      disabled={product.stockQuantity === 0}
                      className="bg-[#1a1a2e] text-white hover:bg-[#D4A853] transition-colors px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                    >
                      Buy Now ⚡
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
