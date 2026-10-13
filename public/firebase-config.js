// ==========================================================================
// BLINJO E-COMMERCE - FIREBASE FIRESTORE REALTIME DATABASE INTEGRATION
// ==========================================================================

// Firebase Configuration Object (Replace with your actual Firebase Project keys if desired)
const firebaseConfig = {
  apiKey: "AIzaSyBlinjoRealDataFirestoreKey2026",
  authDomain: "blinjo-storefront.firebaseapp.com",
  projectId: "blinjo-storefront",
  storageBucket: "blinjo-storefront.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:blinjo123456789"
};

let db = null;
let isFirestoreConnected = false;

// Initialize Firebase App & Firestore Database
try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    
    // Enable offline persistence if supported by browser
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported by browser');
      }
    });

    isFirestoreConnected = true;
    console.log('🔥 Firebase Firestore successfully initialized & ready!');
  } else if (typeof firebase !== 'undefined' && firebase.apps.length) {
    db = firebase.firestore();
    isFirestoreConnected = true;
  }
} catch (error) {
  console.warn('⚠️ Firebase Firestore Initialization Warning:', error.message);
  isFirestoreConnected = false;
}

// Helper utility to check connection state
function checkFirestoreActive() {
  return isFirestoreConnected && db !== null;
}

// --------------------------------------------------------------------------
// 1. PRODUCTS COLLECTION API (Firestore / LocalStorage Hybrid)
// --------------------------------------------------------------------------
const defaultProductsList = [
  {
    id: 'PROD-001',
    title: 'Blinjo Premium Rose Urli Set with Diya',
    subtitle: 'Handcrafted pure brass decorative bowl with scented roses & floating diyas',
    price: 2999,
    mrp: 5999,
    stock: 20,
    status: 'Active',
    badge: '🔥 BESTSELLER',
    image: 'assets/bestseller.jpg',
    images: ['assets/bestseller.jpg', 'assets/cat_1.jpg', 'assets/cat_2.jpg'],
    active: true
  },
  {
    id: 'PROD-002',
    title: 'Royal Peacock Brass Floating Urli',
    subtitle: 'Artisan hand-engraved peacock design urli for living room & entrance elegance',
    price: 2499,
    mrp: 4999,
    stock: 15,
    status: 'Active',
    badge: '👑 TRENDING',
    image: 'assets/cat_1.jpg',
    images: ['assets/cat_1.jpg'],
    active: false
  },
  {
    id: 'PROD-003',
    title: 'Divine Pooja Room Lotus Diya Urli',
    subtitle: 'Sacred lotus leaf design brass diya bowl for mandir, aarti & daily spiritual rituals',
    price: 1999,
    mrp: 3999,
    stock: 25,
    status: 'Active',
    badge: '✨ DIVINE',
    image: 'assets/cat_2.jpg',
    images: ['assets/cat_2.jpg'],
    active: false
  },
  {
    id: 'PROD-004',
    title: 'Diwali Festive Glow Floating Diya Set',
    subtitle: 'Complete festival celebration set with 12 brass floating lamps and decorative flowers',
    price: 1699,
    mrp: 3499,
    stock: 30,
    status: 'Active',
    badge: '🪔 FESTIVE',
    image: 'assets/cat_3.jpg',
    images: ['assets/cat_3.jpg'],
    active: false
  }
];

function fallbackProducts(callback) {
  const saved = localStorage.getItem('blinjo_products_v3');
  let products = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
      }
    } catch(e) {}
  }
  if (!products || products.length === 0) {
    products = [...defaultProductsList];
    try {
      localStorage.setItem('blinjo_products_v3', JSON.stringify(products));
      const activeProd = products.find(p => p.active) || products[0];
      if (activeProd && !localStorage.getItem('blinjo_active_product')) {
        localStorage.setItem('blinjo_active_product', JSON.stringify(activeProd));
      }
    } catch(e) {}
  }
  if (callback) callback(products);
  return products;
}

async function seedInitialProducts(callback) {
  const localSaved = localStorage.getItem('blinjo_products_v3');
  let prods = [];
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed)) {
        prods = parsed.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
      }
    } catch(e) {}
  }

  if (prods.length > 0 && checkFirestoreActive()) {
    try {
      const batch = db.batch();
      prods.forEach((prod) => {
        const docRef = db.collection('products').doc(prod.id);
        batch.set(docRef, prod, { merge: true });
      });
      await batch.commit();
      console.log('🌱 Firestore seeded with local products:', prods.length);
    } catch(err) {
      console.warn('Could not seed local products to Firestore:', err);
    }
  }
  if (callback) callback(prods);
}

async function syncProducts(callback) {
  // 1. Provide immediate local products so UI loads without any latency
  fallbackProducts(callback);

  if (checkFirestoreActive()) {
    try {
      return db.collection('products').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const firestoreProducts = [];
          snapshot.forEach((doc) => {
            firestoreProducts.push({ id: doc.id, ...doc.data() });
          });

          const cleanedFs = firestoreProducts.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));

          // Merge with any local storage products so locally added items are never lost
          const localSaved = localStorage.getItem('blinjo_products_v3');
          let localProds = [];
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed)) {
                localProds = parsed.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
              }
            } catch(e) {}
          }

          const mergedMap = new Map();
          // Add local products first
          localProds.forEach(p => { if (p && p.id) mergedMap.set(p.id, p); });
          // Merge or supplement with firestore products
          cleanedFs.forEach(p => {
            if (p && p.id) {
              const existing = mergedMap.get(p.id) || {};
              mergedMap.set(p.id, { ...existing, ...p });
            }
          });

          const merged = Array.from(mergedMap.values());
          localStorage.setItem('blinjo_products_v3', JSON.stringify(merged));
          if (callback) callback(merged);
        } else {
          // Empty snapshot: preserve and seed from local storage if available
          seedInitialProducts(callback);
        }
      }, (err) => {
        console.warn('Firestore snapshot fallback to LocalStorage:', err);
        fallbackProducts(callback);
      });
    } catch (e) {
      fallbackProducts(callback);
    }
  } else {
    fallbackProducts(callback);
  }
}

async function addOrUpdateProductFirestore(productData) {
  const docId = productData.id || ('PROD-' + Date.now());
  const cleanProd = { ...productData, id: docId };

  if (checkFirestoreActive()) {
    try {
      await db.collection('products').doc(docId).set(cleanProd, { merge: true });
      console.log('✅ Product saved to Firestore:', docId);
    } catch (err) {
      console.warn('Firestore product save note:', err.message);
    }
  }

  // Sync to LocalStorage
  const saved = localStorage.getItem('blinjo_products_v3');
  let products = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) products = parsed;
    } catch(e) {}
  }

  const index = products.findIndex(p => p.id === docId);
  if (index !== -1) {
    products[index] = { ...products[index], ...cleanProd };
  } else {
    products.unshift(cleanProd);
  }

  // Filter out any legacy dummy records
  products = products.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
  localStorage.setItem('blinjo_products_v3', JSON.stringify(products));

  if (cleanProd.active) {
    localStorage.setItem('blinjo_active_product', JSON.stringify(cleanProd));
    localStorage.setItem('blinjo_offer_price', cleanProd.price);
    if (cleanProd.stock !== undefined) localStorage.setItem('blinjo_stock', cleanProd.stock);
  }

  // Broadcast to other tabs & storefront in real-time
  try {
    const prodBC = new BroadcastChannel('blinjo_products_channel');
    prodBC.postMessage({ type: 'PRODUCTS_UPDATED', prods: products });
    prodBC.close();
  } catch(e) {}
  window.dispatchEvent(new CustomEvent('blinjo_products_updated', { detail: products }));
}

async function deleteProductFirestore(productId) {
  if (checkFirestoreActive()) {
    try {
      await db.collection('products').doc(productId).delete();
      console.log('🗑️ Product deleted from Firestore:', productId);
    } catch (err) {
      console.warn('Firestore product delete note:', err.message);
    }
  }

  const saved = localStorage.getItem('blinjo_products_v3');
  if (saved) {
    try {
      let products = JSON.parse(saved);
      if (Array.isArray(products)) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('blinjo_products_v3', JSON.stringify(products));

        const activeStored = localStorage.getItem('blinjo_active_product');
        if (activeStored) {
          const ap = JSON.parse(activeStored);
          if (ap.id === productId) {
            if (products.length > 0) {
              products[0].active = true;
              localStorage.setItem('blinjo_active_product', JSON.stringify(products[0]));
            } else {
              localStorage.removeItem('blinjo_active_product');
            }
          }
        }

        try {
          const prodBC = new BroadcastChannel('blinjo_products_channel');
          prodBC.postMessage({ type: 'PRODUCTS_UPDATED', prods: products });
          prodBC.close();
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('blinjo_products_updated', { detail: products }));
      }
    } catch(e) {}
  }
}

// --------------------------------------------------------------------------
// 2. ORDERS COLLECTION API (Realtime Sync & Placement)
// --------------------------------------------------------------------------
const defaultOrdersList = [];

async function syncOrders(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('orders').orderBy('id', 'desc').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const orders = [];
          snapshot.forEach((doc) => {
            orders.push({ docId: doc.id, ...doc.data() });
          });
          localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
          if (callback) callback(orders);
        } else {
          seedInitialOrders(callback);
        }
      }, (err) => {
        console.warn('Firestore orders fallback:', err);
        fallbackOrders(callback);
      });
    } catch (e) {
      fallbackOrders(callback);
    }
  } else {
    fallbackOrders(callback);
  }
}

async function seedInitialOrders(callback) {
  if (!checkFirestoreActive()) return;
  const batch = db.batch();
  defaultOrdersList.forEach((order) => {
    const docRef = db.collection('orders').doc(order.id.replace('#', 'ORD-'));
    batch.set(docRef, order);
  });
  await batch.commit();
  console.log('🌱 Firestore seeded with initial orders!');
  if (callback) callback(defaultOrdersList);
}

function fallbackOrders(callback) {
  const saved = localStorage.getItem('blinjo_orders_v2');
  const orders = saved ? JSON.parse(saved) : defaultOrdersList;
  if (callback) callback(orders);
}

async function addOrderFirestore(newOrder) {
  if (checkFirestoreActive()) {
    try {
      const docId = newOrder.id.replace('#', 'ORD-');
      await db.collection('orders').doc(docId).set(newOrder);
      console.log('📦 New order saved to Firestore:', docId);
    } catch (err) {
      console.error('Error saving order to Firestore:', err);
    }
  }
  // LocalStorage update with deduplication
  const saved = localStorage.getItem('blinjo_orders_v2');
  let orders = saved ? JSON.parse(saved) : defaultOrdersList;
  const existingIdx = orders.findIndex(o => o.id === newOrder.id);
  if (existingIdx !== -1) {
    orders[existingIdx] = newOrder;
  } else {
    orders.unshift(newOrder);
  }
  localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
  localStorage.setItem('blinjo_orders', JSON.stringify(orders));
}

async function updateOrderStatusFirestore(orderId, newStatus) {
  if (checkFirestoreActive()) {
    try {
      const docId = orderId.replace('#', 'ORD-');
      await db.collection('orders').doc(docId).update({ status: newStatus });
      console.log('🔄 Order status updated in Firestore:', orderId, newStatus);
    } catch (err) {
      console.error('Error updating order status in Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_orders_v2');
  if (saved) {
    let orders = JSON.parse(saved);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = newStatus;
      localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
    }
  }
}

async function updateOrderFirestore(orderId, updatedFields) {
  if (checkFirestoreActive()) {
    try {
      const docId = orderId.replace('#', 'ORD-');
      await db.collection('orders').doc(docId).set(updatedFields, { merge: true });
      console.log('🔄 Order updated in Firestore:', orderId);
    } catch (err) {
      console.error('Error updating order in Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_orders_v2');
  if (saved) {
    let orders = JSON.parse(saved);
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updatedFields };
      localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
    }
  }
}

// --------------------------------------------------------------------------
// 3. REVIEWS COLLECTION API
// --------------------------------------------------------------------------
async function syncReviews(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('reviews').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const reviews = [];
          snapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem('blinjo_reviews_v1', JSON.stringify(reviews));
          if (callback) callback(reviews);
        } else {
          if (callback) fallbackReviews(callback);
        }
      });
    } catch (e) {
      fallbackReviews(callback);
    }
  } else {
    fallbackReviews(callback);
  }
}

function fallbackReviews(callback) {
  const saved = localStorage.getItem('blinjo_reviews_v1');
  const reviews = saved ? JSON.parse(saved) : [];
  if (callback) callback(reviews);
}

async function addReviewFirestore(reviewData) {
  if (checkFirestoreActive()) {
    try {
      await db.collection('reviews').add(reviewData);
      console.log('⭐ Review saved to Firestore!');
    } catch (err) {
      console.error('Error adding review to Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_reviews_v1');
  let reviews = saved ? JSON.parse(saved) : [];
  reviews.unshift(reviewData);
  localStorage.setItem('blinjo_reviews_v1', JSON.stringify(reviews));
}

// --------------------------------------------------------------------------
// 4. SLIDESHOW BANNERS COLLECTION API
// --------------------------------------------------------------------------
const defaultSlideshow = [];

async function syncSlideshow(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('slideshow').onSnapshot((snapshot) => {
        const slides = [];
        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data && data.image && !data.image.includes('hero_banner.jpg')) {
              slides.push({ id: doc.id, ...data });
            } else if (data && data.image && data.image.includes('hero_banner.jpg')) {
              try { db.collection('slideshow').doc(doc.id).delete(); } catch(de){}
            }
          });
        }
        localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
        if (callback) callback(slides);
      });
    } catch (e) {
      fallbackSlideshow(callback);
    }
  } else {
    fallbackSlideshow(callback);
  }
}

function fallbackSlideshow(callback) {
  const saved = localStorage.getItem('blinjo_slideshow_v2');
  let slides = saved ? JSON.parse(saved) : [];
  slides = slides.filter(s => s && s.image && !s.image.includes('hero_banner.jpg'));
  if (callback) callback(slides);
}

async function saveSlideFirestore(slideData) {
  if (slideData.image && slideData.image.includes('hero_banner.jpg')) return;
  if (checkFirestoreActive()) {
    try {
      const docId = slideData.id || 'SLD-' + Math.floor(100 + Math.random() * 900);
      await db.collection('slideshow').doc(docId).set({ ...slideData, id: docId }, { merge: true });
    } catch (err) {
      console.error('Error saving slide to Firestore:', err);
    }
  }
  try {
    const saved = localStorage.getItem('blinjo_slideshow_v2');
    let slides = saved ? JSON.parse(saved) : defaultSlideshow;
    slides = slides.filter(s => s && s.image && !s.image.includes('hero_banner.jpg'));
    const idx = slides.findIndex(s => s.id === slideData.id);
    if (idx !== -1) slides[idx] = { ...slides[idx], ...slideData };
    else slides.unshift(slideData);
    localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
  } catch (lsErr) {
    console.warn('LocalStorage slideshow save notice:', lsErr);
  }
}

async function deleteSlideFirestore(slideId) {
  if (checkFirestoreActive()) {
    try {
      await db.collection('slideshow').doc(slideId).delete();
      console.log('🗑️ Slide deleted from Firestore:', slideId);
    } catch (err) {
      console.error('Error deleting slide from Firestore:', err);
    }
  }
  try {
    const saved = localStorage.getItem('blinjo_slideshow_v2');
    if (saved) {
      const slides = JSON.parse(saved).filter(s => s.id !== slideId);
      localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
    }
  } catch (lsErr) {
    console.warn('LocalStorage slideshow delete notice:', lsErr);
  }
}

async function deleteOrderFirestore(orderId) {
  if (checkFirestoreActive()) {
    try {
      const docId = orderId.replace('#', 'ORD-');
      await db.collection('orders').doc(docId).delete();
      console.log('🗑️ Order deleted from Firestore:', orderId);
    } catch (err) {
      console.error('Error deleting order from Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_orders_v2');
  if (saved) {
    const orders = JSON.parse(saved).filter(o => o.id !== orderId);
    localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
  }
}

// --------------------------------------------------------------------------
// 5. OCCASION BANNERS COLLECTION API
// --------------------------------------------------------------------------
const defaultOccasionsList = [
  { id: 'OCC-1', title: 'Living Room Decor', image: 'assets/cat_1.jpg', active: true },
  { id: 'OCC-2', title: 'Pooja Room', image: 'assets/cat_2.jpg', active: true },
  { id: 'OCC-3', title: 'Diwali & Festivals', image: 'assets/cat_3.jpg', active: true },
  { id: 'OCC-4', title: 'Wedding Decoration', image: 'assets/cat_4.jpg', active: true },
  { id: 'OCC-5', title: 'Entrance Decor', image: 'assets/cat_5.jpg', active: true },
  { id: 'OCC-6', title: 'Perfect Gift', image: 'assets/cat_6.jpg', active: true }
];

async function syncOccasions(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('occasions').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const occasions = [];
          snapshot.forEach((doc) => {
            occasions.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem('blinjo_occasions_v1', JSON.stringify(occasions));
          if (callback) callback(occasions);
        } else {
          seedInitialOccasions(callback);
        }
      });
    } catch (e) {
      fallbackOccasions(callback);
    }
  } else {
    fallbackOccasions(callback);
  }
}

async function seedInitialOccasions(callback) {
  if (!checkFirestoreActive()) return;
  const batch = db.batch();
  defaultOccasionsList.forEach((occ) => {
    const docRef = db.collection('occasions').doc(occ.id);
    batch.set(docRef, occ);
  });
  await batch.commit();
  if (callback) callback(defaultOccasionsList);
}

function fallbackOccasions(callback) {
  const saved = localStorage.getItem('blinjo_occasions_v1');
  const occasions = saved ? JSON.parse(saved) : defaultOccasionsList;
  if (callback) callback(occasions);
}

async function saveOccasionFirestore(occData) {
  if (checkFirestoreActive()) {
    try {
      await db.collection('occasions').doc(occData.id).set(occData, { merge: true });
    } catch (err) {
      console.error('Error saving occasion to Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_occasions_v1');
  let occasions = saved ? JSON.parse(saved) : defaultOccasionsList;
  const idx = occasions.findIndex(o => o.id === occData.id);
  if (idx !== -1) occasions[idx] = { ...occasions[idx], ...occData };
  localStorage.setItem('blinjo_occasions_v1', JSON.stringify(occasions));
}
