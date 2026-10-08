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
const defaultProductsList = [];

async function syncProducts(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('products').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const products = [];
          snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem('blinjo_products_v3', JSON.stringify(products));
          if (callback) callback(products);
        } else {
          // Seed default products to Firestore if empty
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

async function seedInitialProducts(callback) {
  if (!checkFirestoreActive()) return;
  const batch = db.batch();
  defaultProductsList.forEach((prod) => {
    const docRef = db.collection('products').doc(prod.id);
    batch.set(docRef, prod);
  });
  await batch.commit();
  console.log('🌱 Firestore seeded with initial real products!');
  if (callback) callback(defaultProductsList);
}

function fallbackProducts(callback) {
  const saved = localStorage.getItem('blinjo_products_v3');
  const products = saved ? JSON.parse(saved) : defaultProductsList;
  if (callback) callback(products);
}

async function addOrUpdateProductFirestore(productData) {
  if (checkFirestoreActive()) {
    try {
      const docId = productData.id || 'BLJ' + Math.floor(100 + Math.random() * 900);
      await db.collection('products').doc(docId).set({ ...productData, id: docId }, { merge: true });
      console.log('✅ Product saved to Firestore:', docId);
    } catch (err) {
      console.error('Error saving product to Firestore:', err);
    }
  }
  // Also sync LocalStorage
  const saved = localStorage.getItem('blinjo_products_v3');
  let products = saved ? JSON.parse(saved) : defaultProductsList;
  const index = products.findIndex(p => p.id === productData.id);
  if (index !== -1) {
    products[index] = { ...products[index], ...productData };
  } else {
    products.unshift(productData);
  }
  localStorage.setItem('blinjo_products_v3', JSON.stringify(products));
}

async function deleteProductFirestore(productId) {
  if (checkFirestoreActive()) {
    try {
      await db.collection('products').doc(productId).delete();
      console.log('🗑️ Product deleted from Firestore:', productId);
    } catch (err) {
      console.error('Error deleting product from Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_products_v3');
  if (saved) {
    const products = JSON.parse(saved).filter(p => p.id !== productId);
    localStorage.setItem('blinjo_products_v3', JSON.stringify(products));
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
const defaultSlideshow = [
  { id: 'SLD-001', mediaType: 'image', image: 'assets/hero_banner.jpg', active: true },
  { id: 'SLD-002', mediaType: 'image', image: 'assets/cat_3.jpg', active: true },
  { id: 'SLD-003', mediaType: 'image', image: 'assets/bestseller.jpg', active: true }
];

async function syncSlideshow(callback) {
  if (checkFirestoreActive()) {
    try {
      return db.collection('slideshow').onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const slides = [];
          snapshot.forEach((doc) => {
            slides.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
          if (callback) callback(slides);
        } else {
          seedInitialSlides(callback);
        }
      });
    } catch (e) {
      fallbackSlideshow(callback);
    }
  } else {
    fallbackSlideshow(callback);
  }
}

async function seedInitialSlides(callback) {
  if (!checkFirestoreActive()) return;
  const batch = db.batch();
  defaultSlideshow.forEach((slide) => {
    const docRef = db.collection('slideshow').doc(slide.id);
    batch.set(docRef, slide);
  });
  await batch.commit();
  if (callback) callback(defaultSlideshow);
}

function fallbackSlideshow(callback) {
  const saved = localStorage.getItem('blinjo_slideshow_v2');
  const slides = saved ? JSON.parse(saved) : defaultSlideshow;
  if (callback) callback(slides);
}

async function saveSlideFirestore(slideData) {
  if (checkFirestoreActive()) {
    try {
      const docId = slideData.id || 'SLD-' + Math.floor(100 + Math.random() * 900);
      await db.collection('slideshow').doc(docId).set({ ...slideData, id: docId }, { merge: true });
    } catch (err) {
      console.error('Error saving slide to Firestore:', err);
    }
  }
  const saved = localStorage.getItem('blinjo_slideshow_v2');
  let slides = saved ? JSON.parse(saved) : defaultSlideshow;
  const idx = slides.findIndex(s => s.id === slideData.id);
  if (idx !== -1) slides[idx] = { ...slides[idx], ...slideData };
  else slides.unshift(slideData);
  localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
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
  const saved = localStorage.getItem('blinjo_slideshow_v2');
  if (saved) {
    const slides = JSON.parse(saved).filter(s => s.id !== slideId);
    localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
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
