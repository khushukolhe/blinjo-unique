document.addEventListener('DOMContentLoaded', () => {

  // One-time data reset for manual entry
  if (!localStorage.getItem('blinjo_data_cleaned_v2')) {
    localStorage.removeItem('blinjo_products_v3');
    localStorage.removeItem('blinjo_orders_v2');
    localStorage.removeItem('blinjo_orders');
    localStorage.removeItem('blinjo_reviews_v1');
    localStorage.removeItem('blinjo_slideshow_v2');
    localStorage.removeItem('blinjo_occasions_v1');
    localStorage.removeItem('blinjo_active_product');
    localStorage.setItem('blinjo_data_cleaned_v2', 'true');
  }

  // Purge any legacy dummy hero banner image from slideshow storage
  try {
    const rawSlides = localStorage.getItem('blinjo_slideshow_v2');
    if (rawSlides) {
      const parsedSlides = JSON.parse(rawSlides);
      const filteredSlides = parsedSlides.filter(s => s && s.image && !s.image.includes('hero_banner.jpg'));
      if (filteredSlides.length !== parsedSlides.length) {
        localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(filteredSlides));
      }
    }
  } catch(e) {}

  // 1. Dynamic Gallery Carousel & Hero Image Slideshow
  const mainHeroImg = document.getElementById('mainHeroImg');
  const videoModal = document.getElementById('videoModal');
  const closeVideoModal = document.getElementById('closeVideoModal');
  const videoPlayer = document.getElementById('videoPlayer');
  const heroPrevBtn = document.getElementById('heroPrevBtn');
  const heroNextBtn = document.getElementById('heroNextBtn');
  const carouselTrack = document.querySelector('.carousel-track');

  // Store default authentic product slides
  const defaultSlidesList = [
    {
      id: 'SLD-001',
      image: 'assets/bestseller.jpg',
      title: 'Handcrafted Brass Urli Bowl with Floating Diya',
      subtitle: 'Infuse divine warmth & royal elegance into your festive home decor',
      active: true,
      mediaType: 'image'
    },
    {
      id: 'SLD-002',
      image: 'assets/cat_1.jpg',
      title: 'Exquisite Living Room Centerpiece',
      subtitle: 'Artisanal decorative bowl with scented roses & radiant glow',
      active: true,
      mediaType: 'image'
    },
    {
      id: 'SLD-003',
      image: 'assets/cat_2.jpg',
      title: 'Divine Pooja Room Lotus Urli',
      subtitle: 'Pure brass blessing for mandir, aarti & daily spiritual celebrations',
      active: true,
      mediaType: 'image'
    },
    {
      id: 'SLD-004',
      image: 'assets/cat_3.jpg',
      title: 'Festive Diwali Diya & Floral Glow',
      subtitle: 'Captivating handcrafted festive decor for joyful celebrations',
      active: true,
      mediaType: 'image'
    }
  ];

  let activeSlidesList = [];
  let currentSlideIndex = 0;
  let slideshowTimer = null;

  function renderHeroDots() {
    const dotsContainer = document.getElementById('heroDotsContainer');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    if (activeSlidesList.length <= 1) {
      dotsContainer.style.display = 'none';
      return;
    }
    dotsContainer.style.display = 'flex';
    activeSlidesList.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot ${idx === currentSlideIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        goToHeroSlide(idx);
        resetSlideshowTimer();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateHeroDots(index) {
    const dotsContainer = document.getElementById('heroDotsContainer');
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.hero-dot');
    dots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  function renderStorefrontSlideshow(passedSlides = null) {
    const heroSection = document.getElementById('home');
    let slides = passedSlides;
    if (!slides || !Array.isArray(slides)) {
      const saved = localStorage.getItem('blinjo_slideshow_v2');
      if (saved) {
        try {
          slides = JSON.parse(saved);
        } catch(e) {}
      }
    }

    // Clean out legacy dummy hero_banner.jpg
    let cleanedSlides = (slides || []).filter(s => s && s.image && !s.image.includes('hero_banner.jpg'));

    // Fall back to defaultSlidesList if empty
    if (!cleanedSlides || cleanedSlides.length === 0) {
      cleanedSlides = [...defaultSlidesList];
      try {
        localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(cleanedSlides));
      } catch(e) {}
    }

    // ONLY show active slides configured in admin panel
    activeSlidesList = cleanedSlides.filter(s => s.active !== false && s.image);
    if (!activeSlidesList.length) {
      activeSlidesList = [...cleanedSlides];
    }

    if (heroSection) heroSection.style.display = 'flex';

    renderHeroDots();

    if (currentSlideIndex >= activeSlidesList.length) currentSlideIndex = 0;
    updateHeroDisplay(currentSlideIndex, false);

    if (activeSlidesList.length > 1) {
      if (heroPrevBtn) heroPrevBtn.style.display = 'flex';
      if (heroNextBtn) heroNextBtn.style.display = 'flex';
      startSlideshowTimer();
    } else {
      if (heroPrevBtn) heroPrevBtn.style.display = 'none';
      if (heroNextBtn) heroNextBtn.style.display = 'none';
      stopSlideshowTimer();
    }
  }

  function goToHeroSlide(index) {
    if (activeSlidesList.length === 0) return;
    currentSlideIndex = (index + activeSlidesList.length) % activeSlidesList.length;
    updateHeroDisplay(currentSlideIndex, true);
  }

  function updateHeroDisplay(index, transition = true) {
    if (!activeSlidesList.length) return;
    const slide = activeSlidesList[index];
    if (!slide || !mainHeroImg) return;

    const heroBlurBackdrop = document.getElementById('heroBlurBackdrop');
    const heroSlideCaption = document.getElementById('heroSlideCaption');
    const heroSlideTitle = document.getElementById('heroSlideTitle');
    const heroSlideDesc = document.getElementById('heroSlideDesc');

    const updateMediaAndCaption = () => {
      mainHeroImg.src = slide.image;
      mainHeroImg.style.opacity = '1';
      if (heroBlurBackdrop) {
        heroBlurBackdrop.style.backgroundImage = `url('${slide.image}')`;
        heroBlurBackdrop.style.opacity = '1';
      }
      if (heroSlideCaption && heroSlideTitle && heroSlideDesc) {
        if (slide.title || slide.subtitle) {
          heroSlideTitle.textContent = slide.title || '';
          heroSlideDesc.textContent = slide.subtitle || '';
          heroSlideCaption.style.display = 'block';
        } else {
          heroSlideCaption.style.display = 'none';
        }
      }
    };

    if (transition) {
      mainHeroImg.style.opacity = '0.35';
      if (heroBlurBackdrop) heroBlurBackdrop.style.opacity = '0.6';
      setTimeout(updateMediaAndCaption, 160);
    } else {
      updateMediaAndCaption();
    }

    updateHeroDots(index);
  }

  function startSlideshowTimer() {
    stopSlideshowTimer();
    if (activeSlidesList.length > 1) {
      slideshowTimer = setInterval(() => {
        goToHeroSlide(currentSlideIndex + 1);
      }, 4500);
    }
  }

  function stopSlideshowTimer() {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
      slideshowTimer = null;
    }
  }

  function resetSlideshowTimer() {
    startSlideshowTimer();
  }

  if (heroPrevBtn) {
    heroPrevBtn.addEventListener('click', () => {
      goToHeroSlide(currentSlideIndex - 1);
      resetSlideshowTimer();
    });
  }

  if (heroNextBtn) {
    heroNextBtn.addEventListener('click', () => {
      goToHeroSlide(currentSlideIndex + 1);
      resetSlideshowTimer();
    });
  }

  // Mobile Touch Swipe Navigation for Storefront Slideshow
  const homeHeroEl = document.getElementById('home');
  if (homeHeroEl) {
    let touchStartX = 0;
    let touchEndX = 0;
    homeHeroEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    homeHeroEl.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        goToHeroSlide(currentSlideIndex + 1);
        resetSlideshowTimer();
      } else if (touchEndX - touchStartX > 50) {
        goToHeroSlide(currentSlideIndex - 1);
        resetSlideshowTimer();
      }
    }, { passive: true });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'blinjo_slideshow_v2') {
      renderStorefrontSlideshow();
    }
  });

  window.addEventListener('blinjo_slideshow_updated', (e) => {
    renderStorefrontSlideshow(e.detail);
  });

  try {
    const sbc = new BroadcastChannel('blinjo_slideshow_channel');
    sbc.onmessage = (event) => {
      if (event.data && event.data.type === 'SLIDESHOW_UPDATED') {
        renderStorefrontSlideshow(event.data.slides);
      }
    };
  } catch(e) {}

  if (typeof syncSlideshow === 'function') {
    syncSlideshow((slides) => renderStorefrontSlideshow(slides));
  } else {
    renderStorefrontSlideshow();
  }

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add('active');
    if (videoPlayer) {
      const videoSrc = videoPlayer.src;
      if (!videoSrc.includes('autoplay=1')) {
        videoPlayer.src = videoSrc + (videoSrc.includes('?') ? '&' : '?') + 'autoplay=1';
      }
    }
  }

  if (closeVideoModal) {
    closeVideoModal.addEventListener('click', () => {
      if (videoModal) videoModal.classList.remove('active');
      if (videoPlayer) videoPlayer.src = videoPlayer.src.replace('&autoplay=1', '').replace('?autoplay=1', '');
    });
  }

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        videoModal.classList.remove('active');
        if (videoPlayer) videoPlayer.src = videoPlayer.src.replace('&autoplay=1', '').replace('?autoplay=1', '');
      }
    });
  }



  // 2. Lightbox Modal for Category Cards
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeLightboxModal = document.getElementById('closeLightboxModal');

  window.openLightbox = function(imgSrc, title) {
    lightboxImg.src = imgSrc;
    lightboxCaption.textContent = title;
    lightboxModal.classList.add('active');
  };

  closeLightboxModal.addEventListener('click', () => {
    lightboxModal.classList.remove('active');
  });

  // 2b. Sync "Perfect for Every Occasion" Grid with Admin LocalStorage
  function renderStorefrontOccasions(passedOccasions = null) {
    const gridContainer = document.querySelector('.usecase-grid');
    if (!gridContainer) return;

    const defaultOccasions = [
      { id: 'OCC-1', title: 'Living Room Decor', image: 'assets/cat_1.jpg', active: true },
      { id: 'OCC-2', title: 'Pooja Room', image: 'assets/cat_2.jpg', active: true },
      { id: 'OCC-3', title: 'Diwali & Festivals', image: 'assets/cat_3.jpg', active: true },
      { id: 'OCC-4', title: 'Wedding Decoration', image: 'assets/cat_4.jpg', active: true },
      { id: 'OCC-5', title: 'Entrance Decor', image: 'assets/cat_5.jpg', active: true },
      { id: 'OCC-6', title: 'Perfect Gift', image: 'assets/cat_6.jpg', active: true }
    ];

    let occasions = passedOccasions;
    if (!occasions) {
      const saved = localStorage.getItem('blinjo_occasions_v1');
      occasions = saved ? JSON.parse(saved) : defaultOccasions;
    }

    gridContainer.innerHTML = '';
    occasions.forEach(occ => {
      const card = document.createElement('div');
      card.className = 'usecase-card';
      card.setAttribute('onclick', `openLightbox('${occ.image}', '${occ.title.replace(/'/g, "\\'")}')`);
      card.innerHTML = `
        <img src="${occ.image}" alt="${occ.title}">
        <div class="pill-label">${occ.title}</div>
      `;
      gridContainer.appendChild(card);
    });
  }

  if (typeof syncOccasions === 'function') {
    syncOccasions((occs) => renderStorefrontOccasions(occs));
  } else {
    renderStorefrontOccasions();
  }


  // 3. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(fi => fi.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });


  // 4. Quantity Selector & Price Calculations & Live Product Sync
  let currentQty = 1;
  let basePrice = 2999;

  function loadActiveProduct() {
    const offerSection = document.querySelector('.offer-section');
    const storedProdsStr = localStorage.getItem('blinjo_products_v3');
    let storedProds = storedProdsStr ? JSON.parse(storedProdsStr) : [];

    const activeProdData = localStorage.getItem('blinjo_active_product');
    let activeProd = null;
    if (activeProdData) {
      try {
        const parsed = JSON.parse(activeProdData);
        if (parsed && parsed.title) {
          activeProd = parsed;
        }
      } catch(e) {}
    }

    if (!activeProd && storedProds.length > 0) {
      activeProd = storedProds.find(p => p.active) || storedProds[0];
    }

    if (offerSection) {
      offerSection.style.display = 'block';
    }

    if (!activeProd) return;

    localStorage.setItem('blinjo_active_product', JSON.stringify(activeProd));

    basePrice = activeProd.price || 2999;
    const mrp = activeProd.mrp || Math.round(basePrice * 1.5);
    const stock = activeProd.stock !== undefined ? activeProd.stock : 14;
    const savings = Math.max(0, mrp - basePrice);
    const discountPct = mrp > basePrice ? Math.round((savings / mrp) * 100) : 40;

    const titleEl = document.querySelector('.product-title-main');
    const subEl = document.querySelector('.product-subtitle-main');
    const curPriceEl = document.querySelector('.current-price');
    const origPriceEl = document.querySelector('.original-price');
    const discEl = document.querySelector('.discount-badge');
    const saveEl = document.querySelector('.save-amount');
    const stockEl = document.getElementById('stockCount');
    const imgEl = document.getElementById('offerProductImg');
    const ribbonEl = document.querySelector('.offer-badge-ribbon');

    if (titleEl) titleEl.textContent = activeProd.title;
    if (subEl) subEl.textContent = activeProd.subtitle || 'Handcrafted premium festive decor';
    if (curPriceEl) curPriceEl.textContent = `₹${basePrice.toLocaleString('en-IN')}`;
    if (origPriceEl) origPriceEl.textContent = `₹${mrp.toLocaleString('en-IN')}`;
    if (discEl) discEl.textContent = `${discountPct}% OFF`;
    if (saveEl) saveEl.textContent = `₹${savings.toLocaleString('en-IN')}`;
    if (stockEl) stockEl.textContent = stock;
    if (imgEl && activeProd.image) imgEl.src = activeProd.image;
    if (ribbonEl) ribbonEl.textContent = activeProd.badge || '🔥 NEW LAUNCH';

    // Update mobile bar price
    const mPriceEl = document.querySelector('.m-price');
    const mStrikeEl = document.querySelector('.m-strike');
    if (mPriceEl) mPriceEl.textContent = `₹${basePrice.toLocaleString('en-IN')}`;
    if (mStrikeEl) mStrikeEl.textContent = `₹${mrp.toLocaleString('en-IN')}`;

    // Update drawer item elements
    const cartProdTitle = document.getElementById('cartProdTitle');
    const cartProdSubtitle = document.getElementById('cartProdSubtitle');
    const cartSellingPrice = document.getElementById('cartSellingPrice');
    const cartMrpPrice = document.getElementById('cartMrpPrice');
    const cartDiscBadge = document.getElementById('cartDiscBadge');
    const cartProductImg = document.getElementById('cartProductImg');

    if (cartProdTitle) cartProdTitle.textContent = activeProd.title;
    if (cartProdSubtitle) cartProdSubtitle.textContent = activeProd.subtitle || 'Festive Decor';
    if (cartSellingPrice) cartSellingPrice.textContent = `₹${basePrice.toLocaleString('en-IN')}`;
    if (cartMrpPrice) cartMrpPrice.textContent = `₹${mrp.toLocaleString('en-IN')}`;
    if (cartDiscBadge) cartDiscBadge.textContent = `${discountPct}% OFF`;
    if (cartProductImg && activeProd.image) cartProductImg.src = activeProd.image;

    updateQuantity(currentQty);
  }

  loadActiveProduct();



  // 4b. Render Products Catalog Grid dynamically from LocalStorage & Firestore (Sync with Admin)
  const defaultStoreProducts = [];

  function renderCustomerProductsGrid(passedProducts = null) {
    const grid = document.getElementById('customerProductsGrid');
    const catalogSection = document.querySelector('.products-catalog-section');
    if (!grid) return;

    let prods = passedProducts;
    if (!prods || !Array.isArray(prods) || prods.length === 0) {
      const stored = localStorage.getItem('blinjo_products_v3');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            prods = parsed;
          }
        } catch(e) {}
      }
    }

    // Clean legacy dummy items (BLJ001-BLJ008)
    if (Array.isArray(prods)) {
      prods = prods.filter(p => p && p.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
    } else {
      prods = [];
    }

    // Fallback to defaultProductsList or active product if prods is still empty
    if (!prods || prods.length === 0) {
      if (typeof defaultProductsList !== 'undefined' && Array.isArray(defaultProductsList) && defaultProductsList.length > 0) {
        prods = [...defaultProductsList];
      }
    }

    if (!prods || prods.length === 0) {
      const activeStored = localStorage.getItem('blinjo_active_product');
      if (activeStored) {
        try {
          const ap = JSON.parse(activeStored);
          if (ap && ap.title && !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(ap.id)) {
            prods = [ap];
          }
        } catch(e) {}
      }
    }

    grid.innerHTML = '';

    // Always keep section visible so users see the collection area
    if (catalogSection) {
      catalogSection.style.display = 'block';
    }

    if (!prods || prods.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 8px;">🪔</div>
          <h4 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">New Collection Arriving Soon</h4>
          <p style="margin: 0; font-size: 14px; color: #64748b;">All handcrafted festive products added from the admin panel will appear here.</p>
        </div>
      `;
      return;
    }

    prods.forEach(p => {
      const card = document.createElement('div');
      card.className = 'store-product-card';
      card.style.cssText = `
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        display: flex;
        flex-direction: column;
        cursor: pointer;
      `;

      const numPrice = Number(p.price) || 0;
      const numMrp = Number(p.mrp) || Math.round(numPrice * 1.5) || numPrice;
      const discountPct = (numMrp > numPrice && numMrp > 0) ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
      const isOutOfStock = p.stock <= 0 || p.status === 'Out of Stock';
      const imgSrc = p.image || (Array.isArray(p.images) && p.images[0]) || 'assets/bestseller.jpg';
      let badgeText = p.badge || (p.status === 'Active' ? '🔥 BESTSELLER' : 'NEW');
      if (isOutOfStock) badgeText = 'OUT OF STOCK';

      card.innerHTML = `
        <div style="position:relative; width:100%; height:220px; background:#f8fafc; overflow:hidden;">
          <img src="${imgSrc}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease;" onerror="this.onerror=null; this.src='assets/bestseller.jpg';">
          <span style="position:absolute; top:12px; left:12px; background:${isOutOfStock ? '#64748b' : '#047857'}; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">${badgeText}</span>
          ${discountPct > 0 ? `<span style="position:absolute; top:12px; right:12px; background:#ef4444; color:#fff; font-size:11px; font-weight:800; padding:4px 8px; border-radius:8px;">${discountPct}% OFF</span>` : ''}
        </div>
        
        <div style="padding:16px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h4 style="margin:0 0 6px 0; font-size:16px; font-weight:800; color:#0f172a; line-height:1.3;">${p.title}</h4>
            <p style="margin:0 0 12px 0; font-size:12.5px; color:#64748b; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.subtitle || 'Authentic handcrafted festive decor item'}</p>
          </div>

          <div>
            <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:14px;">
              <strong style="font-size:20px; font-weight:800; color:#047857;">₹${numPrice.toLocaleString('en-IN')}</strong>
              ${numMrp > numPrice ? `<span style="text-decoration:line-through; color:#94a3b8; font-size:13px;">₹${numMrp.toLocaleString('en-IN')}</span>` : ''}
            </div>

            <button type="button" class="select-prod-btn" ${isOutOfStock ? 'disabled' : ''} style="width:100%; background:${isOutOfStock ? '#94a3b8' : '#047857'}; color:#ffffff; border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:800; cursor:${isOutOfStock ? 'not-allowed' : 'pointer'}; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:${isOutOfStock ? 'none' : '0 3px 10px rgba(4,120,87,0.25)'}; transition:all 0.2s;">
              <span>${isOutOfStock ? 'Out of Stock' : 'Buy Now'}</span> ${isOutOfStock ? '' : '➔'}
            </button>
          </div>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
        const cardImg = card.querySelector('img');
        if (cardImg) cardImg.style.transform = 'scale(1.04)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
        const cardImg = card.querySelector('img');
        if (cardImg) cardImg.style.transform = 'scale(1)';
      });

      card.addEventListener('click', (e) => {
        if (isOutOfStock) return;

        prods.forEach(item => item.active = (item.id === p.id));
        localStorage.setItem('blinjo_products_v3', JSON.stringify(prods));
        localStorage.setItem('blinjo_active_product', JSON.stringify(p));
        loadActiveProduct();

        if (e.target.closest('.select-prod-btn')) {
          openAddedToCartModal(p.title);
        } else {
          const offerSection = document.querySelector('.festive-offer-section') || document.querySelector('.hero-section') || document.getElementById('purchase');
          if (offerSection) {
            offerSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });

      grid.appendChild(card);
    });
  }

  // Real-time listener for Admin added/updated products
  window.addEventListener('storage', (e) => {
    if (e.key === 'blinjo_products_v3' || e.key === 'blinjo_active_product') {
      renderCustomerProductsGrid();
      loadActiveProduct();
    }
  });

  window.addEventListener('blinjo_products_updated', (e) => {
    renderCustomerProductsGrid(e.detail);
    loadActiveProduct();
  });

  try {
    const prodBC = new BroadcastChannel('blinjo_products_channel');
    prodBC.onmessage = (event) => {
      if (event.data && event.data.type === 'PRODUCTS_UPDATED') {
        renderCustomerProductsGrid(event.data.prods);
        loadActiveProduct();
      }
    };
  } catch(e) {}

  if (typeof syncProducts === 'function') {
    syncProducts((products) => {
      renderCustomerProductsGrid(products);
      loadActiveProduct();
    });
  } else {
    renderCustomerProductsGrid();
  }
  const qtyInput = document.getElementById('qtyInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const drawerSubtotal = document.getElementById('drawerSubtotal');
  const drawerTotal = document.getElementById('drawerTotal');
  const cartQtyVal = document.getElementById('cartQtyVal');
  const cartCount = document.getElementById('cartCount');

  const drawerQtyMinus = document.getElementById('drawerQtyMinus');
  const drawerQtyPlus = document.getElementById('drawerQtyPlus');
  const payOptPrepaidCard = document.getElementById('payOptPrepaidCard');
  const payOptCodCard = document.getElementById('payOptCodCard');
  const payChoicePrepaid = document.getElementById('payChoicePrepaid');
  const payChoiceCod = document.getElementById('payChoiceCod');
  const payMethodSelect = document.getElementById('payMethodSelect');
  const prepaidSaveBanner = document.getElementById('prepaidSaveBanner');
  const delChargeVal = document.getElementById('delChargeVal');
  const clearCartItemBtn = document.getElementById('clearCartItemBtn');

  let currentSelectedPayment = 'prepaid';

  function updatePaymentOption(method) {
    currentSelectedPayment = method;
    const isPrepaid = method === 'prepaid';
    if (payChoicePrepaid) payChoicePrepaid.checked = isPrepaid;
    if (payChoiceCod) payChoiceCod.checked = !isPrepaid;

    if (payOptPrepaidCard) {
      payOptPrepaidCard.style.border = isPrepaid ? '2px solid #10b981' : '1.5px solid #cbd5e1';
      payOptPrepaidCard.style.background = isPrepaid ? '#f0fdf4' : '#ffffff';
    }
    if (payOptCodCard) {
      payOptCodCard.style.border = !isPrepaid ? '2px solid #10b981' : '1.5px solid #cbd5e1';
      payOptCodCard.style.background = !isPrepaid ? '#f0fdf4' : '#ffffff';
    }

    if (prepaidSaveBanner) prepaidSaveBanner.style.display = isPrepaid ? 'flex' : 'none';
    if (delChargeVal) delChargeVal.textContent = isPrepaid ? '₹40' : '₹80';
    if (payMethodSelect) payMethodSelect.value = method;

    const saveAddressBtnText = document.getElementById('saveAddressBtnText');
    if (saveAddressBtnText) {
      saveAddressBtnText.textContent = isPrepaid ? 'Continue to Payment' : 'Place Order';
    }

    updateQuantity(currentQty);
  }

  if (payOptPrepaidCard) {
    payOptPrepaidCard.addEventListener('click', () => updatePaymentOption('prepaid'));
  }
  if (payOptCodCard) {
    payOptCodCard.addEventListener('click', () => updatePaymentOption('cod'));
  }
  if (payChoicePrepaid) {
    payChoicePrepaid.addEventListener('change', () => updatePaymentOption('prepaid'));
  }
  if (payChoiceCod) {
    payChoiceCod.addEventListener('change', () => updatePaymentOption('cod'));
  }

  function updateQuantity(newQty) {
    if (newQty < 1) newQty = 1;
    if (newQty > 10) newQty = 10;
    currentQty = newQty;

    if (qtyInput) qtyInput.value = currentQty;
    if (cartQtyVal) cartQtyVal.textContent = currentQty;
    if (cartCount) cartCount.textContent = currentQty;

    const summaryItemCount = document.getElementById('summaryItemCount');
    if (summaryItemCount) summaryItemCount.textContent = `${currentQty} ${currentQty === 1 ? 'item' : 'items'}`;

    const cartQtyHeader = document.getElementById('cartQtyHeader');
    if (cartQtyHeader) cartQtyHeader.textContent = `(${currentQty} ${currentQty === 1 ? 'Item' : 'Items'})`;

    const subtotal = currentQty * basePrice;
    const formattedSubtotal = `₹${subtotal.toLocaleString('en-IN')}`;
    
    if (drawerSubtotal) drawerSubtotal.textContent = formattedSubtotal;

    const isPrepaid = currentSelectedPayment === 'prepaid';
    const deliveryCharge = isPrepaid ? 40 : 80;
    const discount = isPrepaid ? 40 : 0;
    const netTotal = subtotal + deliveryCharge - discount;

    if (drawerTotal) drawerTotal.textContent = `₹${netTotal.toLocaleString('en-IN')}`;

    const cartItemPriceEl = document.getElementById('cartItemPrice');
    if (cartItemPriceEl) {
      cartItemPriceEl.textContent = `₹${basePrice.toLocaleString('en-IN')}`;
    }
  }

  if (qtyMinus) qtyMinus.addEventListener('click', () => updateQuantity(currentQty - 1));
  if (qtyPlus) qtyPlus.addEventListener('click', () => updateQuantity(currentQty + 1));

  if (drawerQtyMinus) drawerQtyMinus.addEventListener('click', () => updateQuantity(currentQty - 1));
  if (drawerQtyPlus) drawerQtyPlus.addEventListener('click', () => updateQuantity(currentQty + 1));

  if (clearCartItemBtn) {
    clearCartItemBtn.addEventListener('click', () => {
      updateQuantity(1);
      showToast('🛒 Item quantity reset to 1');
    });
  }


  // 5. Cart Drawer & Instant Buy Now Button Actions
  const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const instantBuyBtn = document.getElementById('instantBuyBtn');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const mobileBuyBtn = document.getElementById('mobileBuyBtn');

  // Multi-Step Checkout Navigation (Cart -> Address -> Payment -> Success)
  const checkoutStepCart = document.getElementById('checkoutStepCart');
  const checkoutStepAddress = document.getElementById('checkoutStepAddress');
  const checkoutStepPayment = document.getElementById('checkoutStepPayment');
  const checkoutStepSuccess = document.getElementById('checkoutStepSuccess');
  const backToCartBtn = document.getElementById('backToCartBtn');

  const stepIndicatorCart = document.getElementById('stepIndicatorCart');
  const stepIndicatorAddress = document.getElementById('stepIndicatorAddress');
  const stepIndicatorPayment = document.getElementById('stepIndicatorPayment');
  const stepIndicatorConfirm = document.getElementById('stepIndicatorConfirm');

  let currentActiveStep = 'cart';

  function setStepVisual(stepElem, circleBg, circleColor, labelColor, labelWeight) {
    if (!stepElem) return;
    const circle = stepElem.querySelector('.step-icon-circle');
    const label = stepElem.querySelector('.step-label');
    if (circle) {
      circle.style.background = circleBg;
      circle.style.color = circleColor;
    }
    if (label) {
      label.style.color = labelColor;
      label.style.fontWeight = labelWeight;
    }
  }

  function switchCheckoutStep(step) {
    currentActiveStep = step;
    if (checkoutStepCart) checkoutStepCart.style.display = 'none';
    if (checkoutStepAddress) checkoutStepAddress.style.display = 'none';
    if (checkoutStepPayment) checkoutStepPayment.style.display = 'none';
    if (checkoutStepSuccess) checkoutStepSuccess.style.display = 'none';

    if (backToCartBtn) {
      backToCartBtn.style.display = (step === 'cart' || step === 'success') ? 'none' : 'inline-block';
    }

    if (step === 'cart') {
      if (checkoutStepCart) checkoutStepCart.style.display = 'block';
      setStepVisual(stepIndicatorCart, '#047857', '#ffffff', '#047857', '700');
      setStepVisual(stepIndicatorAddress, '#f1f5f9', '#64748b', '#94a3b8', '500');
      setStepVisual(stepIndicatorPayment, '#f1f5f9', '#64748b', '#94a3b8', '500');
      setStepVisual(stepIndicatorConfirm, '#f1f5f9', '#64748b', '#94a3b8', '500');

    } else if (step === 'address') {
      if (checkoutStepAddress) checkoutStepAddress.style.display = 'block';
      setStepVisual(stepIndicatorCart, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorAddress, '#047857', '#ffffff', '#047857', '700');
      setStepVisual(stepIndicatorPayment, '#f1f5f9', '#64748b', '#94a3b8', '500');
      setStepVisual(stepIndicatorConfirm, '#f1f5f9', '#64748b', '#94a3b8', '500');

      setTimeout(() => {
        const nameInput = document.getElementById('custNameInput');
        if (nameInput) nameInput.focus();
      }, 150);

    } else if (step === 'payment') {
      if (checkoutStepPayment) checkoutStepPayment.style.display = 'block';
      setStepVisual(stepIndicatorCart, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorAddress, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorPayment, '#047857', '#ffffff', '#047857', '700');
      setStepVisual(stepIndicatorConfirm, '#f1f5f9', '#64748b', '#94a3b8', '500');

      const upiPayAmountVal = document.getElementById('upiPayAmountVal');
      const razorpayPayAmountVal = document.getElementById('razorpayPayAmountVal');
      const isPrepaid = currentSelectedPayment === 'prepaid';
      const deliveryCharge = isPrepaid ? 40 : 80;
      const discount = isPrepaid ? 40 : 0;
      const netTotal = (currentQty * basePrice) + deliveryCharge - discount;
      if (upiPayAmountVal) upiPayAmountVal.textContent = `₹${netTotal.toLocaleString('en-IN')}`;
      if (razorpayPayAmountVal) razorpayPayAmountVal.textContent = `₹${netTotal.toLocaleString('en-IN')}`;

    } else if (step === 'success') {
      if (checkoutStepSuccess) checkoutStepSuccess.style.display = 'block';
      setStepVisual(stepIndicatorCart, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorAddress, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorPayment, '#e6f4ea', '#047857', '#64748b', '500');
      setStepVisual(stepIndicatorConfirm, '#047857', '#ffffff', '#047857', '700');
    }
  }

  if (backToCartBtn) {
    backToCartBtn.addEventListener('click', () => {
      if (currentActiveStep === 'payment') {
        switchCheckoutStep('address');
      } else {
        switchCheckoutStep('cart');
      }
    });
  }

  function openCartDrawer() {
    if (cartDrawerOverlay) {
      cartDrawerOverlay.classList.add('active');
      cartDrawerOverlay.style.display = 'flex';
      switchCheckoutStep('cart');
    }
  }

  function closeCartDrawer() {
    if (cartDrawerOverlay) {
      cartDrawerOverlay.classList.remove('active');
      setTimeout(() => {
        cartDrawerOverlay.style.display = 'none';
        switchCheckoutStep('cart');
      }, 300);
    }
  }

  const closeCartBtnTop = document.getElementById('closeCartBtnTop');
  if (openCartBtn) openCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (closeCartBtnTop) closeCartBtnTop.addEventListener('click', closeCartDrawer);

  const heroCornerBuyBtn = document.getElementById('heroCornerBuyBtn');
  if (heroCornerBuyBtn) {
    heroCornerBuyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  }

  // BUY NOW - Cash On Delivery Button Handler
  if (instantBuyBtn) {
    instantBuyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedQty = parseInt(qtyInput?.value) || currentQty;
      updateQuantity(selectedQty);
      updatePaymentOption('cod');
      openCartDrawer();
      const totalAmount = (currentQty * basePrice) + 80;
      showToast(`⚡ Cash On Delivery Selected (Qty: ${currentQty}, Total: ₹${totalAmount.toLocaleString('en-IN')})`);
    });
  }

  // Mobile Buy Now Button Handler
  if (mobileBuyBtn) {
    mobileBuyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedQty = parseInt(qtyInput?.value) || currentQty;
      updateQuantity(selectedQty);
      updatePaymentOption('cod');
      openCartDrawer();
      const totalAmount = (currentQty * basePrice) + 80;
      showToast(`⚡ Cash On Delivery Selected (Qty: ${currentQty}, Total: ₹${totalAmount.toLocaleString('en-IN')})`);
    });
  }

  // Added to Cart Pop-up Controller
  const addedToCartModal = document.getElementById('addedToCartModal');
  const closeAddedModalBtn = document.getElementById('closeAddedModalBtn');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const viewCartModalBtn = document.getElementById('viewCartModalBtn');
  const addedModalProdMsg = document.getElementById('addedModalProdMsg');

  function openAddedToCartModal(prodTitle) {
    if (addedModalProdMsg) {
      const displayTitle = prodTitle || document.querySelector('.product-title-main')?.textContent || 'Blinjo Brass Urli Bowl';
      addedModalProdMsg.textContent = `${displayTitle} has been added to your cart.`;
    }
    if (addedToCartModal) {
      addedToCartModal.classList.add('active');
      addedToCartModal.style.display = 'flex';
    }
  }

  function closeAddedToCartModal() {
    if (addedToCartModal) {
      addedToCartModal.classList.remove('active');
      addedToCartModal.style.display = 'none';
    }
  }

  if (closeAddedModalBtn) closeAddedModalBtn.addEventListener('click', closeAddedToCartModal);

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      closeAddedToCartModal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (viewCartModalBtn) {
    viewCartModalBtn.addEventListener('click', () => {
      closeAddedToCartModal();
      openCartDrawer();
    });
  }

  if (addedToCartModal) {
    addedToCartModal.addEventListener('click', (e) => {
      if (e.target === addedToCartModal) closeAddedToCartModal();
    });
  }

  // Add to Cart Button Handler
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateQuantity(currentQty);
      const prodTitle = document.querySelector('.product-title-main')?.textContent || 'Blinjo Brass Urli Bowl';
      openAddedToCartModal(prodTitle);
    });
  }

  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === cartDrawerOverlay) {
        closeCartDrawer();
      }
    });
  }

  // Proceed to Address button on Cart step
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchCheckoutStep('address');
    });
  }

  // Common Function to Create and Save Order
  function saveAndFinalizeOrder(paymentMethodText, paymentStatusText) {
    const custName = document.getElementById('custNameInput')?.value.trim() || 'Rahul Sharma';
    const custEmail = document.getElementById('custEmailInput')?.value.trim() || 'rahul.sharma@email.com';
    const custPhone = document.getElementById('custPhoneInput')?.value.trim() || '9876543210';
    const custFlat = document.getElementById('custFlatInput')?.value.trim() || '';
    const custStreet = document.getElementById('custStreetInput')?.value.trim() || '';
    const custCity = document.getElementById('custCityInput')?.value || 'Mumbai';
    const custState = document.getElementById('custStateInput')?.value || 'Maharashtra';
    const custPincode = document.getElementById('custPincodeInput')?.value.trim() || '';

    const fullAddress = `${custName}\n${custFlat}${custFlat && custStreet ? ', ' : ''}${custStreet}\n${custCity}, ${custState} - ${custPincode}, India`;

    const orderId = '#BLJ' + Math.floor(1251 + Math.random() * 9000);
    
    const isPrepaid = currentSelectedPayment === 'prepaid';
    const deliveryCharge = isPrepaid ? 40 : 80;
    const discount = isPrepaid ? 40 : 0;
    const totalAmount = (currentQty * basePrice) + deliveryCharge - discount;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const activeProdData = localStorage.getItem('blinjo_active_product');
    let prodTitle = 'Blinjo Brass Urli Bowl';
    let prodImg = 'assets/bestseller.jpg';
    if (activeProdData) {
      try {
        const parsed = JSON.parse(activeProdData);
        if (parsed.title) prodTitle = parsed.title;
        if (parsed.image) prodImg = parsed.image;
      } catch(err){}
    }

    const newOrder = {
      id: orderId,
      storeId: 'ST-BLJ-001',
      name: custName,
      avatar: 'assets/cat_1.jpg',
      city: `${custCity}, ${custState}`,
      email: custEmail,
      phone: custPhone.startsWith('+91') ? custPhone : `+91 ${custPhone}`,
      address: fullAddress,
      products: [
        { name: prodTitle, price: basePrice, qty: currentQty, img: prodImg }
      ],
      moreCount: 1,
      date: dateStr,
      time: timeStr,
      amount: totalAmount,
      paymentMethod: paymentMethodText,
      paymentStatus: paymentStatusText,
      status: 'Pending'
    };

    const existingData = localStorage.getItem('blinjo_orders_v2');
    const ordersArr = existingData ? JSON.parse(existingData) : [];
    ordersArr.unshift(newOrder);
    localStorage.setItem('blinjo_orders_v2', JSON.stringify(ordersArr));
    localStorage.setItem('blinjo_orders', JSON.stringify(ordersArr));

    if (typeof addOrderFirestore === 'function') {
      addOrderFirestore(newOrder);
    }

    try {
      const orderBC = new BroadcastChannel('blinjo_orders_channel');
      orderBC.postMessage({ type: 'NEW_ORDER_PLACED', orderId: orderId, newOrder: newOrder });
      orderBC.close();
    } catch(e) {}
    window.dispatchEvent(new CustomEvent('blinjo_order_placed', { detail: newOrder }));

    // Update UI elements in Step 4 Success View
    const successTitle = document.getElementById('successTitle');
    const successSubtitle = document.getElementById('successSubtitle');
    const succOrderId = document.getElementById('succOrderId');
    const succAmount = document.getElementById('succAmount');
    const succPayMethod = document.getElementById('succPayMethod');
    const succDeliveryDate = document.getElementById('succDeliveryDate');

    if (successTitle) {
      successTitle.textContent = isPrepaid ? 'Payment Successful!' : 'Order Placed Successfully!';
    }
    if (successSubtitle) {
      successSubtitle.textContent = isPrepaid 
        ? 'Your order has been placed successfully.' 
        : 'Thank you for shopping with Blinjo. Your order has been confirmed.';
    }
    if (succOrderId) succOrderId.textContent = orderId;
    if (succAmount) succAmount.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
    if (succPayMethod) succPayMethod.textContent = paymentMethodText;
    
    // Expected delivery: +3 days
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 3);
    const expStr = expDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (succDeliveryDate) succDeliveryDate.textContent = expStr;

    switchCheckoutStep('success');
  }

  // Dynamic State to City Dropdown Mapping
  const stateCityMap = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davangere', 'Ballari'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Kharagpur'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Ghaziabad', 'Prayagraj', 'Meerut'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam']
  };

  const custStateInput = document.getElementById('custStateInput');
  const custCityInput = document.getElementById('custCityInput');

  function updateCityDropdown(selectedState, selectedCityVal = '') {
    if (!custCityInput) return;
    custCityInput.innerHTML = '';

    const cities = stateCityMap[selectedState];
    if (cities && cities.length > 0) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.disabled = true;
      defaultOption.selected = !selectedCityVal;
      defaultOption.textContent = 'Select city';
      custCityInput.appendChild(defaultOption);

      cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        if (selectedCityVal && city === selectedCityVal) {
          opt.selected = true;
        }
        custCityInput.appendChild(opt);
      });
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = 'Select state first';
      custCityInput.appendChild(defaultOption);
    }
  }

  if (custStateInput) {
    custStateInput.addEventListener('change', (e) => {
      updateCityDropdown(e.target.value);
    });
    if (custStateInput.value) {
      updateCityDropdown(custStateInput.value);
    }
  }

  // Save & Continue / Place Order button on Address step
  const orderAddressForm = document.getElementById('orderAddressForm');
  const saveAddressBtn = document.getElementById('saveAddressBtn');

  if (orderAddressForm) {
    orderAddressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!orderAddressForm.checkValidity()) {
        orderAddressForm.reportValidity();
        return;
      }

      const isPrepaid = currentSelectedPayment === 'prepaid';

      if (isPrepaid) {
        // Prepaid Flow: Go to Step 3 Payment Page (UPI)
        switchCheckoutStep('payment');
      } else {
        // COD Flow: Skip Payment Page & directly place order!
        if (saveAddressBtn) {
          saveAddressBtn.disabled = true;
          saveAddressBtn.innerHTML = '<span>Placing Order... ⏳</span>';
        }
        setTimeout(() => {
          saveAndFinalizeOrder('Cash on Delivery', 'COD');
          if (saveAddressBtn) {
            saveAddressBtn.disabled = false;
            saveAddressBtn.innerHTML = '<span id="saveAddressBtnText">Place Order</span> <span style="font-size:18px;">➔</span>';
          }
        }, 600);
      }
    });
  }

  // Razorpay Payment Gateway (Test Mode) Integration
  const completeUpiPayBtn = document.getElementById('completeUpiPayBtn');
  
  function launchRazorpayCheckout() {
    const custName = document.getElementById('custNameInput')?.value.trim() || 'Rahul Sharma';
    const custEmail = document.getElementById('custEmailInput')?.value.trim() || 'rahul.sharma@email.com';
    const custPhone = document.getElementById('custPhoneInput')?.value.trim() || '9876543210';

    const isPrepaid = currentSelectedPayment === 'prepaid';
    const deliveryCharge = isPrepaid ? 40 : 80;
    const discount = isPrepaid ? 40 : 0;
    const totalAmount = (currentQty * basePrice) + deliveryCharge - discount;
    const orderRefId = 'BLJ' + Math.floor(1251 + Math.random() * 9000);

    const resetPayBtn = () => {
      if (completeUpiPayBtn) {
        completeUpiPayBtn.disabled = false;
        completeUpiPayBtn.innerHTML = '<span>Pay with Razorpay (Test Mode)</span> <span style="font-size:20px;">➔</span>';
      }
    };

    if (typeof Razorpay !== 'undefined') {
      const options = {
        key: "rzp_test_1DP5mmOlF5G5ag", // Razorpay Test Mode Key
        amount: totalAmount * 100, // Amount in paise
        currency: "INR",
        name: "Blinjo Store",
        description: `Order #${orderRefId} - Festive Decor (Test Mode)`,
        image: "assets/cat_1.jpg",
        prefill: {
          name: custName,
          email: custEmail,
          contact: custPhone
        },
        notes: {
          merchant_order_id: orderRefId,
          environment: "Test Mode"
        },
        theme: {
          color: "#0284c7"
        },
        handler: function (response) {
          console.log("✅ Razorpay Test Payment Successful:", response);
          const paymentId = response.razorpay_payment_id || ('pay_test_' + Math.random().toString(36).substring(2, 10));
          saveAndFinalizeOrder(`Razorpay Test Mode (${paymentId})`, 'Paid');
          resetPayBtn();
        },
        modal: {
          ondismiss: function () {
            console.log('ℹ️ Razorpay Test Payment Modal dismissed.');
            resetPayBtn();
          }
        }
      };

      try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.warn("⚠️ Razorpay Payment Failed:", response.error);
          alert(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
          resetPayBtn();
        });
        rzp.open();
      } catch(err) {
        console.warn("Razorpay SDK init fallback:", err);
        executeSimulatedRazorpayTest(orderRefId, resetPayBtn);
      }
    } else {
      executeSimulatedRazorpayTest(orderRefId, resetPayBtn);
    }
  }

  function executeSimulatedRazorpayTest(orderRefId, resetBtnCallback) {
    setTimeout(() => {
      const mockPayId = 'pay_test_' + Math.random().toString(36).substring(2, 10);
      saveAndFinalizeOrder(`Razorpay Test Mode (${mockPayId})`, 'Paid');
      if (resetBtnCallback) resetBtnCallback();
    }, 1000);
  }

  if (completeUpiPayBtn) {
    completeUpiPayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      completeUpiPayBtn.disabled = true;
      completeUpiPayBtn.innerHTML = '<span>Opening Razorpay Checkout... ⏳</span>';
      launchRazorpayCheckout();
    });
  }

  // Finish Order Button on Success Step
  const finishOrderBtn = document.getElementById('finishOrderBtn');
  if (finishOrderBtn) {
    finishOrderBtn.addEventListener('click', () => {
      closeCartDrawer();
      if (orderAddressForm) orderAddressForm.reset();
      switchCheckoutStep('cart');
    });
  }


  // 7. Live Countdown Timer
  let timeInSeconds = (4 * 3600) + (32 * 60) + 15; // 04:32:15
  const timerDigits = document.getElementById('countdownTimer');

  function updateTimer() {
    if (timeInSeconds <= 0) {
      timeInSeconds = (4 * 3600) + (32 * 60) + 15; // Loop timer
    }
    const hours = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (timeInSeconds % 60).toString().padStart(2, '0');
    if (timerDigits) {
      timerDigits.textContent = `${hours}:${mins}:${secs}`;
    }
    timeInSeconds--;
  }

  setInterval(updateTimer, 1000);


  // 8. Simple Toast Notification helper
  function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: #0d5c34;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 300;
      transition: opacity 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

});
