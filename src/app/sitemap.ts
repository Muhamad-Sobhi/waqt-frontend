import { MetadataRoute } from 'next'

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
  // TODO: get products from your database/API

  return []
}
