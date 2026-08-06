import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ShopClient from './ShopClient';

export const revalidate = 60; // Cache for 60 seconds

export default async function ShopPage() {
  try {
    const q = query(collection(db, 'products'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        brand: data.brand,
        price: data.price,
        images: data.images,
        category: data.category,
        stockQuantity: data.stockQuantity,
        isActive: data.isActive,
        description: data.description
      };
    }) as any[];
    
    return <ShopClient initialProducts={products} />;
  } catch (error: any) {
    console.error('Error fetching products for SSR:', error);
    return <div>Error: {error.message}</div>;
  }
}
