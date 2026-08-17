/**
 * ============================================================================
 * STUDENT APP CONTROLLER (Mobile-First Experience)
 * Handles: Live Menu, 5-min Inventory Hold, Slot Selection, UPI Pay, QR Pass
 * ============================================================================
 */

class StudentAppController {
  constructor() {
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 9);
    this.cart = {}; // { itemId: qty }
    this.activeCategory = 'all';
    this.selectedSlotId = null;
    this.cartTimerInterval = null;
    this.cartExpiresAt = null;
    this.activeStudentOrder = null;

    this.init();
  }

  init() {
    this.renderMenu();
    this.renderSlots();
    this.bindEvents();

    // Subscribe to state engine updates
    window.stateEngine.subscribe((event, data) => {
      this.handleStateUpdate(event, data);
    });
  }

  handleStateUpdate(event, data) {
    this.renderMenu();
    this.renderSlots();
    this.updateCartBar();

    if (this.activeStudentOrder && data && data.order && data.order.id === this.activeStudentOrder.id) {
      this.activeStudentOrder = data.order;
      this.renderActivePass();
    }
  }

  bindEvents() {
    // Category pill filtering
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeCategory = e.target.dataset.category;
        this.renderMenu();
      });
    });

    // Checkout button trigger
    const checkoutBtn = document.getElementById('btn-open-slot-modal');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.openSlotModal();
      });
    }

    // Pay confirmation
    const payBtn = document.getElementById('btn-confirm-payment');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        this.processPayment();
      });
    }

    // Cancel order trigger
    const cancelBtn = document.getElementById('btn-student-cancel-order');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.promptCancellation();
      });
    }
  }

  // --- MENU RENDERING & CART ACTIONS ---

  renderMenu() {
    const container = document.getElementById('student-menu-list');
    if (!container) return;

    const items = window.stateEngine.menu.filter(item => {
      if (this.activeCategory === 'all') return true;
      return item.category === this.activeCategory;
    });

    container.innerHTML = items.map(item => {
      const available = window.stateEngine.getAvailableStock(item.id);
      const inCart = this.cart[item.id] || 0;

      let stockBadge = '';
      if (available <= 0) {
        stockBadge = `<span class="stock-pill out-of-stock">🔴 Sold Out</span>`;
      } else if (available <= 3) {
        stockBadge = `<span class="stock-pill low-stock">🟡 Only ${available} left!</span>`;
      } else {
        stockBadge = `<span class="stock-pill in-stock">🟢 ${available} available</span>`;
      }

      const actionHtml = available <= 0 && inCart === 0
        ? `<button class="btn-add-food" disabled>Sold Out</button>`
        : inCart > 0 
          ? `<div class="qty-stepper">
              <button class="stepper-btn" onclick="studentApp.changeQty('${item.id}', -1)">−</button>
              <span class="stepper-val">${inCart}</span>
              <button class="stepper-btn" onclick="studentApp.changeQty('${item.id}', 1)" ${available <= 0 ? 'disabled' : ''}>+</button>
             </div>`
          : `<button class="btn-add-food" onclick="studentApp.changeQty('${item.id}', 1)">+ Add</button>`;

      return `
        <div class="food-card">
          <div class="food-img-wrap">
            <span>${item.emoji}</span>
          </div>
          <div class="food-info">
            <div>
              <div class="food-title-row">
                <span class="food-name">${item.name}</span>
                ${stockBadge}
              </div>
              <p class="food-desc">${item.desc}</p>
            </div>
            <div class="food-meta-row">
              <span class="food-price">₹${item.price}</span>
              ${actionHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  changeQty(itemId, delta) {
    const currentQty = this.cart[itemId] || 0;
    const newQty = currentQty + delta;

    if (delta > 0) {
      const res = window.stateEngine.reserveCartItem(this.sessionId, itemId, 1);
      if (!res.success) {
        window.showToast(res.message, 'warning');
        return;
      }
      this.cart[itemId] = newQty;
      this.startCartTimer(res.expiresAt);
    } else {
      if (newQty <= 0) {
        delete this.cart[itemId];
      } else {
        this.cart[itemId] = newQty;
      }
      window.stateEngine.releaseCartItem(this.sessionId, itemId, 1);
    }

    if (Object.keys(this.cart).length === 0) {
      this.clearCartTimer();
    }

    this.renderMenu();
    this.updateCartBar();
  }

  startCartTimer(expiresAt) {
    this.cartExpiresAt = expiresAt;
    if (this.cartTimerInterval) clearInterval(this.cartTimerInterval);

    this.cartTimerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((this.cartExpiresAt - now) / 1000));
      
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const timerEl = document.getElementById('cart-countdown-timer');
      if (timerEl) timerEl.innerText = formatted;

      if (diff <= 0) {
        this.clearCartTimer();
        this.cart = {};
        window.stateEngine.clearSessionHolds(this.sessionId);
        window.showToast('⏱️ Inventory reservation expired! Items returned to stock.', 'warning');
        this.renderMenu();
        this.updateCartBar();
      }
    }, 1000);
  }

  clearCartTimer() {
    if (this.cartTimerInterval) clearInterval(this.cartTimerInterval);
    this.cartTimerInterval = null;
    this.cartExpiresAt = null;
  }

  updateCartBar() {
    const bar = document.getElementById('student-floating-cart');
    if (!bar) return;

    const totalCount = Object.values(this.cart).reduce((a, b) => a + b, 0);
    if (totalCount === 0) {
      bar.style.display = 'none';
      return;
    }

    let totalPrice = 0;
    for (const id in this.cart) {
      const item = window.stateEngine.menu.find(m => m.id === id);
      if (item) totalPrice += item.price * this.cart[id];
    }

    bar.style.display = 'flex';
    document.getElementById('cart-items-count').innerText = `${totalCount} item${totalCount > 1 ? 's' : ''}`;
    document.getElementById('cart-total-price').innerText = `₹${totalPrice}`;
  }

  // --- CAPACITY-AWARE PICKUP SLOT SELECTOR ---

  renderSlots() {
    const container = document.getElementById('slot-chips-list');
    if (!container) return;

    const slots = window.stateEngine.getAllSlots();

    // Auto-select first available if none selected or selected became full
    if (!this.selectedSlotId) {
      const firstOpen = slots.find(s => s.status !== 'full');
      if (firstOpen) this.selectedSlotId = firstOpen.id;
    }

    container.innerHTML = slots.map(slot => {
      const isSelected = slot.id === this.selectedSlotId;
      const isFull = slot.status === 'full';

      return `
        <div class="slot-chip ${isSelected ? 'selected' : ''} ${isFull ? 'slot-full' : ''}" 
             onclick="studentApp.selectSlot('${slot.id}')">
          <div class="slot-time">${slot.label}</div>
          <div class="slot-load-bar">
            <div class="slot-fill" style="width: ${slot.loadPct}%; background: ${isFull ? '#EF4444' : slot.status === 'almost_full' ? '#F59E0B' : '#10B981'};"></div>
          </div>
          <span class="badge ${slot.badgeClass}">${slot.statusText}</span>
        </div>
      `;
    }).join('');
  }

  selectSlot(slotId) {
    const slot = window.stateEngine.getSlotStatus(slotId);
    if (slot.status === 'full') {
      // Intelligent Queue Throttling: Suggest next available
      const slots = window.stateEngine.getAllSlots();
      const nextAvail = slots.find(s => s.status !== 'full');
      const nextLabel = nextAvail ? nextAvail.label : 'Later';

      window.showToast(`🔴 ${slot.label} is fully booked. Next available pickup: ${nextLabel}`, 'danger');
      if (nextAvail) {
        this.selectedSlotId = nextAvail.id;
        this.renderSlots();
      }
      return;
    }

    this.selectedSlotId = slotId;
    this.renderSlots();
  }

  openSlotModal() {
    this.renderSlots();
    document.getElementById('modal-slot-picker').classList.add('active');
  }

  closeSlotModal() {
    document.getElementById('modal-slot-picker').classList.remove('active');
  }

  proceedToPaymentModal() {
    this.closeSlotModal();
    
    // Populate payment summary
    let itemsHtml = '';
    let total = 0;
    for (const id in this.cart) {
      const item = window.stateEngine.menu.find(m => m.id === id);
      if (item) {
        const lineTotal = item.price * this.cart[id];
        total += lineTotal;
        itemsHtml += `<div class="pass-item-row"><span>${item.name} × ${this.cart[id]}</span><span>₹${lineTotal}</span></div>`;
      }
    }

    const slot = window.stateEngine.getSlotStatus(this.selectedSlotId);
    document.getElementById('payment-items-breakdown').innerHTML = itemsHtml;
    document.getElementById('payment-slot-selected').innerText = slot ? slot.label : '7:45 PM';
    document.getElementById('payment-total-amount').innerText = `₹${total}`;

    document.getElementById('modal-payment').classList.add('active');
  }

  closePaymentModal() {
    document.getElementById('modal-payment').classList.remove('active');
  }

  // --- PAYMENT VERIFICATION & PASS ISSUANCE ---

  processPayment() {
    const payBtn = document.getElementById('btn-confirm-payment');
    payBtn.innerText = 'Verifying Gateway Webhook...';
    payBtn.disabled = true;

    // Simulate Payment Gateway Webhook verification delay (800ms)
    setTimeout(() => {
      const cartItemsArray = [];
      for (const id in this.cart) {
        const item = window.stateEngine.menu.find(m => m.id === id);
        if (item) {
          cartItemsArray.push({
            id: item.id,
            name: item.name,
            qty: this.cart[id],
            price: item.price
          });
        }
      }

      const result = window.stateEngine.createOrder({
        studentName: 'Aarav Sharma (Student #204)',
        cartItems: cartItemsArray,
        slotId: this.selectedSlotId,
        paymentMethod: 'UPI (GPay)',
        sessionId: this.sessionId
      });

      payBtn.innerText = 'Pay & Confirm Order';
      payBtn.disabled = false;
      this.closePaymentModal();

      if (result.success) {
        this.cart = {};
        this.clearCartTimer();
        this.updateCartBar();
        this.activeStudentOrder = result.order;

        window.showToast(`🎉 Order ${result.order.token} Confirmed for ${result.order.slotLabel}!`, 'success');
        this.renderActivePass();
      } else {
        window.showToast(result.message, 'danger');
      }
    }, 800);
  }

  // --- ACTIVE PICKUP PASS & QR CODE ---

  renderActivePass() {
    const container = document.getElementById('student-active-pass-view');
    const menuContainer = document.getElementById('student-menu-view');
    
    if (!this.activeStudentOrder) {
      if (container) container.style.display = 'none';
      if (menuContainer) menuContainer.style.display = 'block';
      return;
    }

    if (menuContainer) menuContainer.style.display = 'none';
    if (container) container.style.display = 'block';

    const o = this.activeStudentOrder;
    const qrSvg = window.stateEngine.generateQRCodeSVG(o.qrToken, 160);

    let statusBadgeClass = 'badge-blue';
    let statusLabel = 'In Kitchen Queue';

    if (o.status === 'PREPARING') {
      statusBadgeClass = 'badge-blue';
      statusLabel = '👨‍🍳 Cooking in Progress';
    } else if (o.status === 'READY') {
      statusBadgeClass = 'badge-green';
      statusLabel = '🟢 Ready for Pickup!';
    } else if (o.status === 'PICKUP_OVERDUE') {
      statusBadgeClass = 'badge-yellow';
      statusLabel = '⚠️ Pickup Overdue (Grace Active)';
    } else if (o.status === 'COLLECTED') {
      statusBadgeClass = 'badge-green';
      statusLabel = '✅ Order Completed';
    } else if (o.status === 'CANCELLED') {
      statusBadgeClass = 'badge-red';
      statusLabel = '❌ Order Cancelled';
    }

    let itemsHtml = o.items.map(i => `
      <div class="pass-item-row">
        <span>${i.name} × ${i.qty}</span>
        <span>₹${i.price * i.qty}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="active-pass-container">
        <div class="pass-header">
          <div class="pass-status-pill">
            <span class="pulse-dot"></span>
            <span>${statusLabel}</span>
          </div>
          <div class="pass-token-num">${o.token}</div>
          <div class="pass-slot-info">Pickup Window: <strong>${o.slotLabel}</strong></div>
        </div>
        <div class="pass-qr-body">
          <div class="pass-counter-badge">📍 Proceed to ${o.counter}</div>
          
          <div class="qr-code-wrapper">
            <div class="qr-scan-line"></div>
            ${qrSvg}
          </div>

          <p style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Show this dynamic QR code at ${o.counter} for instant pickup.
          </p>

          <div class="pass-items-summary">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
              Items Ordered (${o.id})
            </div>
            ${itemsHtml}
            <div class="pass-item-row" style="font-weight: 800; color: var(--text-primary); border-top: 1px solid #E2E8F0; padding-top: 0.4rem; margin-top: 0.4rem;">
              <span>Total Paid</span>
              <span>₹${o.totalAmount}</span>
            </div>
          </div>

          ${o.status !== 'COLLECTED' && o.status !== 'CANCELLED' ? `
            <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 1.25rem;">
              <button class="btn-danger" style="flex: 1; font-size: 0.75rem;" onclick="studentApp.promptCancellation()">
                Cancel Order
              </button>
            </div>
          ` : `
            <button class="btn-secondary" style="width: 100%; margin-top: 1.25rem;" onclick="studentApp.resetToMenu()">
              Place Another Order
            </button>
          `}
        </div>
      </div>
    `;
  }

  // --- DYNAMIC REFUND POLICY CALCULATION DIALOG ---

  promptCancellation() {
    if (!this.activeStudentOrder) return;

    const refund = window.stateEngine.calculateRefund(this.activeStudentOrder.id);
    if (!refund) return;

    const modalBody = document.getElementById('cancel-policy-details');
    modalBody.innerHTML = `
      <div style="background: var(--bg-canvas-subtle); padding: 1rem; border-radius: var(--radius-md); font-size: var(--text-xs); line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted);">Current Order Stage:</span>
          <strong>${this.activeStudentOrder.status}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted);">Policy Refund Rate:</span>
          <strong style="color: ${refund.refundPct > 0 ? '#10B981' : '#EF4444'}; font-size: var(--text-sm);">${refund.refundPct}%</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-muted);">Refund Amount:</span>
          <strong style="color: var(--primary-700); font-size: var(--text-base);">₹${refund.refundAmount} (of ₹${refund.totalAmount})</strong>
        </div>
        <p style="margin-top: 0.5rem; color: var(--text-secondary); border-top: 1px dashed #CBD5E1; padding-top: 0.5rem;">
          ℹ️ <em>${refund.reason}</em>
        </p>
      </div>
    `;

    document.getElementById('modal-cancel-order').classList.add('active');
  }

  confirmCancellation() {
    if (!this.activeStudentOrder) return;

    const res = window.stateEngine.cancelOrder(this.activeStudentOrder.id);
    document.getElementById('modal-cancel-order').classList.remove('active');

    if (res.success) {
      window.showToast(`Order Cancelled. ₹${res.refundDetails.refundAmount} refunded to your UPI account.`, 'info');
      this.renderActivePass();
    }
  }

  closeCancelModal() {
    document.getElementById('modal-cancel-order').classList.remove('active');
  }

  resetToMenu() {
    this.activeStudentOrder = null;
    this.renderActivePass();
    this.renderMenu();
  }
}

window.studentApp = new StudentAppController();
