import { MetadataRoute } from 'next'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const BASE_URL = 'https://waqt-watches.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all products from your API/database
  const products = await getProducts()

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.id}`,
    lastModified: product.updatedAt
      ? new Date(product.updatedAt)
      : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },

    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },

    ...productUrls,
  ]
}

async function getProducts() {
  try {
    const q = query(collection(db, 'products'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      }
    })
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
    return []
  }
}
