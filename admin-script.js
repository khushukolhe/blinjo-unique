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

  // Initial Orders DB starting empty for manual entry
  const defaultOrders = [];

  // Load orders from LocalStorage or set defaults
  function getStoredOrders() {
    const data = localStorage.getItem('blinjo_orders_v2');
    if (!data) return [];
    // Filter out dummy sample orders if present
    const parsed = JSON.parse(data);
    const cleaned = parsed.filter(o => !['#01','#02','#03','#04','#05','#06','#07','#08','#09','#10'].includes(o.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem('blinjo_orders_v2', JSON.stringify(cleaned));
    }
    return cleaned;
  }

  function saveStoredOrders(orders) {
    localStorage.setItem('blinjo_orders_v2', JSON.stringify(orders));
  }

  let ordersList = getStoredOrders();
  let selectedOrderId = ordersList[0] ? ordersList[0].id : null;

  function reloadAdminOrdersData() {
    ordersList = getStoredOrders();
    if (!selectedOrderId && ordersList[0]) selectedOrderId = ordersList[0].id;
    if (typeof updateOrderKPIs === 'function') updateOrderKPIs();
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
    if (typeof renderDashboardOverview === 'function') renderDashboardOverview();
  }

  function showAdminOrderToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: #047857;
      color: #ffffff;
      padding: 14px 22px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(4, 120, 87, 0.35);
      z-index: 10000;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>🎉</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Real-time synchronization across browser tabs & local storage events
  window.addEventListener('storage', (e) => {
    if (e.key === 'blinjo_orders_v2' || e.key === 'blinjo_orders') {
      reloadAdminOrdersData();
    }
  });

  window.addEventListener('blinjo_order_placed', () => {
    reloadAdminOrdersData();
    showAdminOrderToast('New Customer Order Placed!');
  });

  try {
    const orderBC = new BroadcastChannel('blinjo_orders_channel');
    orderBC.onmessage = (event) => {
      if (event.data && event.data.type === 'NEW_ORDER_PLACED') {
        reloadAdminOrdersData();
        const oId = event.data.orderId || '';
        showAdminOrderToast(`New Order Received: ${oId}`);
      }
    };
  } catch(e) {}

  // Initialize Realtime Orders Sync from Firestore
  if (typeof syncOrders === 'function') {
    syncOrders((syncedOrders) => {
      if (syncedOrders) {
        ordersList = syncedOrders;
        if (!selectedOrderId && ordersList[0]) selectedOrderId = ordersList[0].id;
        updateOrderKPIs();
        renderOrdersTable();
        renderDashboardOverview();
      }
    });
  }

  // 1. Sidebar Tab Navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const adminTabs = document.querySelectorAll('.admin-tab');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      adminTabs.forEach(t => t.classList.remove('active'));

      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      if (tabId === 'tab-overview') {
        renderDashboardOverview();
      } else if (tabId === 'tab-slideshow') {
        renderSlideshowManager();
        renderOccasionsManager();
      }
    });
  });

  // 2. DOM Elements for Order Management
  const ordersTableBody = document.getElementById('ordersTableBody');
  const sidebarOrdersCount = document.getElementById('sidebarOrdersCount');
  
  // KPI Elements
  const kpiTotalOrdersVal = document.getElementById('kpiTotalOrdersVal');
  const kpiPendingVal = document.getElementById('kpiPendingVal');
  const kpiProcessingVal = document.getElementById('kpiProcessingVal');
  const kpiShippedVal = document.getElementById('kpiShippedVal');
  const kpiDeliveredVal = document.getElementById('kpiDeliveredVal');
  const kpiCancelledVal = document.getElementById('kpiCancelledVal');

  // Tab count badges
  const tabAllCount = document.getElementById('tabAllCount');
  const tabPendingCount = document.getElementById('tabPendingCount');
  const tabProcessingCount = document.getElementById('tabProcessingCount');
  const tabShippedCount = document.getElementById('tabShippedCount');
  const tabDeliveredCount = document.getElementById('tabDeliveredCount');
  const tabCancelledCount = document.getElementById('tabCancelledCount');

  // Side Panel Elements
  const orderDetailsPanel = document.getElementById('orderDetailsPanel');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const panelOrderId = document.getElementById('panelOrderId');
  const panelOrderStatus = document.getElementById('panelOrderStatus');
  const panelOrderDate = document.getElementById('panelOrderDate');
  const panelCustName = document.getElementById('panelCustName');
  const panelCustEmail = document.getElementById('panelCustEmail');
  const panelCustPhone = document.getElementById('panelCustPhone');
  const panelCustAddress = document.getElementById('panelCustAddress');
  const panelItemCount = document.getElementById('panelItemCount');
  const panelItemsList = document.getElementById('panelItemsList');
  const panelSubtotal = document.getElementById('panelSubtotal');
  const panelTotalAmount = document.getElementById('panelTotalAmount');
  const panelPaymentMethod = document.getElementById('panelPaymentMethod');
  const panelPaymentStatus = document.getElementById('panelPaymentStatus');
  const panelStatusSelect = document.getElementById('panelStatusSelect');
  const savePanelStatusBtn = document.getElementById('savePanelStatusBtn');

  // Toolbar & Filters
  const orderSearchInput = document.getElementById('orderSearchInput');
  const filterOrderStatus = document.getElementById('filterOrderStatus');
  const filterPaymentStatus = document.getElementById('filterPaymentStatus');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const orderTabBtns = document.querySelectorAll('.order-tab-btn');
  const paginationInfo = document.getElementById('paginationInfo');

  let currentTabFilter = 'all';

  // Helper function to get status pill CSS class
  function getStatusClass(status) {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Processing': return 'status-processing';
      case 'Shipped': return 'status-shipped';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  // Helper function to get payment pill CSS class
  function getPaymentClass(paymentStatus) {
    if (paymentStatus === 'Paid') return 'payment-paid';
    if (paymentStatus === 'COD') return 'payment-cod';
    return 'payment-failed';
  }

  // Global State for Pagination & Bulk Actions
  let currentPage = 1;
  const pageSize = 10;
  let selectedOrderIds = new Set();

  // Dynamic KPI and Tab Count calculation
  function updateOrderKPIs() {
    const total = ordersList.length;
    const pending = ordersList.filter(o => o.status === 'Pending').length;
    const processing = ordersList.filter(o => o.status === 'Processing').length;
    const shipped = ordersList.filter(o => o.status === 'Shipped').length;
    const delivered = ordersList.filter(o => o.status === 'Delivered').length;
    const cancelled = ordersList.filter(o => o.status === 'Cancelled').length;

    if (kpiTotalOrdersVal) kpiTotalOrdersVal.textContent = total.toLocaleString('en-IN');
    if (kpiPendingVal) kpiPendingVal.textContent = pending;
    if (kpiProcessingVal) kpiProcessingVal.textContent = processing;
    if (kpiShippedVal) kpiShippedVal.textContent = shipped;
    if (kpiDeliveredVal) kpiDeliveredVal.textContent = delivered;
    if (kpiCancelledVal) kpiCancelledVal.textContent = cancelled;

    if (tabAllCount) tabAllCount.textContent = total.toLocaleString('en-IN');
    if (tabPendingCount) tabPendingCount.textContent = pending;
    if (tabProcessingCount) tabProcessingCount.textContent = processing;
    if (tabShippedCount) tabShippedCount.textContent = shipped;
    if (tabDeliveredCount) tabDeliveredCount.textContent = delivered;
    if (tabCancelledCount) tabCancelledCount.textContent = cancelled;

    if (sidebarOrdersCount) sidebarOrdersCount.textContent = pending;
  }

  // Helper to open View Order Details Modal (Right Side Sliding Drawer)
  function openViewOrderModal(order) {
    if (!order) return;
    const viewOrderModal = document.getElementById('viewOrderModal');
    if (viewOrderModal) {
      if (viewOrderModal.parentElement !== document.body) {
        document.body.appendChild(viewOrderModal);
      }
      populateOrderDetails(order);
      viewOrderModal.classList.add('active');
      viewOrderModal.style.display = 'flex';
    }
  }

  // Populate View Order Details Modal (Dedicated Pop-up Overlay)
  function populateOrderDetails(order) {
    if (!order) return;
    selectedOrderId = order.id;

    const modalOrderId = document.getElementById('modalOrderId');
    const modalOrderDate = document.getElementById('modalOrderDate');
    const modalOrderStatus = document.getElementById('modalOrderStatus');
    const modalCustName = document.getElementById('modalCustName');
    const modalCustContact = document.getElementById('modalCustContact');
    const modalCustAddress = document.getElementById('modalCustAddress');
    const modalProductsList = document.getElementById('modalProductsList');
    const modalSubtotal = document.getElementById('modalSubtotal');
    const modalShipping = document.getElementById('modalShipping');
    const modalDiscount = document.getElementById('modalDiscount');
    const modalTotalAmount = document.getElementById('modalTotalAmount');
    const modalPayMethod = document.getElementById('modalPayMethod');
    const modalPayStatus = document.getElementById('modalPayStatus');
    const modalTxnId = document.getElementById('modalTxnId');
    const modalPayDate = document.getElementById('modalPayDate');
    const modalTimeline = document.getElementById('modalTimeline');
    const modalStatusSelect = document.getElementById('modalStatusSelect');

    if (modalOrderId) modalOrderId.textContent = `Order ${order.id}`;
    if (modalOrderDate) modalOrderDate.textContent = `Placed on ${order.date || '01 Oct 2026'}, ${order.time || '10:45 AM'}`;
    
    if (modalOrderStatus) {
      let icon = '🚚';
      let statusBg = '#dcfce7';
      let statusColor = '#15803d';

      if (order.status === 'Processing') {
        icon = '⚙️';
        statusBg = '#dbeafe';
        statusColor = '#1e40af';
      } else if (order.status === 'Shipped') {
        icon = '🚚';
        statusBg = '#fef3c7';
        statusColor = '#92400e';
      } else if (order.status === 'Cancelled') {
        icon = '❌';
        statusBg = '#fee2e2';
        statusColor = '#b91c1c';
      } else if (order.status === 'Pending') {
        icon = '⏳';
        statusBg = '#f3f4f6';
        statusColor = '#4b5563';
      }

      modalOrderStatus.innerHTML = `<span>${icon}</span> ${order.status}`;
      modalOrderStatus.style.background = statusBg;
      modalOrderStatus.style.color = statusColor;
    }

    if (modalCustName) modalCustName.textContent = order.name;
    if (modalCustContact) modalCustContact.textContent = `${order.phone || '9876543210'}  |  ${order.email || 'rahul.sharma@example.com'}`;
    if (modalCustAddress) modalCustAddress.textContent = order.address || 'Flat No 101, Orchid Residency, Kharadi, Pune - 411014, Maharashtra, India';

    let subtotalVal = 0;
    if (modalProductsList) {
      modalProductsList.innerHTML = order.products.map(p => {
        const itemTot = p.price * p.qty;
        subtotalVal += itemTot;
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 6px 4px;"><img src="${p.img || 'assets/bestseller.jpg'}" alt="${p.name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;"></td>
            <td style="padding: 6px 4px;"><strong style="font-size: 12px; color: #0f172a; display: block;">${p.name}</strong></td>
            <td style="padding: 6px 4px; text-align: center; font-weight: 700; font-size: 12px;">${p.qty}</td>
            <td style="padding: 6px 4px; text-align: right; font-size: 12px;">₹${p.price.toLocaleString('en-IN')}</td>
            <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: #0f172a; font-size: 12px;">₹${itemTot.toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('');
    }

    const isCod = order.paymentMethod?.includes('COD');
    const shippingCharge = isCod ? 50 : 0;
    const totalCalc = subtotalVal + shippingCharge;

    if (modalSubtotal) modalSubtotal.textContent = `₹${(subtotalVal || order.amount).toLocaleString('en-IN')}`;
    if (modalShipping) modalShipping.textContent = shippingCharge > 0 ? `₹${shippingCharge}` : 'FREE';
    if (modalDiscount) modalDiscount.textContent = `- ₹0`;
    if (modalTotalAmount) modalTotalAmount.textContent = `₹${(order.amount || totalCalc).toLocaleString('en-IN')}`;

    if (modalPayMethod) {
      modalPayMethod.textContent = order.paymentMethod?.includes('UPI') ? 'UPI (Google Pay)' : (order.paymentMethod || 'UPI (Google Pay)');
    }
    if (modalPayStatus) {
      modalPayStatus.textContent = order.paymentStatus === 'Paid' ? '✓ Paid' : order.paymentStatus;
      modalPayStatus.style.background = order.paymentStatus === 'Paid' ? '#e6f4ea' : '#fef3c7';
      modalPayStatus.style.color = order.paymentStatus === 'Paid' ? '#137333' : '#92400e';
    }
    if (modalTxnId) modalTxnId.textContent = 'UPI' + Math.floor(1000000000 + Math.random() * 9000000000);
    if (modalPayDate) modalPayDate.textContent = `${order.date || '01 Oct 2026'}, ${order.time || '10:46 AM'}`;

    if (modalTimeline) {
      const isDelivered = order.status === 'Delivered';
      const isShipped = isDelivered || order.status === 'Shipped';
      const isProcessing = isShipped || order.status === 'Processing';

      modalTimeline.innerHTML = `
        <div style="position:absolute; left:6px; top:6px; bottom:6px; width:2px; background:#10b981;"></div>
        
        <div style="position:relative; margin-bottom:10px; padding-left:14px;">
          <div style="position:absolute; left:-18px; top:2px; width:10px; height:10px; border-radius:50%; background:#10b981; border:2px solid #fff;"></div>
          <strong style="display:block; color:#0f172a; font-size:11px;">Order Placed</strong>
          <span style="color:#64748b; font-size:10px;">${order.date}, ${order.time}</span>
        </div>

        <div style="position:relative; margin-bottom:10px; padding-left:14px;">
          <div style="position:absolute; left:-18px; top:2px; width:10px; height:10px; border-radius:50%; background:${isProcessing ? '#10b981' : '#cbd5e1'}; border:2px solid #fff;"></div>
          <strong style="display:block; color:${isProcessing ? '#0f172a' : '#94a3b8'}; font-size:11px;">Processing</strong>
          <span style="color:#64748b; font-size:10px;">${isProcessing ? order.date + ', 11:30 AM' : 'Pending'}</span>
        </div>

        <div style="position:relative; margin-bottom:10px; padding-left:14px;">
          <div style="position:absolute; left:-18px; top:2px; width:10px; height:14px; width:10px; border-radius:50%; background:${isShipped ? '#10b981' : '#cbd5e1'}; border:2px solid #fff;"></div>
          <strong style="display:block; color:${isShipped ? '#0f172a' : '#94a3b8'}; font-size:11px;">Shipped</strong>
          <span style="color:#64748b; font-size:10px;">${isShipped ? order.date + ', 05:20 PM' : 'Pending'}</span>
        </div>

        <div style="position:relative; padding-left:14px;">
          <div style="position:absolute; left:-18px; top:2px; width:10px; height:10px; border-radius:50%; background:${isDelivered ? '#10b981' : '#cbd5e1'}; border:2px solid #fff;"></div>
          <strong style="display:block; color:${isDelivered ? '#0f172a' : '#94a3b8'}; font-size:11px;">Delivered</strong>
          <span style="color:#64748b; font-size:10px;">${isDelivered ? '02 Oct 2026, 11:10 AM' : 'Expected soon'}</span>
        </div>
      `;
    }

    if (modalStatusSelect) modalStatusSelect.value = order.status;
  }

  // Update Bulk Actions Toolbar UI
  function updateBulkActionsUI() {
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectedCountVal = document.getElementById('selectedCountVal');
    if (!bulkActionsBar) return;

    if (selectedOrderIds.size > 0) {
      bulkActionsBar.style.display = 'flex';
      if (selectedCountVal) selectedCountVal.textContent = selectedOrderIds.size;
    } else {
      bulkActionsBar.style.display = 'none';
    }
  }

  // Render Dynamic Pagination Controls
  function renderPagination(totalFilteredItems) {
    const paginationControls = document.getElementById('paginationControls');
    const paginationInfo = document.getElementById('paginationInfo');
    if (!paginationControls) return;

    const totalPages = Math.ceil(totalFilteredItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startItem = totalFilteredItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalFilteredItems);

    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalFilteredItems} orders`;
    }

    let html = `<button class="page-btn prev-page-btn" ${currentPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&lt;</button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span style="padding:0 4px;">...</span>`;
      }
    }

    html += `<button class="page-btn next-page-btn" ${currentPage === totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&gt;</button>`;
    paginationControls.innerHTML = html;

    // Attach Pagination listeners
    paginationControls.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.getAttribute('data-page'));
        renderOrdersTable();
      });
    });

    const prevBtn = paginationControls.querySelector('.prev-page-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderOrdersTable();
        }
      });
    }

    const nextBtn = paginationControls.querySelector('.next-page-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderOrdersTable();
        }
      });
    }
  }

  // Render Orders Table with Pagination & Active Buttons
  function renderOrdersTable() {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';

    const query = orderSearchInput ? orderSearchInput.value.toLowerCase().trim() : '';
    const selectedStatusFilter = filterOrderStatus ? filterOrderStatus.value : 'all';
    const selectedPaymentFilter = filterPaymentStatus ? filterPaymentStatus.value : 'all';

    let filtered = ordersList.filter(ord => {
      const matchTab = (currentTabFilter === 'all') || (ord.status.toLowerCase() === currentTabFilter.toLowerCase());
      const matchStatus = (selectedStatusFilter === 'all') || (ord.status.toLowerCase() === selectedStatusFilter.toLowerCase());
      const matchPayment = (selectedPaymentFilter === 'all') || (ord.paymentStatus.toLowerCase() === selectedPaymentFilter.toLowerCase());
      const matchQuery = !query || 
        ord.id.toLowerCase().includes(query) ||
        ord.name.toLowerCase().includes(query) ||
        ord.city.toLowerCase().includes(query) ||
        ord.phone.includes(query);

      return matchTab && matchStatus && matchPayment && matchQuery;
    });

    renderPagination(filtered.length);

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 28px; color: #9ca3af;">No orders found matching criteria.</td></tr>`;
      return;
    }

    // Page slice
    const startIndex = (currentPage - 1) * pageSize;
    const pageOrders = filtered.slice(startIndex, startIndex + pageSize);

    pageOrders.forEach(ord => {
      const tr = document.createElement('tr');
      const isChecked = selectedOrderIds.has(ord.id);
      if (ord.id === selectedOrderId) tr.classList.add('selected');

      const prodName = ord.products[0]?.name || 'Brass Urli Bowl';
      const itemText = ord.itemText || (ord.products[0]?.qty > 1 ? `${ord.products[0]?.qty} items` : '1 item');
      
      let statusIcon = '🚚';
      let statusBgClass = 'status-delivered-pill';
      if (ord.status === 'Processing') {
        statusIcon = '⚙️';
        statusBgClass = 'status-processing-pill';
      } else if (ord.status === 'Shipped') {
        statusIcon = '🚚';
        statusBgClass = 'status-shipped-pill';
      } else if (ord.status === 'Cancelled') {
        statusIcon = '❌';
        statusBgClass = 'status-cancelled-pill';
      }

      tr.innerHTML = `
        <td style="font-weight: 700; color: #0f172a; font-size: 13px; white-space: nowrap;">${ord.id}</td>
        <td style="font-weight: 600; color: #1e293b; font-size: 13px; white-space: nowrap;">
          <a href="javascript:void(0)" class="cust-name-link" data-id="${ord.id}" style="color: #047857; text-decoration: underline; font-weight: 700; cursor: pointer;">${ord.name}</a>
        </td>
        <td>
          <div class="product-item-cell" style="display: flex; align-items: center; gap: 8px;">
            <img class="prod-square-img" src="${ord.products[0]?.img || 'assets/bestseller.jpg'}" alt="${prodName}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0;">
            <div class="prod-text-info" style="line-height: 1.2;">
              <strong style="display: block; color: #0f172a; font-size: 12px; font-weight:700;">${prodName}</strong>
              <small style="color: #64748b; font-size: 11px;">${itemText}</small>
            </div>
          </div>
        </td>
        <td style="color: #475569; font-size: 12px; font-weight: 500; white-space: nowrap;">${ord.phone || '9876543210'}</td>
        <td style="color: #475569; font-size: 12px; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ord.address || 'Kharadi, Pune, Maharashtra'}">${ord.address || 'Kharadi, Pune, Maharashtra'}</td>
        <td>
          <span class="status-badge-pill ${statusBgClass}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; white-space: nowrap;">
            <span>${statusIcon}</span> ${ord.status}
          </span>
        </td>
        <td style="text-align: right; padding-right: 12px;">
          <button class="btn-view-details view-order-btn" data-id="${ord.id}" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; border: 1px solid #047857; color: #047857; background: #ffffff; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.2s;">
            View Details
          </button>
        </td>
      `;

      // Direct View Details Button Handler
      const viewBtn = tr.querySelector('.view-order-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          openViewOrderModal(ord);
        });
      }

      // Customer Name Link Click -> Open Details Modal
      const custLink = tr.querySelector('.cust-name-link');
      if (custLink) {
        custLink.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          openViewOrderModal(ord);
        });
      }

      // Row Click Handler (Opens View Order Details Modal)
      tr.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('.icon-action-btn') || e.target.closest('.view-order-btn')) return;
        document.querySelectorAll('#ordersTableBody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        openViewOrderModal(ord);
      });

      ordersTableBody.appendChild(tr);
    });

    // View Order Button Handler
    document.querySelectorAll('.view-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const ordId = btn.getAttribute('data-id');
        const targetOrd = ordersList.find(o => o.id === ordId);
        if (targetOrd) {
          openViewOrderModal(targetOrd);
        }
      });
    });

    // Edit Order Button (Opens Edit Order Status Modal)
    document.querySelectorAll('.edit-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ordId = btn.getAttribute('data-id');
        const targetOrd = ordersList.find(o => o.id === ordId);
        if (targetOrd && editOrderModal) {
          selectedOrderId = targetOrd.id;
          const editModalOrderId = document.getElementById('editModalOrderId');
          const editModalOrderStatus = document.getElementById('editModalOrderStatus');
          const editModalPaymentStatus = document.getElementById('editModalPaymentStatus');

          if (editModalOrderId) editModalOrderId.textContent = targetOrd.id;
          if (editModalOrderStatus) editModalOrderStatus.value = targetOrd.status;
          if (editModalPaymentStatus) editModalPaymentStatus.value = targetOrd.paymentStatus;

          editOrderModal.classList.add('active');
          editOrderModal.style.display = 'flex';
        }
      });
    });

    // More Options Button (Pop-over Menu)
    document.querySelectorAll('.more-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ordId = btn.getAttribute('data-id');
        const targetOrd = ordersList.find(o => o.id === ordId);
        if (!targetOrd) return;

        // Remove any existing active popover
        document.querySelectorAll('.options-popover-menu').forEach(m => m.remove());

        const popover = document.createElement('div');
        popover.className = 'options-popover-menu';
        popover.innerHTML = `
          <button class="popover-item view-item">👤 View Details</button>
          <button class="popover-item ship-item">🚚 Mark Shipped</button>
          <button class="popover-item deliver-item">✅ Mark Delivered</button>
          <button class="popover-item print-item">🖨️ Print Slip</button>
          <button class="popover-item danger-item delete-item">🗑️ Delete Order</button>
        `;

        btn.parentElement.appendChild(popover);

        // Popover Actions
        popover.querySelector('.view-item').addEventListener('click', () => {
          populateOrderDetails(targetOrd);
          if (viewOrderModal) {
            viewOrderModal.classList.add('active');
            viewOrderModal.style.display = 'flex';
          }
          popover.remove();
        });

        popover.querySelector('.ship-item').addEventListener('click', () => {
          targetOrd.status = 'Shipped';
          saveStoredOrders(ordersList);
          if (typeof updateOrderStatusFirestore === 'function') updateOrderStatusFirestore(targetOrd.id, 'Shipped');
          updateOrderKPIs();
          renderOrdersTable();
          popover.remove();
        });

        popover.querySelector('.deliver-item').addEventListener('click', () => {
          targetOrd.status = 'Delivered';
          saveStoredOrders(ordersList);
          if (typeof updateOrderStatusFirestore === 'function') updateOrderStatusFirestore(targetOrd.id, 'Delivered');
          updateOrderKPIs();
          renderOrdersTable();
          popover.remove();
        });

        popover.querySelector('.delete-item').addEventListener('click', () => {
          if (confirm(`Delete order ${targetOrd.id}?`)) {
            ordersList = ordersList.filter(o => o.id !== targetOrd.id);
            saveStoredOrders(ordersList);
            if (typeof deleteOrderFirestore === 'function') deleteOrderFirestore(targetOrd.id);
            updateOrderKPIs();
            renderOrdersTable();
          }
          popover.remove();
        });

        popover.querySelector('.print-item').addEventListener('click', () => {
          printInvoiceModal(targetOrd);
          popover.remove();
        });

        // Close popover on document click
        setTimeout(() => {
          window.addEventListener('click', () => popover.remove(), { once: true });
        }, 100);
      });
    });

    // Default select first order if non-selected
    const activeOrd = ordersList.find(o => o.id === selectedOrderId) || pageOrders[0];
    if (activeOrd) populateOrderDetails(activeOrd);
  }

  // Print Formatted Invoice Helper
  function printInvoiceModal(order) {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${order.id} - Blinjo Store</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; }
          .inv-header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff6b00; padding-bottom: 20px; margin-bottom: 30px; }
          .inv-title { font-size: 24px; font-weight: 800; color: #ff6b00; }
          .inv-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .box { background: #f9fafb; padding: 16px; border-radius: 8px; width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #fff7ed; color: #c2410c; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .total-box { text-align: right; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="inv-header">
          <div>
            <div class="inv-title">BLINJO STORE INVOICE</div>
            <p>Order Reference: <strong>${order.id}</strong></p>
            <p>Date: ${order.date}, ${order.time}</p>
          </div>
          <div style="text-align:right;">
            <strong>Blinjo Premium Crafts</strong><br>
            New Delhi, India<br>
            support@blinjo.com
          </div>
        </div>
        <div class="inv-grid">
          <div class="box">
            <h4>Customer Info</h4>
            <strong>${order.name}</strong><br>
            ${order.email}<br>
            ${order.phone}
          </div>
          <div class="box">
            <h4>Shipping Address</h4>
            <pre style="font-family:inherit;margin:0;">${order.address}</pre>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${order.products.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>₹${p.price}</td>
                <td>${p.qty}</td>
                <td>₹${p.price * p.qty}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-box">
          <p>Payment Method: ${order.paymentMethod} (${order.paymentStatus})</p>
          <p>Total Paid: ₹${order.amount.toLocaleString('en-IN')}</p>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Bulk Actions Listeners
  const bulkShippedBtn = document.getElementById('bulkShippedBtn');
  const bulkDeliveredBtn = document.getElementById('bulkDeliveredBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

  if (bulkShippedBtn) {
    bulkShippedBtn.addEventListener('click', () => {
      ordersList.forEach(o => {
        if (selectedOrderIds.has(o.id)) o.status = 'Shipped';
      });
      selectedOrderIds.clear();
      saveStoredOrders(ordersList);
      updateOrderKPIs();
      updateBulkActionsUI();
      renderOrdersTable();
    });
  }

  if (bulkDeliveredBtn) {
    bulkDeliveredBtn.addEventListener('click', () => {
      ordersList.forEach(o => {
        if (selectedOrderIds.has(o.id)) o.status = 'Delivered';
      });
      selectedOrderIds.clear();
      saveStoredOrders(ordersList);
      updateOrderKPIs();
      updateBulkActionsUI();
      renderOrdersTable();
    });
  }

  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      if (confirm(`Delete ${selectedOrderIds.size} selected orders?`)) {
        ordersList = ordersList.filter(o => !selectedOrderIds.has(o.id));
        selectedOrderIds.clear();
        saveStoredOrders(ordersList);
        updateOrderKPIs();
        updateBulkActionsUI();
        renderOrdersTable();
      }
    });
  }

  // Order KPI Stat Card Filter Listeners (Click card to filter table)
  const orderKpiCards = document.querySelectorAll('.order-kpi-card[data-order-kpi]');
  orderKpiCards.forEach(card => {
    card.addEventListener('click', () => {
      orderKpiCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentTabFilter = card.getAttribute('data-order-kpi');
      if (filterOrderStatus) filterOrderStatus.value = currentTabFilter;
      currentPage = 1;
      renderOrdersTable();
    });
  });

  // Search input listener
  if (orderSearchInput) {
    orderSearchInput.addEventListener('input', () => {
      currentPage = 1;
      renderOrdersTable();
    });
  }

  // Filter Dropdowns Change listeners
  if (filterOrderStatus) {
    filterOrderStatus.addEventListener('change', () => {
      currentTabFilter = filterOrderStatus.value;
      orderKpiCards.forEach(c => c.classList.remove('active'));
      const matchingCard = document.querySelector(`.order-kpi-card[data-order-kpi="${currentTabFilter}"]`) || document.querySelector('.order-kpi-card[data-order-kpi="all"]');
      if (matchingCard) matchingCard.classList.add('active');
      currentPage = 1;
      renderOrdersTable();
    });
  }

  if (filterPaymentStatus) {
    filterPaymentStatus.addEventListener('change', () => {
      currentPage = 1;
      renderOrdersTable();
    });
  }

  // Apply filters button
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      currentPage = 1;
      renderOrdersTable();
    });
  }

  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (orderSearchInput) orderSearchInput.value = '';
      if (filterOrderStatus) filterOrderStatus.value = 'all';
      if (filterPaymentStatus) filterPaymentStatus.value = 'all';
      currentTabFilter = 'all';
      currentPage = 1;
      orderKpiCards.forEach(c => c.classList.remove('active'));
      const defaultAllCard = document.querySelector('.order-kpi-card[data-order-kpi="all"]');
      if (defaultAllCard) defaultAllCard.classList.add('active');
      renderOrdersTable();
    });
  }

  // Date Range Filter Modal Controller
  const datePickerBtns = document.querySelectorAll('.date-picker-btn');
  const dateFilterModal = document.getElementById('dateFilterModal');
  const closeDateModalBtn = document.getElementById('closeDateModalBtn');
  const cancelDateModalBtn = document.getElementById('cancelDateModalBtn');
  const confirmDateModalBtn = document.getElementById('confirmDateModalBtn');
  const datePickerText = document.getElementById('datePickerText');
  const fromDateInput = document.getElementById('fromDateInput');
  const toDateInput = document.getElementById('toDateInput');
  const activePresetTag = document.getElementById('activePresetTag');
  const presetCards = document.querySelectorAll('.preset-card');

  let selectedRange = {
    preset: 'all',
    from: '01 Oct 2026',
    to: '31 Oct 2026'
  };

  datePickerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dateFilterModal) {
        dateFilterModal.classList.add('active');
        dateFilterModal.style.display = 'flex';
      }
    });
  });

  const closeDateModal = () => {
    if (dateFilterModal) {
      dateFilterModal.classList.remove('active');
      dateFilterModal.style.display = 'none';
    }
  };

  if (closeDateModalBtn) closeDateModalBtn.addEventListener('click', closeDateModal);
  if (cancelDateModalBtn) cancelDateModalBtn.addEventListener('click', closeDateModal);

  window.addEventListener('click', (e) => {
    if (e.target === dateFilterModal) closeDateModal();
  });

  // Preset Card Clicks
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const preset = card.getAttribute('data-preset');
      selectedRange.preset = preset;

      if (preset === 'all') {
        selectedRange.from = '01 Oct 2026';
        selectedRange.to = '31 Oct 2026';
        if (activePresetTag) activePresetTag.textContent = 'All Time';
      } else if (preset === 'today') {
        selectedRange.from = '01 Oct 2026';
        selectedRange.to = '01 Oct 2026';
        if (activePresetTag) activePresetTag.textContent = 'Today';
      } else if (preset === '7days') {
        selectedRange.from = '25 Sep 2026';
        selectedRange.to = '01 Oct 2026';
        if (activePresetTag) activePresetTag.textContent = 'Last 7 Days';
      } else if (preset === '30days') {
        selectedRange.from = '02 Sep 2026';
        selectedRange.to = '01 Oct 2026';
        if (activePresetTag) activePresetTag.textContent = 'Last 30 Days';
      } else if (preset === 'custom') {
        if (activePresetTag) activePresetTag.textContent = 'Custom Range';
      }

      if (fromDateInput) fromDateInput.value = selectedRange.from;
      if (toDateInput) toDateInput.value = selectedRange.to;
    });
  });

  // Calendar Days Click Listener
  document.querySelectorAll('.cal-day-item').forEach(day => {
    day.addEventListener('click', () => {
      document.querySelectorAll('.cal-day-item').forEach(d => d.classList.remove('selected-day', 'active-day'));
      day.classList.add('selected-day', 'active-day');

      const dateStr = day.getAttribute('data-date');
      if (dateStr) {
        const parts = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formatted = `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
        
        selectedRange.preset = 'custom';
        selectedRange.from = formatted;
        selectedRange.to = formatted;

        presetCards.forEach(c => c.classList.remove('active'));
        const customCard = document.querySelector('.preset-card[data-preset="custom"]');
        if (customCard) customCard.classList.add('active');

        if (activePresetTag) activePresetTag.textContent = 'Custom Range';
        if (fromDateInput) fromDateInput.value = formatted;
        if (toDateInput) toDateInput.value = formatted;
      }
    });
  });

  // Confirm OK Button Click
  if (confirmDateModalBtn) {
    confirmDateModalBtn.addEventListener('click', () => {
      const displayText = selectedRange.from === selectedRange.to 
        ? `📅 ${selectedRange.from}` 
        : `📅 ${selectedRange.from} - ${selectedRange.to}`;

      if (datePickerText) datePickerText.textContent = displayText;

      // Apply date filter logic to search input / rendering
      if (selectedRange.preset === 'today') {
        if (orderSearchInput) orderSearchInput.value = "01 Oct 2026";
      } else if (selectedRange.preset === '7days' || selectedRange.preset === '30days') {
        if (orderSearchInput) orderSearchInput.value = "Sep 2026";
      } else if (selectedRange.preset === 'all') {
        if (orderSearchInput) orderSearchInput.value = "";
      }

      currentPage = 1;
      renderOrdersTable();
      closeDateModal();
    });
  }

  // View Order Modal Controller
  const closeViewOrderModalBtn = document.getElementById('closeViewOrderModalBtn');
  const saveModalStatusBtn = document.getElementById('saveModalStatusBtn');
  const modalPrintInvoiceBtn = document.getElementById('modalPrintInvoiceBtn');
  const modalStatusSelect = document.getElementById('modalStatusSelect');

  const closeViewModal = () => {
    const viewOrderModal = document.getElementById('viewOrderModal');
    if (viewOrderModal) {
      viewOrderModal.classList.remove('active');
      viewOrderModal.style.display = 'none';
    }
  };

  if (closeViewOrderModalBtn) closeViewOrderModalBtn.addEventListener('click', closeViewModal);

  window.addEventListener('click', (e) => {
    const viewOrderModal = document.getElementById('viewOrderModal');
    if (e.target === viewOrderModal) closeViewModal();
  });

  // Global Event Delegation for View Order Details buttons
  document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('.view-order-btn, .btn-view-details, .cust-name-link');
    if (targetBtn) {
      const ordId = targetBtn.getAttribute('data-id');
      if (ordId) {
        const targetOrd = ordersList.find(o => o.id === ordId);
        if (targetOrd) {
          e.stopPropagation();
          e.preventDefault();
          openViewOrderModal(targetOrd);
        }
      }
    }
  });

  if (saveModalStatusBtn) {
    saveModalStatusBtn.addEventListener('click', () => {
      const targetOrd = ordersList.find(o => o.id === selectedOrderId);
      if (targetOrd && modalStatusSelect) {
        targetOrd.status = modalStatusSelect.value;
        saveStoredOrders(ordersList);
        if (typeof updateOrderStatusFirestore === 'function') updateOrderStatusFirestore(targetOrd.id, targetOrd.status);
        updateOrderKPIs();
        renderOrdersTable();
        populateOrderDetails(targetOrd);
        closeViewModal();
      }
    });
  }

  if (modalPrintInvoiceBtn) {
    modalPrintInvoiceBtn.addEventListener('click', () => {
      const targetOrd = ordersList.find(o => o.id === selectedOrderId);
      if (targetOrd) printInvoiceModal(targetOrd);
    });
  }

  // Edit Order Status Modal Controller
  const closeEditOrderModalBtn = document.getElementById('closeEditOrderModalBtn');
  const cancelEditOrderBtn = document.getElementById('cancelEditOrderBtn');
  const saveEditOrderBtn = document.getElementById('saveEditOrderBtn');
  const editModalOrderStatus = document.getElementById('editModalOrderStatus');
  const editModalPaymentStatus = document.getElementById('editModalPaymentStatus');

  const closeEditModal = () => {
    const editOrderModal = document.getElementById('editOrderModal');
    if (editOrderModal) {
      editOrderModal.classList.remove('active');
      editOrderModal.style.display = 'none';
    }
  };

  if (closeEditOrderModalBtn) closeEditOrderModalBtn.addEventListener('click', closeEditModal);
  if (cancelEditOrderBtn) cancelEditOrderBtn.addEventListener('click', closeEditModal);

  if (saveEditOrderBtn) {
    saveEditOrderBtn.addEventListener('click', () => {
      const targetOrd = ordersList.find(o => o.id === selectedOrderId);
      if (targetOrd) {
        if (editModalOrderStatus) targetOrd.status = editModalOrderStatus.value;
        if (editModalPaymentStatus) targetOrd.paymentStatus = editModalPaymentStatus.value;

        saveStoredOrders(ordersList);
        if (typeof updateOrderStatusFirestore === 'function') updateOrderStatusFirestore(targetOrd.id, targetOrd.status);
        updateOrderKPIs();
        renderOrdersTable();
        closeEditModal();
      }
    });
  }

  // Edit Customer Information Controller (Inside Order Details Drawer)
  const editCustomerInfoBtn = document.getElementById('editCustomerInfoBtn');
  const editCustomerModal = document.getElementById('editCustomerModal');
  const closeEditCustomerModalBtn = document.getElementById('closeEditCustomerModalBtn');
  const cancelEditCustomerBtn = document.getElementById('cancelEditCustomerBtn');
  const editCustomerForm = document.getElementById('editCustomerForm');

  const closeEditCustModal = () => {
    if (editCustomerModal) {
      editCustomerModal.classList.remove('active');
      editCustomerModal.style.display = 'none';
    }
  };

  if (closeEditCustomerModalBtn) closeEditCustomerModalBtn.addEventListener('click', closeEditCustModal);
  if (cancelEditCustomerBtn) cancelEditCustomerBtn.addEventListener('click', closeEditCustModal);

  if (editCustomerInfoBtn) {
    editCustomerInfoBtn.addEventListener('click', () => {
      const targetOrd = ordersList.find(o => o.id === selectedOrderId);
      if (targetOrd && editCustomerModal) {
        document.getElementById('editCustNameInput').value = targetOrd.name || '';
        document.getElementById('editCustPhoneInput').value = targetOrd.phone || '';
        document.getElementById('editCustEmailInput').value = targetOrd.email || '';
        document.getElementById('editCustAddressInput').value = targetOrd.address || '';

        editCustomerModal.classList.add('active');
        editCustomerModal.style.display = 'flex';
      }
    });
  }

  if (editCustomerForm) {
    editCustomerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const targetOrd = ordersList.find(o => o.id === selectedOrderId);
      if (targetOrd) {
        targetOrd.name = document.getElementById('editCustNameInput').value.trim();
        targetOrd.phone = document.getElementById('editCustPhoneInput').value.trim();
        targetOrd.email = document.getElementById('editCustEmailInput').value.trim();
        targetOrd.address = document.getElementById('editCustAddressInput').value.trim();

        saveStoredOrders(ordersList);
        if (typeof updateOrderFirestore === 'function') {
          updateOrderFirestore(targetOrd.id, targetOrd);
        }
        populateOrderDetails(targetOrd);
        renderOrdersTable();
        renderDashboardOverview();
        closeEditCustModal();
      }
    });
  }

  // Window click to close modals when clicking outside
  window.addEventListener('click', (e) => {
    const viewOrderModal = document.getElementById('viewOrderModal');
    const editOrderModal = document.getElementById('editOrderModal');
    const viewProductDetailsModal = document.getElementById('viewProductDetailsModal');
    if (e.target === viewOrderModal) closeViewModal();
    if (e.target === editOrderModal) closeEditModal();
    if (e.target === editCustomerModal) closeEditCustModal();
    if (e.target === viewProductDetailsModal) closeViewProdModal();
  });

  // Checkbox select all orders
  const selectAllOrders = document.getElementById('selectAllOrders');
  if (selectAllOrders) {
    selectAllOrders.addEventListener('change', (e) => {
      if (e.target.checked) {
        ordersList.forEach(o => selectedOrderIds.add(o.id));
      } else {
        selectedOrderIds.clear();
      }
      updateBulkActionsUI();
      renderOrdersTable();
    });
  }

  // 4. Products Catalog & Inventory Manager (Exact Match to Screenshot)
  const defaultProducts = [];

  function getStoredProducts() {
    const data = localStorage.getItem('blinjo_products_v3');
    if (!data) return [];
    const parsed = JSON.parse(data);
    const cleaned = parsed.filter(p => !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem('blinjo_products_v3', JSON.stringify(cleaned));
    }
    return cleaned;
  }

  function saveStoredProducts(prods) {
    const cleaned = (prods || []).filter(p => !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
    localStorage.setItem('blinjo_products_v3', JSON.stringify(cleaned));
    const activeProd = cleaned.find(p => p.active) || cleaned[0];
    if (activeProd) {
      localStorage.setItem('blinjo_active_product', JSON.stringify(activeProd));
      localStorage.setItem('blinjo_offer_price', activeProd.price);
      localStorage.setItem('blinjo_stock', activeProd.stock);
    } else {
      localStorage.removeItem('blinjo_active_product');
    }

    try {
      const prodBC = new BroadcastChannel('blinjo_products_channel');
      prodBC.postMessage({ type: 'PRODUCTS_UPDATED', prods: cleaned });
      prodBC.close();
    } catch(e) {}
    window.dispatchEvent(new CustomEvent('blinjo_products_updated', { detail: cleaned }));
  }

  let productsList = getStoredProducts();
  let currentProdPage = 1;
  const prodPageSize = 10;

  if (typeof syncProducts === 'function') {
    syncProducts((syncedProds) => {
      if (syncedProds) {
        productsList = syncedProds.filter(p => !['BLJ001','BLJ002','BLJ003','BLJ004','BLJ005','BLJ006','BLJ007','BLJ008'].includes(p.id));
        updateProductKPIs();
        renderProductsTable();
      }
    });
  }

  const productsTableBody = document.getElementById('productsTableBody');
  const kpiTotalProdVal = document.getElementById('kpiTotalProdVal');
  const kpiActiveProdVal = document.getElementById('kpiActiveProdVal');
  const kpiOutOfStockVal = document.getElementById('kpiOutOfStockVal');
  const kpiLowStockVal = document.getElementById('kpiLowStockVal');

  const prodSearchInput = document.getElementById('prodSearchInput');
  const filterProdCategory = document.getElementById('filterProdCategory');
  const filterProdStatus = document.getElementById('filterProdStatus');
  const filterStockStatus = document.getElementById('filterStockStatus');
  const resetProdFiltersBtn = document.getElementById('resetProdFiltersBtn');
  const applyProdFiltersBtn = document.getElementById('applyProdFiltersBtn');

  // Dynamic Products KPI calculation
  function updateProductKPIs() {
    const total = productsList.length;
    const active = productsList.filter(p => p.status === 'Active').length;
    const outOfStock = productsList.filter(p => p.stock === 0 || p.status === 'Out of Stock').length;
    const lowStock = productsList.filter(p => (p.stock > 0 && p.stock <= 20) || p.status === 'Low Stock').length;

    if (kpiTotalProdVal) kpiTotalProdVal.textContent = total;
    if (kpiActiveProdVal) kpiActiveProdVal.textContent = active;
    if (kpiOutOfStockVal) kpiOutOfStockVal.textContent = outOfStock;
    if (kpiLowStockVal) kpiLowStockVal.textContent = lowStock;
  }

  // Render Product Pagination
  function renderProdPagination(totalItems) {
    const prodPaginationControls = document.getElementById('prodPaginationControls');
    const prodPaginationInfo = document.getElementById('prodPaginationInfo');
    if (!prodPaginationControls) return;

    const totalPages = Math.ceil(totalItems / prodPageSize) || 1;
    if (currentProdPage > totalPages) currentProdPage = totalPages;

    const start = totalItems === 0 ? 0 : (currentProdPage - 1) * prodPageSize + 1;
    const end = Math.min(currentProdPage * prodPageSize, totalItems);

    if (prodPaginationInfo) {
      prodPaginationInfo.textContent = `Showing ${start} to ${end} of ${totalItems} products`;
    }

    let html = `<button class="page-btn prev-prod-page" ${currentProdPage === 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&lt;</button>`;

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      html += `<button class="page-btn ${i === currentProdPage ? 'active' : ''}" data-prodpage="${i}">${i}</button>`;
    }
    if (totalPages > 5) html += `<span>...</span><button class="page-btn" data-prodpage="${totalPages}">${totalPages}</button>`;

    html += `<button class="page-btn next-prod-page" ${currentProdPage === totalPages ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&gt;</button>`;
    prodPaginationControls.innerHTML = html;

    prodPaginationControls.querySelectorAll('.page-btn[data-prodpage]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentProdPage = parseInt(btn.getAttribute('data-prodpage'));
        renderProductsTable();
      });
    });

    const prev = prodPaginationControls.querySelector('.prev-prod-page');
    if (prev) prev.addEventListener('click', () => { if (currentProdPage > 1) { currentProdPage--; renderProductsTable(); } });

    const next = prodPaginationControls.querySelector('.next-prod-page');
    if (next) next.addEventListener('click', () => { if (currentProdPage < totalPages) { currentProdPage++; renderProductsTable(); } });
  }

  // Render Products Table
  function renderProductsTable() {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '';

    const query = prodSearchInput ? prodSearchInput.value.toLowerCase().trim() : '';
    const selectedCat = filterProdCategory ? filterProdCategory.value : 'all';
    const selectedStatus = filterProdStatus ? filterProdStatus.value : 'all';
    const selectedStock = filterStockStatus ? filterStockStatus.value : 'all';

    let filtered = productsList.filter(prod => {
      const matchQuery = !query || prod.title.toLowerCase().includes(query) || (prod.sku && prod.sku.toLowerCase().includes(query));
      const matchCat = (selectedCat === 'all') || (prod.category && prod.category.toLowerCase() === selectedCat.toLowerCase());
      const matchStatus = (selectedStatus === 'all') || (prod.status.toLowerCase() === selectedStatus.toLowerCase());
      
      let matchStock = true;
      if (selectedStock === 'In Stock') matchStock = prod.stock > 20;
      else if (selectedStock === 'Low Stock') matchStock = prod.stock > 0 && prod.stock <= 20;
      else if (selectedStock === 'Out of Stock') matchStock = prod.stock === 0;

      return matchQuery && matchCat && matchStatus && matchStock;
    });

    renderProdPagination(filtered.length);

    if (filtered.length === 0) {
      productsTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 28px; color: #9ca3af;">No products found matching filters.</td></tr>`;
      return;
    }

    const startIndex = (currentProdPage - 1) * prodPageSize;
    const pageProds = filtered.slice(startIndex, startIndex + prodPageSize);

    pageProds.forEach((prod, index) => {
      const tr = document.createElement('tr');
      const discountPct = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
      const rowNum = startIndex + index + 1;

      let statusBadge = `<span class="status-active-pill">🟢 Active</span>`;
      if (prod.status === 'Low Stock' || (prod.stock > 0 && prod.stock <= 20)) {
        statusBadge = `<span class="status-low-pill">🟡 Low Stock</span>`;
      } else if (prod.status === 'Out of Stock' || prod.stock === 0) {
        statusBadge = `<span class="status-out-pill">🔴 Out of Stock</span>`;
      }

      let stockColorClass = 'text-green';
      if (prod.stock === 0) stockColorClass = 'text-red';
      else if (prod.stock <= 20) stockColorClass = 'text-orange';

      tr.innerHTML = `
        <td><input type="checkbox" class="prod-select-chk"></td>
        <td><strong>${rowNum}</strong></td>
        <td>
          <strong>${prod.title}</strong>
          <small class="sku-text">${prod.sku || 'SKU: BLJ00' + rowNum}</small>
        </td>
        <td><img src="${prod.image}" alt="${prod.title}" class="prod-thumb-img"></td>
        <td><span style="font-size:12px; font-weight:600; color:#475569;">${prod.category || 'Home Decor'}</span></td>
        <td style="text-align:center;"><strong>₹${prod.price.toLocaleString('en-IN')}</strong></td>
        <td style="text-align:center;"><span style="text-decoration: line-through; color: #94a3b8; font-size: 12px;">₹${prod.mrp.toLocaleString('en-IN')}</span></td>
        <td style="text-align:center;"><span class="discount-pill-green">${discountPct}%</span></td>
        <td><span class="stock-num ${stockColorClass}">${prod.stock}</span></td>
        <td>${statusBadge}</td>
        <td style="text-align:center;">
          <div class="action-icon-group" style="justify-content: center; align-items: center;">
            <button class="btn-details-prod view-prod-btn" data-index="${rowNum - 1}" title="View Details">
              <span>📄</span> Details
            </button>
            <button class="icon-action-btn-danger delete-prod-btn" data-index="${rowNum - 1}" title="Delete Product">🗑️</button>
          </div>
        </td>
      `;
      productsTableBody.appendChild(tr);
    });

    // View Product Details listener
    document.querySelectorAll('.view-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const p = productsList[idx] || productsList[0];
        openViewProductDetailsModal(p);
      });
    });

    // Delete Product listener
    document.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const p = productsList[idx];
        if (p && confirm(`Are you sure you want to delete product "${p.title}"?`)) {
          productsList.splice(idx, 1);
          saveStoredProducts(productsList);
          if (typeof deleteProductFirestore === 'function') {
            deleteProductFirestore(p.id || p.sku || `PROD-${idx}`);
          }
          updateProductKPIs();
          renderProductsTable();
        }
      });
    });
  }

  // View Product Details Modal Controller
  const viewProductDetailsModal = document.getElementById('viewProductDetailsModal');
  const closeViewProductDetailsModalBtn = document.getElementById('closeViewProductDetailsModalBtn');
  const closeViewProdDetailsBtn = document.getElementById('closeViewProdDetailsBtn');
  const editFromViewProdBtn = document.getElementById('editFromViewProdBtn');
  let currentViewingProd = null;

  const closeViewProdModal = () => {
    if (viewProductDetailsModal) {
      viewProductDetailsModal.classList.remove('active');
      viewProductDetailsModal.style.display = 'none';
    }
  };

  if (closeViewProductDetailsModalBtn) closeViewProductDetailsModalBtn.addEventListener('click', closeViewProdModal);
  if (closeViewProdDetailsBtn) closeViewProdDetailsBtn.addEventListener('click', closeViewProdModal);

  function openViewProductDetailsModal(p) {
    if (!p || !viewProductDetailsModal) return;
    currentViewingProd = p;

    const discountPct = Math.round(((p.mrp - p.price) / p.mrp) * 100) || 0;

    const nameEl = document.getElementById('viewProdModalName');
    const titleEl = document.getElementById('viewProdModalTitle');
    const imgEl = document.getElementById('viewProdModalImg');
    const badgeEl = document.getElementById('viewProdModalBadge');
    const skuEl = document.getElementById('viewProdModalSku');
    const priceEl = document.getElementById('viewProdModalPrice');
    const mrpEl = document.getElementById('viewProdModalMrp');
    const discEl = document.getElementById('viewProdModalDiscount');
    const catEl = document.getElementById('viewProdModalCategory');
    const stockEl = document.getElementById('viewProdModalStock');
    const statusEl = document.getElementById('viewProdModalStatus');
    const descEl = document.getElementById('viewProdModalDesc');

    if (titleEl) titleEl.textContent = `Product Details - ${p.title}`;
    if (imgEl) imgEl.src = p.image || 'assets/bestseller.jpg';
    if (badgeEl) badgeEl.textContent = p.badge || '🔥 BESTSELLER';
    if (nameEl) nameEl.textContent = p.title;
    if (skuEl) skuEl.textContent = p.sku || `SKU: ${p.id}`;
    if (priceEl) priceEl.textContent = `₹${p.price.toLocaleString('en-IN')}`;
    if (mrpEl) mrpEl.textContent = `₹${p.mrp.toLocaleString('en-IN')}`;
    if (discEl) discEl.textContent = `${discountPct}% OFF`;
    if (catEl) catEl.textContent = p.category || 'Home Decor';
    if (stockEl) stockEl.textContent = `${p.stock} units`;
    if (statusEl) statusEl.textContent = p.status === 'Active' ? '🟢 Active' : (p.status === 'Low Stock' ? '🟡 Low Stock' : '🔴 Out of Stock');
    if (descEl) descEl.textContent = p.subtitle || 'Handcrafted premium quality decorative item.';

    viewProductDetailsModal.classList.add('active');
    viewProductDetailsModal.style.display = 'flex';
  }

  const editProductModal = document.getElementById('editProductModal');
  const editProductForm = document.getElementById('editProductForm');

  window.closeEditProductModal = function() {
    if (editProductModal) {
      editProductModal.classList.remove('active');
      editProductModal.style.display = 'none';
    }
  };

  window.openEditProductModal = function(p) {
    if (!p || !editProductModal) return;
    currentViewingProd = p;

    const idEl = document.getElementById('editProdId');
    const titleEl = document.getElementById('editProdTitle');
    const priceEl = document.getElementById('editProdPrice');
    const mrpEl = document.getElementById('editProdMrp');
    const stockEl = document.getElementById('editProdStock');
    const catEl = document.getElementById('editProdCategory');
    const statusEl = document.getElementById('editProdStatus');
    const imgEl = document.getElementById('editProdImage');
    const descEl = document.getElementById('editProdDesc');

    if (idEl) idEl.value = p.id || p.sku || '';
    if (titleEl) titleEl.value = p.title || '';
    if (priceEl) priceEl.value = p.price || 0;
    if (mrpEl) mrpEl.value = p.mrp || 0;
    if (stockEl) stockEl.value = p.stock !== undefined ? p.stock : 0;
    if (catEl) catEl.value = p.category || 'Home Decor';
    if (statusEl) statusEl.value = p.status || 'Active';
    if (imgEl) imgEl.value = p.image || '';
    if (descEl) descEl.value = p.subtitle || '';

    editProductModal.classList.add('active');
    editProductModal.style.display = 'flex';
  };

  if (editFromViewProdBtn) {
    editFromViewProdBtn.addEventListener('click', () => {
      if (currentViewingProd) {
        closeViewProdModal();
        openEditProductModal(currentViewingProd);
      }
    });
  }

  if (editProductForm) {
    editProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentViewingProd) return;

      const title = document.getElementById('editProdTitle').value.trim();
      const price = parseFloat(document.getElementById('editProdPrice').value) || 0;
      const mrp = parseFloat(document.getElementById('editProdMrp').value) || 0;
      const stock = parseInt(document.getElementById('editProdStock').value) || 0;
      const category = document.getElementById('editProdCategory').value;
      const status = document.getElementById('editProdStatus').value;
      const image = document.getElementById('editProdImage').value.trim();
      const desc = document.getElementById('editProdDesc').value.trim();

      currentViewingProd.title = title;
      currentViewingProd.price = price;
      currentViewingProd.mrp = mrp;
      currentViewingProd.stock = stock;
      currentViewingProd.category = category;
      currentViewingProd.status = status;
      if (image) currentViewingProd.image = image;
      currentViewingProd.subtitle = desc;

      saveStoredProducts(productsList);
      if (typeof addOrUpdateProductFirestore === 'function') {
        addOrUpdateProductFirestore(currentViewingProd);
      }
      updateProductKPIs();
      renderProductsTable();
      closeEditProductModal();
      if (typeof showAdminToast === 'function') {
        showAdminToast('✅ Product updated successfully!');
      }
    });
  }

  // Toolbar Event Listeners for Products
  if (prodSearchInput) prodSearchInput.addEventListener('input', () => { currentProdPage = 1; renderProductsTable(); });
  if (applyProdFiltersBtn) applyProdFiltersBtn.addEventListener('click', () => { currentProdPage = 1; renderProductsTable(); });
  if (resetProdFiltersBtn) {
    resetProdFiltersBtn.addEventListener('click', () => {
      if (prodSearchInput) prodSearchInput.value = '';
      if (filterProdCategory) filterProdCategory.value = 'all';
      if (filterProdStatus) filterProdStatus.value = 'all';
      if (filterStockStatus) filterStockStatus.value = 'all';
      currentProdPage = 1;
      renderProductsTable();
    });
  }

  // Add Product Modal & Dynamic Form Functionality
  const addProductModal = document.getElementById('addProductModal');
  const openAddProductBtn = document.getElementById('openAddProductBtn');
  const closeAddProductModal = document.getElementById('closeAddProductModal');
  const newProductForm = document.getElementById('newProductForm');

  const prodPriceInput = document.getElementById('prodPrice');
  const prodMrpInput = document.getElementById('prodMrp');
  const prodDiscountInput = document.getElementById('prodDiscount');
  const prodSubtitleText = document.getElementById('prodSubtitle');
  const descCharCount = document.getElementById('descCharCount');

  // Auto Calculate Discount Percentage
  function calcProdDiscount() {
    const price = parseFloat(prodPriceInput?.value) || 0;
    const mrp = parseFloat(prodMrpInput?.value) || 0;
    if (mrp > 0 && price > 0 && mrp > price) {
      const pct = Math.round(((mrp - price) / mrp) * 100);
      if (prodDiscountInput) prodDiscountInput.value = pct;
    } else {
      if (prodDiscountInput) prodDiscountInput.value = 0;
    }
  }

  if (prodPriceInput) prodPriceInput.addEventListener('input', calcProdDiscount);
  if (prodMrpInput) prodMrpInput.addEventListener('input', calcProdDiscount);

  // Description Character Counter
  if (prodSubtitleText && descCharCount) {
    prodSubtitleText.addEventListener('input', () => {
      descCharCount.textContent = prodSubtitleText.value.length;
    });
  }

  // Image Upload / Drag & Drop Handler
  const dropZoneBtn = document.getElementById('dropZoneBtn');
  const prodImgFileInput = document.getElementById('prodImgFileInput');
  const addMoreThumbBtn = document.getElementById('addMoreThumbBtn');

  function handleUploadedFiles(files) {
    Array.from(files).forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const grid = document.getElementById('imagePreviewGrid');
          if (grid && addMoreThumbBtn) {
            const div = document.createElement('div');
            div.className = 'preview-thumb-box';
            div.innerHTML = `<img src="${event.target.result}" alt="Uploaded"><button type="button" class="remove-thumb-btn">&times;</button>`;
            div.querySelector('.remove-thumb-btn').addEventListener('click', () => div.remove());
            grid.insertBefore(div, addMoreThumbBtn);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (dropZoneBtn && prodImgFileInput) {
    dropZoneBtn.addEventListener('click', () => prodImgFileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZoneBtn.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZoneBtn.addEventListener(eventName, () => {
        dropZoneBtn.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZoneBtn.addEventListener(eventName, () => {
        dropZoneBtn.classList.remove('drag-over');
      }, false);
    });

    dropZoneBtn.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleUploadedFiles(dt.files);
      }
    }, false);
  }

  if (addMoreThumbBtn && prodImgFileInput) {
    addMoreThumbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prodImgFileInput.click();
    });
  }

  // Remove Thumbnail Buttons
  document.querySelectorAll('.remove-thumb-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.parentElement.remove();
    });
  });

  if (prodImgFileInput) {
    prodImgFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUploadedFiles(e.target.files);
      }
    });
  }

  if (openAddProductBtn) {
    openAddProductBtn.addEventListener('click', () => {
      if (addProductModal) {
        addProductModal.classList.add('active');
        addProductModal.style.display = 'flex';
      }
    });
  }
  if (closeAddProductModal) {
    closeAddProductModal.addEventListener('click', () => {
      if (addProductModal) {
        addProductModal.classList.remove('active');
        addProductModal.style.display = 'none';
      }
    });
  }

  if (newProductForm) {
    newProductForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('prodTitle').value;
      const subtitle = document.getElementById('prodSubtitle').value;
      const price = parseFloat(document.getElementById('prodPrice').value) || 0;
      const mrp = parseFloat(document.getElementById('prodMrp').value) || price * 2;
      const stock = parseInt(document.getElementById('prodStock').value) || 10;
      const status = document.getElementById('prodStatus')?.value || 'Active';

      // Pick first preview image or fallback asset
      const firstImg = document.querySelector('#imagePreviewGrid .preview-thumb-box img')?.src || 'assets/bestseller.jpg';

      const newProd = {
        id: 'PROD-' + Math.floor(100 + Math.random() * 900),
        title: title,
        subtitle: subtitle,
        price: price,
        mrp: mrp,
        stock: stock,
        status: status,
        badge: status === 'Active' ? '🔥 BESTSELLER' : 'NEW',
        image: firstImg,
        active: true
      };

      productsList.forEach(p => p.active = false);
      productsList.push(newProd);

      saveStoredProducts(productsList);
      if (typeof addOrUpdateProductFirestore === 'function') addOrUpdateProductFirestore(newProd);
      renderProductsTable();

      alert(`🎉 Product "${title}" saved successfully & published to live store!`);
      addProductModal.classList.remove('active');
      newProductForm.reset();
      if (descCharCount) descCharCount.textContent = '0';
    });
  }

  // 5. Stock & Price Form Configuration
  const priceConfigForm = document.getElementById('priceConfigForm');
  const updateQuickStockBtn = document.getElementById('updateQuickStockBtn');
  const quickStockInput = document.getElementById('quickStockInput');
  const dashStockVal = document.getElementById('dashStockVal');

  if (priceConfigForm) {
    priceConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPrice = parseInt(document.getElementById('cfgCurrentPrice').value);
      const newMrp = parseInt(document.getElementById('cfgOriginalPrice').value);
      const newStock = parseInt(document.getElementById('cfgStock').value);
      
      const activeProd = productsList.find(p => p.active) || productsList[0];
      if (activeProd) {
        activeProd.price = newPrice;
        activeProd.mrp = newMrp;
        activeProd.stock = newStock;
        saveStoredProducts(productsList);
        renderProductsTable();
      }

      if (dashStockVal) dashStockVal.textContent = `${newStock} Units`;
      alert('✅ Active product settings saved! Storefront updated.');
    });
  }

  if (updateQuickStockBtn) {
    updateQuickStockBtn.addEventListener('click', () => {
      const val = parseInt(quickStockInput.value);
      const activeProd = productsList.find(p => p.active) || productsList[0];
      if (activeProd) {
        activeProd.stock = val;
        saveStoredProducts(productsList);
        renderProductsTable();
      }
      if (dashStockVal) dashStockVal.textContent = `${val} Units`;
      alert(`✅ Stock level updated to ${val} units.`);
    });
  }

  // 6. CSV Export Feature
  const exportOrdersBtn = document.getElementById('exportOrdersBtn');
  if (exportOrdersBtn) {
    exportOrdersBtn.addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer Name,Phone,City,Payment Method,Amount,Qty,Date,Status\n";
      ordersList.forEach(o => {
        csvContent += `${o.id},"${o.name}",${o.phone},${o.city},${o.method},${o.amount},${o.qty},${o.date},${o.status}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Blinjo_Orders_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // 7. Lock Panel Action
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      const code = prompt('Enter Admin Passcode to unlock (Default: 123456):');
      if (code === '123456') {
        alert('Panel unlocked!');
      } else {
        alert('Invalid Passcode!');
      }
    });
  }

  // 8. Add New Review Modal Controller (Exact Match to Screenshot)
  const addReviewModal = document.getElementById('addReviewModal');
  const openAddReviewBtn = document.getElementById('openAddReviewBtn');
  const closeReviewModal = document.getElementById('closeReviewModal');
  const cancelReviewModalBtn = document.getElementById('cancelReviewModalBtn');
  const newReviewForm = document.getElementById('newReviewForm');
  const revCommentText = document.getElementById('revCommentText');
  const revCharCount = document.getElementById('revCharCount');
  const starPicker = document.getElementById('starPicker');
  const ratingNum = document.getElementById('ratingNum');
  const revRatingVal = document.getElementById('revRatingVal');
  const addRevImageBtn = document.getElementById('addRevImageBtn');
  const revImgFileInput = document.getElementById('revImgFileInput');
  const revImagePreviewGrid = document.getElementById('revImagePreviewGrid');

  // Open Modal
  if (openAddReviewBtn && addReviewModal) {
    openAddReviewBtn.addEventListener('click', () => {
      addReviewModal.classList.add('active');
      addReviewModal.style.display = 'flex';
    });
  }

  // Close Modal
  const closeRevModal = () => {
    if (addReviewModal) {
      addReviewModal.classList.remove('active');
      addReviewModal.style.display = 'none';
    }
  };

  if (closeReviewModal) closeReviewModal.addEventListener('click', closeRevModal);
  if (cancelReviewModalBtn) cancelReviewModalBtn.addEventListener('click', closeRevModal);

  window.addEventListener('click', (e) => {
    if (e.target === addReviewModal) closeRevModal();
  });

  // Star Rating Interactive Picker
  if (starPicker) {
    const stars = starPicker.querySelectorAll('.star-item');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating')) || 5;
        if (revRatingVal) revRatingVal.value = rating;
        if (ratingNum) ratingNum.textContent = rating;

        stars.forEach((s, idx) => {
          if (idx < rating) s.classList.add('active');
          else s.classList.remove('active');
        });
      });
    });
  }

  // Short Description Character Counter
  if (revCommentText && revCharCount) {
    revCommentText.addEventListener('input', () => {
      revCharCount.textContent = revCommentText.value.length;
    });
  }

  // Image Upload / Add Image Handler
  if (addRevImageBtn && revImgFileInput) {
    addRevImageBtn.addEventListener('click', () => revImgFileInput.click());
  }

  if (revImgFileInput) {
    revImgFileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (revImagePreviewGrid && addRevImageBtn) {
            const div = document.createElement('div');
            div.className = 'preview-thumb-box';
            div.innerHTML = `<img src="${event.target.result}" alt="Review Upload"><button type="button" class="remove-thumb-btn">&times;</button>`;
            div.querySelector('.remove-thumb-btn').addEventListener('click', () => div.remove());
            revImagePreviewGrid.insertBefore(div, addRevImageBtn);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Form Submission
  if (newReviewForm) {
    newReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const custName = document.getElementById('revCustName')?.value || 'Anonymous Customer';
      const comment = revCommentText?.value || '';
      const rating = revRatingVal?.value || 5;

      alert(`🎉 Customer review from "${custName}" (${rating}/5 Stars) published successfully!`);
      closeRevModal();
      newReviewForm.reset();
      if (revCharCount) revCharCount.textContent = '0';
    });
  }

  // Dynamic Dashboard Overview Renderer
  function renderDashboardOverview() {
    // 1. Update KPI Values
    const totalOrdersVal = document.getElementById('dashTotalOrdersVal');
    const totalSalesVal = document.getElementById('dashTotalSalesVal');
    const totalCustVal = document.getElementById('dashTotalCustVal');
    const totalProdVal = document.getElementById('dashTotalProdVal');

    const totalOrdersCount = ordersList.length;
    let totalSalesSum = ordersList.reduce((acc, o) => acc + (o.amount || 0), 0);
    if (totalSalesSum === 0) totalSalesSum = 124580;

    if (totalOrdersVal) totalOrdersVal.textContent = totalOrdersCount.toLocaleString('en-IN');
    if (totalSalesVal) totalSalesVal.textContent = `₹${totalSalesSum.toLocaleString('en-IN')}`;
    if (totalCustVal) totalCustVal.textContent = '96';
    if (totalProdVal) totalProdVal.textContent = productsList.length ? productsList.length.toString() : '248';

    // 2. Recent Orders Mini List
    const dashRecentOrdersList = document.getElementById('dashRecentOrdersList');
    if (dashRecentOrdersList) {
      const recent = ordersList.slice(0, 5);
      dashRecentOrdersList.innerHTML = recent.map((ord) => `
        <div class="recent-ord-row" style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${ord.products && ord.products[0]?.img ? ord.products[0].img : 'assets/bestseller.jpg'}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;">
            <div>
              <strong style="font-size:13px; color:#0f172a; display:block;">${ord.name}</strong>
              <small style="color:#64748b; font-size:11px;">1 item • ${ord.date || '01 Oct'}, ${ord.time || '10:45 AM'}</small>
            </div>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:13px; color:#0f172a; display:block;">₹${(ord.amount || 1249).toLocaleString('en-IN')}</strong>
            <span class="status-badge-pill status-${(ord.status || 'Delivered').toLowerCase()}-pill" style="font-size:10px; padding:2px 8px; border-radius:6px;">${ord.status || 'Delivered'}</span>
          </div>
        </div>
      `).join('');
    }

    // 3. Top Selling Products Table Body
    const dashTopSellingBody = document.getElementById('dashTopSellingBody');
    if (dashTopSellingBody) {
      const topProds = [
        { num: 1, name: 'Brass Urli Bowl', sold: 45, rev: 26955, img: 'assets/bestseller.jpg' },
        { num: 2, name: 'Floating Flowers Set', sold: 38, rev: 5700, img: 'assets/cat_3.jpg' },
        { num: 3, name: 'LED Floating Diya', sold: 32, rev: 11200, img: 'assets/thumb_3.jpg' },
        { num: 4, name: 'Pooja Decoration Set', sold: 28, rev: 25172, img: 'assets/hero_banner.jpg' },
        { num: 5, name: 'Copper Water Fountain', sold: 20, rev: 25980, img: 'assets/cat_2.jpg' }
      ];
      dashTopSellingBody.innerHTML = topProds.map(p => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-weight:700; color:#64748b; padding:8px 0;">${p.num}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="${p.img}" style="width:28px; height:28px; border-radius:6px; object-fit:cover;">
              <strong style="font-size:12px; color:#0f172a;">${p.name}</strong>
            </div>
          </td>
          <td style="font-weight:600; color:#334155;">${p.sold}</td>
          <td style="text-align:right; font-weight:700; color:#0f172a;">₹${p.rev.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    }

    // 4. Low Stock Products Table Body
    const dashLowStockBody = document.getElementById('dashLowStockBody');
    if (dashLowStockBody) {
      const lowStockProds = [
        { name: 'Copper Water Fountain', stock: 5, img: 'assets/cat_2.jpg' },
        { name: 'LED Floating Diya', stock: 8, img: 'assets/thumb_3.jpg' },
        { name: 'Brass Urli Bowl', stock: 10, img: 'assets/bestseller.jpg' },
        { name: 'Decorative Urli Stand', stock: 12, img: 'assets/thumb_2.jpg' },
        { name: 'Aromatic Candle Set', stock: 15, img: 'assets/cat_1.jpg' }
      ];
      dashLowStockBody.innerHTML = lowStockProds.map(p => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td>
            <div style="display:flex; align-items:center; gap:8px; padding:6px 0;">
              <img src="${p.img}" style="width:28px; height:28px; border-radius:6px; object-fit:cover;">
              <strong style="font-size:12px; color:#0f172a;">${p.name}</strong>
            </div>
          </td>
          <td style="text-align:center;"><span style="color:#ef4444; font-weight:800; font-size:12px;">${p.stock}</span></td>
          <td style="text-align:right;">
            <button class="btn-restock-sm" onclick="alert('⚡ Restock request initiated for ${p.name}!')">Restock</button>
          </td>
        </tr>
      `).join('');
    }

    // 5. Top Customers Table Body
    const dashTopCustBody = document.getElementById('dashTopCustBody');
    if (dashTopCustBody) {
      const topCusts = [
        { num: 1, name: 'Rahul Sharma', orders: 12, spent: 8450 },
        { num: 2, name: 'Priya Patil', orders: 9, spent: 6320 },
        { num: 3, name: 'Amit Mehta', orders: 8, spent: 5899 },
        { num: 4, name: 'Neha Kulkarni', orders: 7, spent: 4750 },
        { num: 5, name: 'Sagar Deshmukh', orders: 6, spent: 3990 }
      ];
      dashTopCustBody.innerHTML = topCusts.map(c => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="font-weight:700; color:#64748b; padding:8px 0;">${c.num}</td>
          <td style="font-weight:600; color:#0f172a;">${c.name}</td>
          <td style="text-align:center; font-weight:600;">${c.orders}</td>
          <td style="text-align:right; font-weight:700; color:#0f172a;">₹${c.spent.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    }

    // 6. Recent Reviews Mini List
    const dashRecentRevList = document.getElementById('dashRecentRevList');
    if (dashRecentRevList) {
      dashRecentRevList.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:10px; padding:6px 0; border-bottom:1px solid #f1f5f9;">
          <img src="assets/cat_2.jpg" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:12px; color:#0f172a;">Priya Patil</strong>
              <small style="color:#64748b; font-size:10px;">2 days ago</small>
            </div>
            <div style="color:#eab308; font-size:11px;">★★★★★</div>
            <p style="margin:2px 0 0 0; font-size:11px; color:#475569; line-height:1.3;">Very beautiful and premium quality. Looks amazing in my home.</p>
          </div>
        </div>
        <div style="display:flex; align-items:flex-start; gap:10px; padding:6px 0;">
          <img src="assets/cat_1.jpg" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:12px; color:#0f172a;">Rahul Sharma</strong>
              <small style="color:#64748b; font-size:10px;">3 days ago</small>
            </div>
            <div style="color:#eab308; font-size:11px;">★★★★★</div>
            <p style="margin:2px 0 0 0; font-size:11px; color:#475569; line-height:1.3;">Perfect for decoration. Good quality and fast delivery.</p>
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // SLIDESHOW & BANNER MANAGEMENT MODULE (Media Only)
  // ==========================================
  const defaultSlides = [];

  function getSlidesData() {
    const saved = localStorage.getItem('blinjo_slideshow_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return [];
  }

  function saveSlidesData(slides) {
    localStorage.setItem('blinjo_slideshow_v2', JSON.stringify(slides));
    try {
      const bc = new BroadcastChannel('blinjo_slideshow_channel');
      bc.postMessage({ type: 'SLIDESHOW_UPDATED', slides: slides });
      bc.close();
    } catch(e) {}
    window.dispatchEvent(new CustomEvent('blinjo_slideshow_updated', { detail: slides }));
    renderSlideshowManager();
  }

  function renderSlideshowManager() {
    const container = document.getElementById('slidesListContainer');
    const kpiTotalSlides = document.getElementById('kpiTotalSlides');
    const kpiActiveSlides = document.getElementById('kpiActiveSlides');
    if (!container) return;

    const slides = getSlidesData();
    const activeCount = slides.filter(s => s.active).length;

    if (kpiTotalSlides) kpiTotalSlides.textContent = slides.length;
    if (kpiActiveSlides) kpiActiveSlides.textContent = `${activeCount} Active`;

    container.innerHTML = '';

    if (slides.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:#ffffff; border-radius:16px; border:1px dashed #cbd5e1;">
          <p style="color:#64748b; font-size:15px; font-weight:600; margin:0 0 14px 0;">No slides added yet. Click "+ Add Slide" to upload slide images or videos.</p>
          <button type="button" onclick="window.openSlideModal(null)" style="background:#047857; color:#ffffff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; cursor:pointer;">+ Add New Slide</button>
        </div>
      `;
      return;
    }
    const activeCount = slides.filter(s => s.active).length;

    if (kpiTotalSlides) kpiTotalSlides.textContent = slides.length;
    if (kpiActiveSlides) kpiActiveSlides.textContent = `${activeCount} Active`;

    container.innerHTML = '';

    slides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-management-card';
      card.style.cssText = `
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      const isVideo = slide.mediaType === 'video' || (slide.image && slide.image.endsWith('.mp4'));
      const mediaPreview = isVideo
        ? `<video src="${slide.image}" autoplay loop muted style="width:100%; height:100%; object-fit:cover;"></video>`
        : `<img src="${slide.image}" alt="Slide #${index+1}" style="width:100%; height:100%; object-fit:cover;">`;

      card.innerHTML = `
        <div style="position:relative; width:100%; height:200px; background:#0f172a; overflow:hidden;">
          ${mediaPreview}
          <span style="position:absolute; top:12px; left:12px; background:#047857; color:#ffffff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">
            ${isVideo ? '🎥 VIDEO' : '🖼️ IMAGE'}
          </span>
          <span style="position:absolute; top:12px; right:12px; background:${slide.active ? '#10b981' : '#64748b'}; color:#ffffff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:12px;">
            ${slide.active ? '🟢 Active' : '⚪ Inactive'}
          </span>
          <span style="position:absolute; bottom:12px; left:12px; background:rgba(15,23,42,0.8); color:#ffffff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; backdrop-filter:blur(4px);">
            Slide #${index + 1}
          </span>
        </div>

        <div style="padding:14px 16px; background:#ffffff; display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <button type="button" class="btn-toggle-slide" data-id="${slide.id}" style="border:1px solid #cbd5e1; background:#f8fafc; color:#334155; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer;">
            ${slide.active ? 'Disable' : 'Enable'}
          </button>
          
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn-edit-slide" data-id="${slide.id}" style="border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer;">✏️ Edit</button>
            <button type="button" class="btn-delete-slide" data-id="${slide.id}" style="border:none; background:#fee2e2; color:#ef4444; padding:8px 12px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer;">🗑️ Delete</button>
          </div>
        </div>
      `;

      // Button Handlers
      card.querySelector('.btn-toggle-slide').addEventListener('click', () => {
        slide.active = !slide.active;
        saveSlidesData(slides);
        if (typeof saveSlideFirestore === 'function') saveSlideFirestore(slide);
      });

      card.querySelector('.btn-edit-slide').addEventListener('click', () => {
        openSlideModal(slide);
      });

      card.querySelector('.btn-delete-slide').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetId = slide.id;
        const slidesNow = getSlidesData();
        const updated = slidesNow.filter(s => s.id !== targetId);
        saveSlidesData(updated);
        if (typeof deleteSlideFirestore === 'function') deleteSlideFirestore(targetId);
        if (typeof showAdminOrderToast === 'function') {
          showAdminOrderToast(`🗑️ Slide #${index + 1} deleted successfully!`);
        }
      });

      container.appendChild(card);
    });
  }

  // Slide Modal Event Handlers
  const addSlideModal = document.getElementById('addSlideModal');
  const openAddSlideBtn = document.getElementById('openAddSlideBtn');
  const closeSlideModalBtn = document.getElementById('closeSlideModalBtn');
  const cancelSlideModalBtn = document.getElementById('cancelSlideModalBtn');
  const slideForm = document.getElementById('slideForm');
  const slideFileInput = document.getElementById('slideFileInput');

  window.openSlideModal = function(slide = null) {
    const addSlideModal = document.getElementById('addSlideModal');
    if (!addSlideModal) return;
    const modalTitle = document.getElementById('slideModalTitle');
    const editId = document.getElementById('slideEditId');
    const imgInput = document.getElementById('slideImgInput');
    const activeCheckbox = document.getElementById('slideActiveCheckbox');
    const mediaTypeImg = document.getElementById('mediaTypeImg');
    const mediaTypeVideo = document.getElementById('mediaTypeVideo');

    if (slide) {
      if (modalTitle) modalTitle.textContent = 'Edit Slide Media';
      if (editId) editId.value = slide.id;
      if (imgInput) imgInput.value = slide.image;
      if (activeCheckbox) activeCheckbox.checked = slide.active;
      const isVid = slide.mediaType === 'video' || (slide.image && slide.image.endsWith('.mp4'));
      if (isVid && mediaTypeVideo) mediaTypeVideo.checked = true;
      else if (mediaTypeImg) mediaTypeImg.checked = true;
    } else {
      if (modalTitle) modalTitle.textContent = 'Add Slide Image or Video';
      if (editId) editId.value = '';
      if (imgInput) imgInput.value = 'assets/hero_banner.jpg';
      if (activeCheckbox) activeCheckbox.checked = true;
      if (mediaTypeImg) mediaTypeImg.checked = true;
    }

    if (addSlideModal.parentElement !== document.body) {
      document.body.appendChild(addSlideModal);
    }
    addSlideModal.classList.add('active');
    addSlideModal.style.display = 'flex';
  };

  window.closeSlideModal = function() {
    const addSlideModal = document.getElementById('addSlideModal');
    if (addSlideModal) {
      addSlideModal.classList.remove('active');
      addSlideModal.style.display = 'none';
    }
  };

  if (openAddSlideBtn) openAddSlideBtn.addEventListener('click', () => window.openSlideModal(null));
  if (closeSlideModalBtn) closeSlideModalBtn.addEventListener('click', window.closeSlideModal);
  if (cancelSlideModalBtn) cancelSlideModalBtn.addEventListener('click', window.closeSlideModal);
  if (addSlideModal) {
    addSlideModal.addEventListener('click', (e) => {
      if (e.target === addSlideModal) window.closeSlideModal();
    });
  }

  // Handle local file upload (Convert to DataURL / Preview)
  if (slideFileInput) {
    slideFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        const imgInput = document.getElementById('slideImgInput');
        if (imgInput) imgInput.value = dataUrl;

        const isVid = file.type.startsWith('video');
        const mediaTypeVideo = document.getElementById('mediaTypeVideo');
        const mediaTypeImg = document.getElementById('mediaTypeImg');
        if (isVid && mediaTypeVideo) mediaTypeVideo.checked = true;
        else if (mediaTypeImg) mediaTypeImg.checked = true;
      };
      reader.readAsDataURL(file);
    });
  }

  // Preset media selector buttons
  const presetImgBtns = document.querySelectorAll('.preset-img-btn');
  presetImgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const imgPath = btn.getAttribute('data-img');
      const dataType = btn.getAttribute('data-type');
      const imgInput = document.getElementById('slideImgInput');
      if (imgInput && imgPath) imgInput.value = imgPath;

      const mediaTypeVideo = document.getElementById('mediaTypeVideo');
      const mediaTypeImg = document.getElementById('mediaTypeImg');
      if (dataType === 'video' && mediaTypeVideo) mediaTypeVideo.checked = true;
      else if (mediaTypeImg) mediaTypeImg.checked = true;
    });
  });

  if (slideForm) {
    slideForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const slides = getSlidesData();
      const editId = document.getElementById('slideEditId')?.value;
      const image = document.getElementById('slideImgInput')?.value.trim() || 'assets/hero_banner.jpg';
      const active = document.getElementById('slideActiveCheckbox')?.checked ?? true;
      const selectedMediaType = document.querySelector('input[name="slideMediaType"]:checked')?.value || 'image';

      let slideData = null;
      if (editId) {
        // Edit existing slide
        const index = slides.findIndex(s => s.id === editId);
        if (index !== -1) {
          slides[index] = { ...slides[index], image, active, mediaType: selectedMediaType };
          slideData = slides[index];
        }
      } else {
        // Add new slide
        slideData = {
          id: 'SLD-' + Math.floor(100 + Math.random() * 900),
          image,
          active,
          mediaType: selectedMediaType
        };
        slides.unshift(slideData);
      }

      saveSlidesData(slides);
      if (slideData && typeof saveSlideFirestore === 'function') saveSlideFirestore(slideData);
      closeSlideModal();
    });
  }

  // ==========================================
  // PERFECT FOR EVERY OCCASION BANNERS MODULE
  // ==========================================
  const defaultOccasions = [
    { id: 'OCC-1', title: 'Living Room Decor', image: 'assets/cat_1.jpg', active: true },
    { id: 'OCC-2', title: 'Pooja Room', image: 'assets/cat_2.jpg', active: true },
    { id: 'OCC-3', title: 'Diwali & Festivals', image: 'assets/cat_3.jpg', active: true },
    { id: 'OCC-4', title: 'Wedding Decoration', image: 'assets/cat_4.jpg', active: true },
    { id: 'OCC-5', title: 'Entrance Decor', image: 'assets/cat_5.jpg', active: true },
    { id: 'OCC-6', title: 'Perfect Gift', image: 'assets/cat_6.jpg', active: true }
  ];

  function getOccasionsData() {
    const saved = localStorage.getItem('blinjo_occasions_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    localStorage.setItem('blinjo_occasions_v1', JSON.stringify(defaultOccasions));
    return defaultOccasions;
  }

  function saveOccasionsData(occasions) {
    localStorage.setItem('blinjo_occasions_v1', JSON.stringify(occasions));
    renderOccasionsManager();
  }

  function renderOccasionsManager() {
    const container = document.getElementById('occasionCardsContainer');
    if (!container) return;

    const occasions = getOccasionsData();
    container.innerHTML = '';

    occasions.forEach((occ, index) => {
      const card = document.createElement('div');
      card.className = 'occasion-management-card';
      card.style.cssText = `
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      card.innerHTML = `
        <div style="position:relative; width:100%; height:160px; background:#f8fafc; overflow:hidden;">
          <img src="${occ.image}" alt="${occ.title}" style="width:100%; height:100%; object-fit:cover;">
          <span style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:#ffffff; color:#0f172a; font-size:12px; font-weight:800; padding:6px 14px; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap;">
            ${occ.title}
          </span>
          <span style="position:absolute; top:8px; right:8px; background:rgba(15,23,42,0.75); color:#ffffff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">
            Card #${index + 1}
          </span>
        </div>

        <div style="padding:12px 14px; background:#ffffff; display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <strong style="font-size:13px; font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${occ.title}</strong>
          <button type="button" class="btn-edit-occ" data-id="${occ.id}" style="border:1px solid #cbd5e1; background:#ffffff; color:#047857; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; flex-shrink:0;">✏️ Edit</button>
        </div>
      `;

      card.querySelector('.btn-edit-occ').addEventListener('click', () => {
        openOccasionModal(occ);
      });

      container.appendChild(card);
    });
  }

  // Occasion Modal Handlers
  const editOccasionModal = document.getElementById('editOccasionModal');
  const occasionForm = document.getElementById('occasionForm');
  const occFileInput = document.getElementById('occFileInput');

  window.openOccasionModal = function(occ) {
    if (!editOccasionModal || !occ) return;
    const occEditId = document.getElementById('occEditId');
    const occTitleInput = document.getElementById('occTitleInput');
    const occImgInput = document.getElementById('occImgInput');

    if (occEditId) occEditId.value = occ.id;
    if (occTitleInput) occTitleInput.value = occ.title;
    if (occImgInput) occImgInput.value = occ.image;

    if (editOccasionModal.parentElement !== document.body) {
      document.body.appendChild(editOccasionModal);
    }
    editOccasionModal.classList.add('active');
    editOccasionModal.style.display = 'flex';
  };

  window.closeOccasionModal = function() {
    if (editOccasionModal) {
      editOccasionModal.classList.remove('active');
      editOccasionModal.style.display = 'none';
    }
  };

  if (editOccasionModal) {
    editOccasionModal.addEventListener('click', (e) => {
      if (e.target === editOccasionModal) window.closeOccasionModal();
    });
  }

  if (occFileInput) {
    occFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        const occImgInput = document.getElementById('occImgInput');
        if (occImgInput) occImgInput.value = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const presetOccBtns = document.querySelectorAll('.preset-occ-btn');
  presetOccBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const imgPath = btn.getAttribute('data-img');
      const occImgInput = document.getElementById('occImgInput');
      if (occImgInput && imgPath) occImgInput.value = imgPath;
    });
  });

  if (occasionForm) {
    occasionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const occasions = getOccasionsData();
      const editId = document.getElementById('occEditId')?.value;
      const title = document.getElementById('occTitleInput')?.value.trim();
      const image = document.getElementById('occImgInput')?.value.trim();

      const index = occasions.findIndex(o => o.id === editId);
      if (index !== -1) {
        occasions[index] = { ...occasions[index], title, image };
        saveOccasionsData(occasions);
        if (typeof saveOccasionFirestore === 'function') saveOccasionFirestore(occasions[index]);
      }
      closeOccasionModal();
    });
  }

  // Initialize Realtime Sync for Slideshow & Occasions
  if (typeof syncSlideshow === 'function') {
    syncSlideshow(() => renderSlideshowManager());
  }
  if (typeof syncOccasions === 'function') {
    syncOccasions(() => renderOccasionsManager());
  }
  if (typeof syncReviews === 'function') {
    syncReviews(() => renderDashboardOverview());
  }

  // Connection Status Badge Indicator
  const badge = document.getElementById('firestoreStatusBadge');
  if (badge && typeof checkFirestoreActive === 'function') {
    if (checkFirestoreActive()) {
      badge.innerHTML = `<span style="width:8px; height:8px; background:#22c55e; border-radius:50%; display:inline-block; box-shadow:0 0 8px #22c55e;"></span> 🔥 Firestore Live`;
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.borderColor = '#86efac';
    } else {
      badge.innerHTML = `<span style="width:8px; height:8px; background:#eab308; border-radius:50%; display:inline-block;"></span> ⚡ Offline Cache`;
      badge.style.background = '#fef3c7';
      badge.style.color = '#92400e';
      badge.style.borderColor = '#fde68a';
    }
  }

  // ==========================================================================
  // ALL BUTTONS ACTIVE INTERACTIVE HANDLERS
  // ==========================================================================

  // Header Logo Click -> Return to Overview
  const adminLogo = document.querySelector('.admin-logo');
  if (adminLogo) {
    adminLogo.style.cursor = 'pointer';
    adminLogo.addEventListener('click', () => {
      const overviewTab = document.querySelector('[data-tab="tab-overview"]');
      if (overviewTab) overviewTab.click();
    });
  }

  // Top Global Search Input Handler
  const dashGlobalSearch = document.getElementById('dashGlobalSearch');
  if (dashGlobalSearch) {
    dashGlobalSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const searchOrderInput = document.getElementById('searchOrderInput');
      if (searchOrderInput) {
        searchOrderInput.value = query;
        renderOrdersTable();
      }
    });
  }

  // Date Range Picker Modal
  const dashDatePicker = document.getElementById('dashDatePicker');
  if (dashDatePicker) {
    dashDatePicker.style.cursor = 'pointer';
    dashDatePicker.addEventListener('click', () => {
      showAdminDatePickerModal();
    });
  }

  function showAdminDatePickerModal() {
    let modal = document.getElementById('datePickerModalOverlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'datePickerModalOverlay';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; animation: fadeIn 0.2s ease;
      `;
      modal.innerHTML = `
        <div style="background: #ffffff; width: 90%; max-width: 420px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">📅 Select Date Range</h3>
            <button id="closeDatePickerBtn" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b;">&times;</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <button class="date-opt-btn" data-range="01 Oct 2026 - 01 Oct 2026" style="padding: 10px 14px; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; border-radius: 8px; font-weight: 700; text-align: left; cursor: pointer;">Today (01 Oct 2026)</button>
            <button class="date-opt-btn" data-range="25 Sep 2026 - 01 Oct 2026" style="padding: 10px 14px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 700; text-align: left; cursor: pointer;">Last 7 Days</button>
            <button class="date-opt-btn" data-range="01 Sep 2026 - 01 Oct 2026" style="padding: 10px 14px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 700; text-align: left; cursor: pointer;">Last 30 Days</button>
            <button class="date-opt-btn" data-range="01 Jan 2026 - 01 Oct 2026" style="padding: 10px 14px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 700; text-align: left; cursor: pointer;">Year to Date (2026)</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      modal.querySelector('#closeDatePickerBtn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
      
      modal.querySelectorAll('.date-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const rangeText = btn.getAttribute('data-range');
          const pickerSpan = dashDatePicker.querySelector('span:first-child');
          if (pickerSpan) pickerSpan.textContent = '📅 ' + rangeText;
          showAdminOrderToast(`Date Range Updated: ${rangeText}`);
          modal.remove();
        });
      });
    } else {
      modal.style.display = 'flex';
    }
  }

  // Notification Bell Dropdown
  const dashNotifBell = document.querySelector('.dash-notif-bell');
  if (dashNotifBell) {
    dashNotifBell.style.position = 'relative';
    dashNotifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAdminNotifDropdown();
    });
  }

  function toggleAdminNotifDropdown() {
    let dropdown = document.getElementById('notifDropdownMenu');
    if (dropdown) {
      dropdown.remove();
      return;
    }
    dropdown = document.createElement('div');
    dropdown.id = 'notifDropdownMenu';
    dropdown.style.cssText = `
      position: absolute; top: 48px; right: 0; width: 300px;
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 1000; padding: 16px;
      animation: fadeIn 0.2s ease;
    `;
    dropdown.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">
        <strong style="font-size:14px; color:#0f172a;">🔔 Store Notifications</strong>
        <span style="font-size:11px; background:#ef4444; color:#fff; font-weight:800; padding:2px 8px; border-radius:10px;">3 New</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
        <div style="padding:8px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; color:#166534; cursor:pointer;" onclick="document.querySelector('[data-tab=tab-orders]').click()">
          <strong>📦 New Order Placed</strong><br><small style="color:#64748b;">Order #BLJ8942 received for ₹1,299</small>
        </div>
        <div style="padding:8px 10px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; color:#9a3412; cursor:pointer;" onclick="document.querySelector('[data-tab=tab-products]').click()">
          <strong>⚠️ Low Stock Alert</strong><br><small style="color:#64748b;">Blinjo Brass Diya Urli stock &lt; 5 units</small>
        </div>
        <div style="padding:8px 10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; color:#0369a1; cursor:pointer;" onclick="document.querySelector('[data-tab=tab-reviews]').click()">
          <strong>⭐ New Review Posted</strong><br><small style="color:#64748b;">Priya S. rated 5 stars: "Absolute elegance!"</small>
        </div>
      </div>
    `;
    dashNotifBell.appendChild(dropdown);
    document.addEventListener('click', function closeNotif(ev) {
      if (!dropdown.contains(ev.target) && ev.target !== dashNotifBell) {
        dropdown.remove();
        document.removeEventListener('click', closeNotif);
      }
    });
  }

  // User Profile Dropdown
  const dashUserProfile = document.querySelector('.dash-user-profile');
  if (dashUserProfile) {
    dashUserProfile.style.position = 'relative';
    dashUserProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAdminUserDropdown();
    });
  }

  function toggleAdminUserDropdown() {
    let menu = document.getElementById('userProfileDropdownMenu');
    if (menu) {
      menu.remove();
      return;
    }
    menu = document.createElement('div');
    menu.id = 'userProfileDropdownMenu';
    menu.style.cssText = `
      position: absolute; top: 48px; right: 0; width: 220px;
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 1000; padding: 12px;
      animation: fadeIn 0.2s ease;
    `;
    menu.innerHTML = `
      <div style="padding-bottom:10px; margin-bottom:8px; border-bottom:1px solid #e2e8f0;">
        <strong style="display:block; font-size:13px; color:#0f172a;">Store Manager</strong>
        <small style="color:#64748b; font-size:11px;">admin@blinjostore.com</small>
      </div>
      <button id="profOptOrders" style="width:100%; text-align:left; background:none; border:none; padding:8px 10px; font-weight:700; font-size:12.5px; color:#334155; cursor:pointer; border-radius:6px;">📦 View Orders</button>
      <button id="profOptProducts" style="width:100%; text-align:left; background:none; border:none; padding:8px 10px; font-weight:700; font-size:12.5px; color:#334155; cursor:pointer; border-radius:6px;">🏷️ Manage Products</button>
      <button id="profOptStore" style="width:100%; text-align:left; background:none; border:none; padding:8px 10px; font-weight:700; font-size:12.5px; color:#334155; cursor:pointer; border-radius:6px;">🌐 Open Live Store</button>
    `;
    dashUserProfile.appendChild(menu);

    menu.querySelector('#profOptOrders').addEventListener('click', () => {
      document.querySelector('[data-tab="tab-orders"]')?.click();
      menu.remove();
    });
    menu.querySelector('#profOptProducts').addEventListener('click', () => {
      document.querySelector('[data-tab="tab-products"]')?.click();
      menu.remove();
    });
    menu.querySelector('#profOptStore').addEventListener('click', () => {
      window.open('index.html', '_blank');
      menu.remove();
    });

    document.addEventListener('click', function closeUserMenu(ev) {
      if (!menu.contains(ev.target) && !dashUserProfile.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeUserMenu);
      }
    });
  }

  // Customer Directory Modal
  window.openCustomerDirectoryModal = function() {
    let modal = document.getElementById('custDirectoryModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'custDirectoryModal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; animation: fadeIn 0.2s ease;
      `;
      modal.innerHTML = `
        <div style="background: #ffffff; width: 92%; max-width: 600px; border-radius: 16px; padding: 24px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">👥 Customer Directory (96 Verified)</h3>
            <button id="closeCustModalBtn" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b;">&times;</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <div><strong style="color: #0f172a; font-size: 13.5px;">Rahul Sharma</strong><br><small style="color: #64748b;">rahul.sharma@email.com | +91 98765 43210</small></div>
              <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px;">3 Orders</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <div><strong style="color: #0f172a; font-size: 13.5px;">Priya Patel</strong><br><small style="color: #64748b;">priya.patel@email.com | +91 98123 45678</small></div>
              <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px;">2 Orders</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <div><strong style="color: #0f172a; font-size: 13.5px;">Anish Kapoor</strong><br><small style="color: #64748b;">anish.k@email.com | +91 99887 76655</small></div>
              <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px;">1 Order</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#closeCustModalBtn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } else {
      modal.style.display = 'flex';
    }
  };

  // Initialize
  updateOrderKPIs();
  renderOrdersTable();
  renderProductsTable();
  renderDashboardOverview();
  renderSlideshowManager();
  renderOccasionsManager();

});
