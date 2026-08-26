'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useCart } from '@/components/CartProvider';
import { trackProductVisit } from '@/components/SessionTracker';
import { useActiveOffer } from '@/components/OfferProvider';
import { calculateDiscountedPrice } from '@/lib/pricing';

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  category?: string;
  specifications?: any;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: '50%', y: '50%' });
  const [isHovering, setIsHovering] = useState(false);
  const { addItem, setCheckoutModalOpen } = useCart();
  const { offer } = useActiveOffer();
  const router = useRouter();

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [formError, setFormError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Related Products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().isActive !== false) {
          const prodData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(prodData);
          
          // Fetch related products (same category)
          if (prodData.category) {
            const relatedQ = query(collection(db, 'products'), where('category', '==', prodData.category));
            const relSnap = await getDocs(relatedQ);
            const rel = relSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.isActive !== false && p.id !== prodData.id)
              .slice(0, 4);
            setRelatedProducts(rel);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'), 
          where('productId', '==', id)
        );
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((r: any) => r.isApproved === true && r.isArchived !== true)
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchProduct();
    if (id) {
      fetchReviews();
      if (typeof window !== 'undefined') {
        if (localStorage.getItem(`reviewed_${id}`)) {
          setHasReviewed(true);
        }
        const savedInfo = localStorage.getItem('userInfo');
        if (savedInfo) {
          try {
            const parsed = JSON.parse(savedInfo);
            if (parsed.fullName) {
              setReviewForm(prev => ({ ...prev, name: parsed.fullName }));
            }
          } catch (e) {}
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      trackProductVisit(id);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/2 aspect-square skeleton rounded-2xl"></div>
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="h-6 w-32 skeleton rounded"></div>
            <div className="h-10 w-3/4 skeleton rounded"></div>
            <div className="h-8 w-1/4 skeleton rounded"></div>
            <div className="h-32 w-full skeleton rounded"></div>
            <div className="h-12 w-full skeleton rounded-xl mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">المنتج غير موجود</h2>
          <p className="text-gray-500 mb-8">الساعة التي تبحث عنها غير موجودة أو غير متاحة حالياً.</p>
          <Link href="/products" className="btn-primary px-6 py-3 rounded-xl inline-block">
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images?.[0] || '',
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (hasReviewed) return;
    
    if (!reviewForm.name.trim() || reviewForm.name.trim().length < 2) {
      setFormError('الاسم يجب ان يتكون من حرفين على الاقل'); // Name must be at least 2 chars
      return;
    }
    
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 10) {
      setFormError('التعليق يجب ان يتكون من ١٠ حروف على الاقل'); // Comment must be at least 10 chars
      return;
    }
    
    setSubmittingReview(true);
    try {
      const newReview = {
        productId: product.id,
        productName: product.name,
        authorName: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        isApproved: false,
        isArchived: false,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      
      // Create notification
      await addDoc(collection(db, 'notifications'), {
        type: 'new_review',
        title: 'New Review Submitted',
        message: `${reviewForm.name} rated ${product.name} ${reviewForm.rating} stars.`,
        productId: product.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      
      // Update local state for immediate feedback
      setReviews([{ id: docRef.id, ...newReview, createdAt: { seconds: Date.now() / 1000 } }, ...reviews]);
      setReviewForm({ name: '', rating: 5, comment: '' });
      setHasReviewed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`reviewed_${product.id}`, 'true');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 animate-fade-in">
          {/* Left Column - Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div 
              className="aspect-square bg-white rounded-2xl shadow-sm overflow-hidden relative cursor-zoom-in group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - left) / width) * 100;
                const y = ((e.clientY - top) / height) * 100;
                setMousePosition({ x: `${x}%`, y: `${y}%` });
              }}
            >
              {product.images && product.images[selectedImage] ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transformOrigin: `${mousePosition.x} ${mousePosition.y}`,
                    transform: isHovering ? 'scale(1.5)' : 'scale(1)'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">لا توجد صورة متاحة</div>
              )}
              {(() => {
                const p = calculateDiscountedPrice(product.price, product.id, offer);
                if (p.hasDiscount && p.discountBadge) {
                  return (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-sm sm:text-base font-black px-3 py-1.5 rounded-lg shadow-md z-10 animate-pulse">
                      {p.discountBadge}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 snap-start transition-all ${
                      selectedImage === idx 
                        ? 'border-2 border-[#D4A853] shadow-md ring-2 ring-[#D4A853]/20' 
                        : 'border border-gray-200 hover:border-[#D4A853]/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <nav className="text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-[#D4A853]">الرئيسية</Link>
              <span className="mx-2">&gt;</span>
              <Link href="/products" className="hover:text-[#D4A853]">المتجر</Link>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-900">{product.name}</span>
            </nav>

            <p className="uppercase text-sm text-gray-400 tracking-wider font-semibold mb-2">{product.brand}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">{product.name}</h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-[#D4A853]">
                {reviews.length > 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? '' : 'text-gray-300'}>★</span>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-gray-300">★</span>
                  ))
                )}
              </div>
              <span className="text-gray-600 text-sm font-medium">
                {reviews.length > 0 
                  ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} `
                  : '0.0 '}
                <span className="text-gray-400 font-normal ml-1">({reviews.length} تقييمات)</span>
              </span>
              <button onClick={() => {
                const el = document.getElementById('reviews');
                if(el) el.scrollIntoView({ behavior: 'smooth' });
              }} className="text-[#D4A853] text-sm font-medium hover:underline mx-2">
                قراءة التقييمات
              </button>
            </div>

            {(() => {
              const p = calculateDiscountedPrice(product.price, product.id, offer);
              return (
                <div className="mb-6 flex flex-col items-start">
                  {p.hasDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 line-through text-lg">{p.originalPrice.toLocaleString('en-US')} جنيه</span>
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded border border-red-200">
                        وفر {p.originalPrice - p.finalPrice} جنيه
                      </span>
                    </div>
                  )}
                  <p className="text-4xl font-black text-[#D4A853]">{p.finalPrice.toLocaleString('en-US')} جنيه</p>
                </div>
              );
            })()}
            
            <div className="prose text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>

            {/* Specifications */}
            {product.specifications && Object.values(product.specifications).some(val => val && String(val).trim() !== '') && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg text-[#1a1a2e] mb-4">المواصفات</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {Object.entries(product.specifications)
                    .filter(([_, value]) => value && String(value).trim() !== '')
                    .map(([key, value]) => {
                      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className="flex justify-between border-b border-gray-100 py-2">
                          <span className="text-gray-500 font-medium">{formattedKey}</span>
                          <span className="text-gray-900 text-right font-medium">{String(value)}</span>
                        </div>
                      );
                  })}
                </div>
              </div>
            )}

            <div className="mb-6">
              {product.stockQuantity > 0 ? (
                <span className="text-green-600 font-medium">متوفر بالمخزون</span>
              ) : (
                <span className="text-red-500 font-medium">نفدت الكمية</span>
              )}
            </div>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  disabled={product.stockQuantity === 0}
                >
                  -
                </button>
                <div className="px-4 py-2 font-medium text-[#1a1a2e] min-w-[3rem] text-center">{quantity}</div>
                <button 
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  disabled={product.stockQuantity === 0}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 fixed sm:relative bottom-0 left-0 right-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-gray-200 sm:border-0 z-40 sm:z-auto shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:shadow-none mb-0 sm:mb-8">
              <button 
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="bg-[#1a1a2e] text-white flex-1 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-md transition-all hover:bg-[#D4A853] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stockQuantity > 0 ? 'أضف للسلة 🛒' : 'نفدت الكمية'}
              </button>

              <button 
                onClick={() => {
                  handleAddToCart();
                  setCheckoutModalOpen(true);
                }}
                disabled={product.stockQuantity === 0}
                className="btn-gold flex-1 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stockQuantity > 0 ? 'اشتري الآن ⚡' : 'نفدت الكمية'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-gray-200 pt-8 mt-auto pb-20 sm:pb-0">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                  <span className="text-blue-600 text-base sm:text-lg">✓</span>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600">أصلية 100%</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                  <span className="text-green-600 text-base sm:text-lg">✓</span>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600">شحن سريع</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                  <span className="text-purple-600 text-base sm:text-lg">✓</span>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600">الدفع عند الاستلام</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mt-20 border-t border-gray-200 pt-16 scroll-mt-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-10 text-center">تقييمات العملاء</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Write a review form */}
              <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h3 className="text-xl font-semibold mb-6">اكتب تقييماً</h3>
                {hasReviewed ? (
                  <div className="text-center py-8 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-3xl mb-2 block">🎉</span>
                    <p className="text-green-800 font-medium">شكراً لتقييمك!</p>
                    <p className="text-sm text-green-600 mt-1">تم إرسال تقييمك وهو قيد المراجعة.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {formError && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {formError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                      <input 
                        type="text" 
                        required
                        value={reviewForm.name}
                        onChange={e => setReviewForm({...reviewForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A853] focus:border-transparent outline-none transition-all"
                        placeholder="محمد أحمد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">التقييم</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewForm({...reviewForm, rating: star})}
                            className={`text-2xl ${star <= reviewForm.rating ? 'text-amber-500' : 'text-gray-300'} hover:scale-110 transition-transform`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">التعليق</label>
                      <textarea 
                        required
                        rows={4}
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A853] focus:border-transparent outline-none transition-all resize-none"
                        placeholder="ما رأيك في هذا المنتج؟"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={submittingReview}
                      className="w-full bg-[#1a1a2e] text-white py-3 rounded-lg font-medium hover:bg-[#D4A853] transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
                    </button>
                  </form>
                )}
              </div>

              {/* Reviews List */}
              <div className="md:col-span-2 space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-[#1a1a2e]">{review.authorName}</h4>
                        <span className="text-sm text-gray-400">
                          {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'الآن'}
                        </span>
                      </div>
                      <div className="flex text-amber-500 mb-3 text-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? '' : 'text-gray-200'}>★</span>
                        ))}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    <p className="text-gray-500">لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-200 pt-16">
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-8 text-center">قد يعجبك أيضاً</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rel => (
                <Link key={rel.id} href={`/products/${rel.id}`} className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                    {rel.images?.[0] ? (
                      <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">لا توجد صورة</div>
                    )}
                    {(() => {
                      const p = calculateDiscountedPrice(rel.price, rel.id, offer);
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
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">{rel.brand}</p>
                  <h3 className="font-semibold text-[#1a1a2e] line-clamp-1 mb-2">{rel.name}</h3>
                  {(() => {
                    const p = calculateDiscountedPrice(rel.price, rel.id, offer);
                    return (
                      <div className="flex flex-col">
                        {p.hasDiscount && (
                          <span className="text-gray-400 line-through text-xs">{p.originalPrice.toLocaleString()} جنيه</span>
                        )}
                        <p className="text-[#D4A853] font-bold">{p.finalPrice.toLocaleString()} جنيه</p>
                      </div>
                    );
                  })()}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
