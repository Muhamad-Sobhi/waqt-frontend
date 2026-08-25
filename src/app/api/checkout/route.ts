import { NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { customer, items, orderNotes, paymentMethod, sessionId } = data;

    if (!customer || !customer.phone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
    }

    // 1. Fetch products to get true prices and details
    const productIds = items.map((i: any) => i.productId);
    const productsRef = adminDb.collection('products');
    
    // Firestore 'in' query supports up to 30 items
    const productsSnap = await productsRef.where(admin.firestore.FieldPath.documentId(), 'in', productIds).get();
    
    if (productsSnap.empty) {
      return NextResponse.json({ success: false, error: 'Products not found' }, { status: 404 });
    }

    const productsMap = new Map();
    productsSnap.forEach(doc => {
      productsMap.set(doc.id, doc.data());
    });

    // 2. Fetch Active Offer
    let activeOffer: any = null;
    const offersSnap = await adminDb.collection('offers').where('isActive', '==', true).get();
    const now = new Date();
    
    for (const doc of offersSnap.docs) {
      const offerData = doc.data();
      // Admin SDK Timestamp
      const endDate = offerData.endDate?.toDate();
      if (endDate && endDate > now) {
        activeOffer = { id: doc.id, ...offerData };
        break;
      }
    }

    // 3. Process items and calculate total securely
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const product = productsMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      let originalPrice = product.price || 0;
      let finalPrice = originalPrice;

      // Apply Offer logic
      if (activeOffer && 
         (activeOffer.applyTo === 'all' || 
         (activeOffer.applyTo === 'specific_products' && activeOffer.targetIds?.includes(item.productId)))) {
         
        if (activeOffer.type === 'percentage') {
          finalPrice = originalPrice - (originalPrice * (activeOffer.value / 100));
        } else if (activeOffer.type === 'fixed') {
          finalPrice = Math.max(0, originalPrice - activeOffer.value);
        }
      }

      finalPrice = Math.round(finalPrice);
      subtotal += finalPrice * item.quantity;

      return {
        productId: item.productId,
        productName: product.name || 'Unknown',
        brand: product.brand || '',
        quantity: item.quantity,
        unitPrice: finalPrice,
        originalPrice: originalPrice,
        imageUrl: product.images && product.images.length > 0 ? product.images[0] : (product.image || ''),
      };
    });

    const totalAmount = subtotal; // delivery is 0 for now
    const totalItemsInOrder = processedItems.reduce((acc, item) => acc + item.quantity, 0);

    // 4. Perform Batched Writes
    const batch = adminDb.batch();

    // Customer Profile
    const customerRef = adminDb.collection('customers').doc(customer.phone);
    batch.set(customerRef, {
      fullName: customer.fullName,
      phoneNumber: customer.phone,
      defaultAddress: {
        governorate: customer.governorate,
        city: customer.city,
        detailedAddress: customer.detailedAddress
      },
      totalOrdersCount: admin.firestore.FieldValue.increment(1),
      totalItemsBought: admin.firestore.FieldValue.increment(totalItemsInOrder),
      totalSpend: admin.firestore.FieldValue.increment(totalAmount),
      lastPurchaseDate: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Order Document
    const orderRef = adminDb.collection('orders').doc();
    batch.set(orderRef, {
      customerPhone: customer.phone,
      customerName: customer.fullName,
      deliveryAddress: {
        governorate: customer.governorate,
        city: customer.city,
        detailedAddress: customer.detailedAddress
      },
      orderNotes: orderNotes || '',
      paymentMethod: paymentMethod || 'Cash on Delivery',
      items: processedItems,
      subtotal: subtotal,
      deliveryFee: 0,
      totalPrice: totalAmount,
      status: 'pending',
      whatsappStatus: { sent: false },
      trackingSessionId: sessionId || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Session Update
    if (sessionId) {
      const sessionRef = adminDb.collection('sessions').doc(sessionId);
      batch.set(sessionRef, {
        linkedPhoneNumber: customer.phone,
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Admin Notification
    const notificationRef = adminDb.collection('notifications').doc();
    batch.set(notificationRef, {
      type: 'new_order',
      title: 'New Order Received',
      message: `Order from ${customer.fullName} for ${totalAmount.toLocaleString()} EGP`,
      orderId: orderRef.id,
      customerPhone: customer.phone,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Execute atomic batch
    await batch.commit();

    // 5. Send Telegram Notification
    try {
      const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8982600341:AAEjV2xovN-3Ik1b_EDCPORrAw5IhwuH22g';
      const CHAT_IDS_ENV = process.env.TELEGRAM_CHAT_ID || '6358489476';
      const chatIds = CHAT_IDS_ENV.split(',').map(id => id.trim()).filter(id => id);
      
      let tgMessage = `🆕 <b>New Order Received!</b>\n\n`;
      tgMessage += `👤 <b>Customer:</b> ${customer.fullName}\n`;
      tgMessage += `📞 <b>Phone:</b> ${customer.phone}\n`;
      tgMessage += `📍 <b>Address:</b> ${customer.detailedAddress}, ${customer.city}, ${customer.governorate}\n`;
      if (orderNotes) {
        tgMessage += `📝 <b>Notes:</b> ${orderNotes}\n`;
      }
      tgMessage += `\n🛒 <b>Items:</b>\n`;
      processedItems.forEach((item: any) => {
        tgMessage += `- ${item.productName} (x${item.quantity})\n`;
      });
      tgMessage += `\n💰 <b>Total:</b> ${totalAmount} EGP\n`;
      tgMessage += `💳 <b>Payment:</b> ${paymentMethod}\n`;
      tgMessage += `🧾 <b>Order ID:</b> ${orderRef.id}\n`;

      await Promise.all(chatIds.map(async (chatId) => {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: tgMessage,
            parse_mode: 'HTML',
          }),
        });
        
        if (!tgRes.ok) {
          const errText = await tgRes.text();
          console.error(`Telegram API error for chat ${chatId}:`, tgRes.status, errText);
        }
      }));
    } catch (notifyError) {
      console.error('Failed to send telegram notification:', notifyError);
    }

    return NextResponse.json({ success: true, orderId: orderRef.id });
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
