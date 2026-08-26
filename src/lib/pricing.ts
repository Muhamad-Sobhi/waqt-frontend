export interface ActiveOffer {
  id: string;
  title: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  applyTo: 'all' | 'specific_products';
  targetIds: string[];
  endDate: { seconds: number; nanoseconds: number };
}

export function calculateDiscountedPrice(originalPrice: number, productId: string, offer: ActiveOffer | null): { originalPrice: number; finalPrice: number; hasDiscount: boolean; discountBadge?: string } {
  if (!offer) {
    return { originalPrice, finalPrice: originalPrice, hasDiscount: false };
  }

  // Check if offer has expired
  const now = new Date();
  const endDate = new Date(offer.endDate.seconds * 1000);
  if (now > endDate) {
    return { originalPrice, finalPrice: originalPrice, hasDiscount: false };
  }

  // Check if offer applies to this product
  if (offer.applyTo === 'specific_products' && !offer.targetIds.includes(productId)) {
    return { originalPrice, finalPrice: originalPrice, hasDiscount: false };
  }

  // Apply discount
  let finalPrice = originalPrice;
  if (offer.type === 'percentage') {
    finalPrice = originalPrice - (originalPrice * (offer.value / 100));
  } else if (offer.type === 'fixed') {
    finalPrice = Math.max(0, originalPrice - offer.value);
  }

  // If free_shipping, product price doesn't change, but it's handled at checkout.
  // We still might want to show a badge, but for price calculation it's the same.
  const hasDiscount = finalPrice < originalPrice || (offer.type === 'free_shipping' && (offer.applyTo === 'all' || offer.targetIds.includes(productId)));

  let discountBadge = '';
  if (offer.type === 'percentage') {
    discountBadge = `-${offer.value}%`;
  } else if (offer.type === 'fixed') {
    discountBadge = `-${offer.value} EGP`;
  } else if (offer.type === 'free_shipping') {
    discountBadge = 'شحن سريع';
  }

  return {
    originalPrice,
    finalPrice: Math.round(finalPrice), // Round to nearest integer or desired decimal
    hasDiscount,
    discountBadge
  };
}
