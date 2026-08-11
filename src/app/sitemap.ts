import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://waqt-watches.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    // تقدر تضيف بقية صفحات الموقع هنا لو عندك صفحات تانية
  ]
}
