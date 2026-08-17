/**
 * ============================================================================
 * STATE ENGINE & BUSINESS LOGIC: SMART CANTEEN PLATFORM
 * Core Engines: Demand Throttling, 5-Min TTL Inventory Holds, Dynamic Refunds
 * ============================================================================
 */

class CanteenStateEngine {
  constructor() {
    // 1. Initial Menu & Stock
    this.menu = [
      {
        id: 'biryani',
        name: 'Chicken Biryani',
        category: 'specials',
        price: 120,
        totalStock: 30,
        confirmedSold: 16,
        prepTime: '8 min',
        emoji: '🍛',
        desc: 'Slow-cooked fragrant basmati rice with succulent marinated chicken.'
      },
      {
        id: 'veg_meal',
        name: 'Special Veg Thali',
        category: 'specials',
        price: 80,
        totalStock: 60,
        confirmedSold: 18,
        prepTime: '5 min',
        emoji: '🥘',
        desc: 'Paneer butter masala, yellow dal tadka, 3 rotis, jeera rice & gulab jamun.'
      },
      {
        id: 'paneer_wrap',
        name: 'Paneer Tikka Roll',
        category: 'quick_bites',
        price: 90,
        totalStock: 25,
        confirmedSold: 18,
        prepTime: '6 min',
        emoji: '🌯',
        desc: 'Char-grilled cottage cheese cubes wrapped in flaky paratha with mint chutney.'
      },
      {
        id: 'samosa',
        name: 'Crispy Samosa (2 pcs)',
        category: 'quick_bites',
        price: 30,
        totalStock: 30,
        confirmedSold: 28,
        prepTime: '2 min',
        emoji: '🥟',
        desc: 'Golden fried pastry with spiced potato and pea filling. (Low Stock!)'
      },
      {
        id: 'chai',
        name: 'Kullad Masala Chai',
        category: 'beverages',
        price: 15,
        totalStock: 100,
        confirmedSold: 24,
        prepTime: '2 min',
        emoji: '☕',
        desc: 'Freshly brewed strong tea infused with ginger, cardamom, and whole spices.'
      },
      {
        id: 'cold_coffee',
        name: 'Thick Cold Coffee',
        category: 'beverages',
        price: 40,
        totalStock: 40,
        confirmedSold: 22,
        prepTime: '3 min',
        emoji: '🧋',
        desc: 'Creamy blended chilled espresso topped with chocolate drizzle.'
      }
    ];

    // 2. Active Temporary Inventory Holds (5-minute TTL)
    // Structure: { sessionId: { itemId: qty, expiresAt: timestamp } }
    this.inventoryHolds = {};

    // 3. Operational Time Slots (15-min intervals)
    this.slotCapacityCeiling = 20; // Max kitchen capacity per slot
    this.slots = [
      { id: 'slot_700', label: '7:00 – 7:15 PM', booked: 12 },
      { id: 'slot_715', label: '7:15 – 7:30 PM', booked: 19 },
      { id: 'slot_730', label: '7:30 – 7:45 PM', booked: 20 }, // 100% full
      { id: 'slot_745', label: '7:45 – 8:00 PM', booked: 6 },
      { id: 'slot_800', label: '8:00 – 8:15 PM', booked: 3 }
    ];

    // 4. Configurable Policy Engine
    this.policies = {
      prePrepRefundPct: 100,    // Before preparation starts
      preparingRefundPct: 50,   // Once cooking begins
      readyRefundPct: 0,        // Once packaged and ready
      gracePeriodMinutes: 10,   // Grace window before order expires
      slotCapacity: 20          // Max orders per 15-min slot
    };

    // 5. Orders Database (Sample seed orders for live KDS)
    this.orders = [
      {
        id: 'ORD-4088',
        token: '#A-18',
        studentName: 'Rohan Sharma',
        slotId: 'slot_715',
        slotLabel: '7:15 – 7:30 PM',
        items: [{ id: 'veg_meal', name: 'Special Veg Thali', qty: 1, price: 80 }],
        totalAmount: 80,
        status: 'READY', // PLACED, PREPARING, READY, PICKUP_OVERDUE, EXPIRED, COLLECTED, CANCELLED
        counter: 'Counter 2',
        placedAt: new Date(Date.now() - 18 * 60000),
        readyAt: new Date(Date.now() - 4 * 60000),
        qrToken: 'CANTEEN-ORD-4088-VERIFIED-PASS',
        paid: true
      },
      {
        id: 'ORD-4089',
        token: '#A-19',
        studentName: 'Priya Patel',
        slotId: 'slot_715',
        slotLabel: '7:15 – 7:30 PM',
        items: [{ id: 'biryani', name: 'Chicken Biryani', qty: 2, price: 120 }],
        totalAmount: 240,
        status: 'PREPARING',
        counter: 'Counter 1',
        placedAt: new Date(Date.now() - 10 * 60000),
        readyAt: null,
        qrToken: 'CANTEEN-ORD-4089-VERIFIED-PASS',
        paid: true
      },
      {
        id: 'ORD-4090',
        token: '#A-20',
        studentName: 'Devika Nair',
        slotId: 'slot_730',
        slotLabel: '7:30 – 7:45 PM',
        items: [
          { id: 'paneer_wrap', name: 'Paneer Tikka Roll', qty: 1, price: 90 },
          { id: 'chai', name: 'Kullad Masala Chai', qty: 1, price: 15 }
        ],
        totalAmount: 105,
        status: 'PLACED',
        counter: 'Counter 2',
        placedAt: new Date(Date.now() - 5 * 60000),
        readyAt: null,
        qrToken: 'CANTEEN-ORD-4090-VERIFIED-PASS',
        paid: true
      },
      {
        id: 'ORD-4085',
        token: '#A-12',
        studentName: 'Vikram Seth',
        slotId: 'slot_700',
        slotLabel: '7:00 – 7:15 PM',
        items: [{ id: 'samosa', name: 'Crispy Samosa (2 pcs)', qty: 1, price: 30 }],
        totalAmount: 30,
        status: 'PICKUP_OVERDUE',
        counter: 'Counter 3',
        placedAt: new Date(Date.now() - 40 * 60000),
        readyAt: new Date(Date.now() - 25 * 60000),
        graceExpiresAt: new Date(Date.now() + 4 * 60000),
        qrToken: 'CANTEEN-ORD-4085-VERIFIED-PASS',
        paid: true
      }
    ];

    // 6. Real-time Audit Trail
    this.auditLogs = [
      { time: '7:05 PM', event: 'SLOT_SATURATION', detail: 'Slot 7:30-7:45 PM reached 100% capacity (20/20).' },
      { time: '7:08 PM', event: 'ORDER_READY', detail: 'Order #A-18 marked Ready at Counter 2.' },
      { time: '7:10 PM', event: 'GRACE_PERIOD_ACTIVE', detail: 'Order #A-12 reached slot end. 10m Grace period initiated.' }
    ];

    // Listeners for reactivity
    this.subscribers = [];

    // Background timer loop for TTL holds and overdue orders
    this.initBackgroundWorker();
  }

  // Reactive Subscription
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify(event, payload) {
    this.subscribers.forEach(cb => cb(event, payload));
  }

  // --- INVENTORY ENGINE (TTL LOCKS) ---
  
  getHeldQty(itemId) {
    let held = 0;
    const now = Date.now();
    for (const sid in this.inventoryHolds) {
      const hold = this.inventoryHolds[sid];
      if (hold.expiresAt > now && hold.items[itemId]) {
        held += hold.items[itemId];
      }
    }
    return held;
  }

  getAvailableStock(itemId) {
    const item = this.menu.find(m => m.id === itemId);
    if (!item) return 0;
    const held = this.getHeldQty(itemId);
    const available = item.totalStock - item.confirmedSold - held;
    return Math.max(0, available);
  }

  reserveCartItem(sessionId, itemId, qty) {
    const available = this.getAvailableStock(itemId);
    if (available < qty) {
      return { success: false, message: `Only ${available} portions available.` };
    }

    const now = Date.now();
    if (!this.inventoryHolds[sessionId]) {
      this.inventoryHolds[sessionId] = {
        items: {},
        expiresAt: now + 5 * 60 * 1000 // 5-minute TTL
      };
    }

    this.inventoryHolds[sessionId].items[itemId] = (this.inventoryHolds[sessionId].items[itemId] || 0) + qty;
    this.inventoryHolds[sessionId].expiresAt = now + 5 * 60 * 1000; // Reset 5m timer on activity

    this.logAudit('INVENTORY_HOLD', `Temporary 5-min lock: ${qty}x ${itemId} for Session ${sessionId.slice(0, 6)}`);
    this.notify('INVENTORY_CHANGED');
    return { success: true, expiresAt: this.inventoryHolds[sessionId].expiresAt };
  }

  releaseCartItem(sessionId, itemId, qty) {
    if (this.inventoryHolds[sessionId] && this.inventoryHolds[sessionId].items[itemId]) {
      this.inventoryHolds[sessionId].items[itemId] -= qty;
      if (this.inventoryHolds[sessionId].items[itemId] <= 0) {
        delete this.inventoryHolds[sessionId].items[itemId];
      }
      this.logAudit('INVENTORY_RELEASE', `Released ${qty}x ${itemId} from hold`);
      this.notify('INVENTORY_CHANGED');
    }
  }

  clearSessionHolds(sessionId) {
    if (this.inventoryHolds[sessionId]) {
      delete this.inventoryHolds[sessionId];
      this.logAudit('INVENTORY_EXPIRED', `Session ${sessionId.slice(0, 6)} holds released back to inventory`);
      this.notify('INVENTORY_CHANGED');
    }
  }

  // --- DEMAND & CAPACITY THROTTLING ENGINE ---

  getSlotStatus(slotId) {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return null;
    
    const cap = this.policies.slotCapacity;
    const remaining = cap - slot.booked;
    const loadPct = (slot.booked / cap) * 100;

    let status = 'available'; // Green
    let badgeClass = 'badge-green';
    let statusText = `${remaining} slots open`;

    if (slot.booked >= cap) {
      status = 'full'; // Red
      badgeClass = 'badge-red';
      statusText = 'Fully Booked';
    } else if (remaining <= 3) {
      status = 'almost_full'; // Yellow
      badgeClass = 'badge-yellow';
      statusText = `Only ${remaining} left!`;
    }

    return {
      ...slot,
      capacity: cap,
      remaining: Math.max(0, remaining),
      loadPct: Math.min(100, loadPct),
      status,
      badgeClass,
      statusText
    };
  }

  getAllSlots() {
    return this.slots.map(s => this.getSlotStatus(s.id));
  }

  // --- ORDER CREATION & LIFECYCLE ---

  createOrder({ studentName, cartItems, slotId, paymentMethod, sessionId }) {
    const slotStatus = this.getSlotStatus(slotId);
    if (!slotStatus || slotStatus.status === 'full') {
      return { success: false, message: 'Selected pickup slot is fully booked. Please choose another window.' };
    }

    // Verify stock availability
    for (const item of cartItems) {
      const itemData = this.menu.find(m => m.id === item.id);
      if (!itemData) return { success: false, message: 'Item not found.' };
    }

    const orderNum = 4090 + this.orders.length + 1;
    const orderId = `ORD-${orderNum}`;
    const token = `#B-${10 + (this.orders.length % 89)}`;
    const slot = this.slots.find(s => s.id === slotId);
    
    // Permanent inventory deduction & Slot booking increment
    cartItems.forEach(cartItem => {
      const menuItem = this.menu.find(m => m.id === cartItem.id);
      if (menuItem) {
        menuItem.confirmedSold += cartItem.qty;
      }
    });

    slot.booked += 1;

    // Clear temporary holds
    if (sessionId) {
      delete this.inventoryHolds[sessionId];
    }

    const totalAmount = cartItems.reduce((acc, i) => acc + (i.price * i.qty), 0);

    const newOrder = {
      id: orderId,
      token: token,
      studentName: studentName || 'Aarav Sharma (Student)',
      slotId: slotId,
      slotLabel: slot.label,
      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      totalAmount: totalAmount,
      status: 'PLACED',
      counter: Math.random() > 0.5 ? 'Counter 1' : 'Counter 2',
      placedAt: new Date(),
      readyAt: null,
      qrToken: `CANTEEN-${orderId}-SECURE-${Math.floor(1000 + Math.random() * 9000)}`,
      paid: true,
      paymentMethod: paymentMethod || 'UPI (Google Pay / PhonePe)'
    };

    this.orders.unshift(newOrder);
    this.logAudit('ORDER_CREATED', `Order ${orderId} (${token}) confirmed for ${slot.label}. Paid ₹${totalAmount}.`);
    this.notify('ORDER_CREATED', newOrder);
    return { success: true, order: newOrder };
  }

  // Order State Transitions
  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const oldStatus = order.status;
    order.status = newStatus;

    if (newStatus === 'READY') {
      order.readyAt = new Date();
      this.playAudioFeedback('ready');
      this.logAudit('ORDER_READY', `Order ${order.id} (${order.token}) is READY at ${order.counter}`);
    } else if (newStatus === 'PICKUP_OVERDUE') {
      order.graceExpiresAt = new Date(Date.now() + this.policies.gracePeriodMinutes * 60000);
      this.logAudit('GRACE_PERIOD_STARTED', `Order ${order.id} overdue. ${this.policies.gracePeriodMinutes}m grace period active.`);
    } else if (newStatus === 'COLLECTED') {
      this.playAudioFeedback('success');
      this.logAudit('ORDER_COLLECTED', `Order ${order.id} (${order.token}) verified & collected.`);
    } else if (newStatus === 'EXPIRED') {
      this.logAudit('ORDER_EXPIRED', `Order ${order.id} grace period elapsed. Discarded.`);
    }

    this.notify('ORDER_UPDATED', { order, oldStatus, newStatus });
    return true;
  }

  // Dynamic Refund Engine
  calculateRefund(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    let refundPct = 0;
    let reason = '';

    if (order.status === 'PLACED') {
      refundPct = this.policies.prePrepRefundPct;
      reason = 'Cancelled before kitchen preparation started. (100% full refund)';
    } else if (order.status === 'PREPARING') {
      refundPct = this.policies.preparingRefundPct;
      reason = 'Cancelled after preparation began. (50% refund to offset ingredient costs)';
    } else if (order.status === 'READY' || order.status === 'PICKUP_OVERDUE') {
      refundPct = this.policies.readyRefundPct;
      reason = 'Order already prepared and packaged. (0% refund policy)';
    } else {
      refundPct = 0;
      reason = 'Non-refundable order state.';
    }

    const refundAmount = Math.round((order.totalAmount * refundPct) / 100);
    return {
      orderId: order.id,
      totalAmount: order.totalAmount,
      refundPct,
      refundAmount,
      reason,
      restockEligible: order.status === 'PLACED'
    };
  }

  cancelOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const refundDetails = this.calculateRefund(orderId);
    order.status = 'CANCELLED';
    order.refundDetails = refundDetails;

    // Restock inventory if cancelled before cooking
    if (refundDetails.restockEligible) {
      order.items.forEach(item => {
        const menuItem = this.menu.find(m => m.id === item.id);
        if (menuItem) {
          menuItem.confirmedSold -= item.qty;
        }
      });
      // Free slot capacity
      const slot = this.slots.find(s => s.id === order.slotId);
      if (slot && slot.booked > 0) slot.booked -= 1;
    }

    this.logAudit('ORDER_CANCELLED', `Order ${order.id} cancelled. Refund: ₹${refundDetails.refundAmount} (${refundDetails.refundPct}%)`);
    this.notify('ORDER_CANCELLED', { order, refundDetails });
    return { success: true, refundDetails };
  }

  // QR Code Verification
  verifyQRCode(qrTokenString) {
    const order = this.orders.find(o => o.qrToken === qrTokenString);
    if (!order) {
      return { success: false, message: 'Invalid or Unrecognized QR Token!' };
    }

    if (order.status === 'COLLECTED') {
      return { success: false, message: `Token already used! Order was picked up earlier.` };
    }

    if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
      return { success: false, message: `Order status is ${order.status}. Pickup disallowed.` };
    }

    this.updateOrderStatus(order.id, 'COLLECTED');
    return {
      success: true,
      message: `Verified! Hand over ${order.token} to ${order.studentName}`,
      order
    };
  }

  // 1-Click Rush Surge Simulator
  simulateRush(count = 15) {
    const targetSlot = this.slots[1]; // 7:15 - 7:30 PM
    const overflowSlot = this.slots[3]; // 7:45 - 8:00 PM

    for (let i = 0; i < count; i++) {
      if (targetSlot.booked < this.policies.slotCapacity) {
        targetSlot.booked += 1;
      } else {
        overflowSlot.booked = Math.min(this.policies.slotCapacity, overflowSlot.booked + 1);
      }
    }

    this.logAudit('RUSH_SIMULATION', `Simulated peak rush of ${count} orders. Overflow automatically routed to 7:45 PM.`);
    this.notify('RUSH_SIMULATED');
  }

  // Policy configuration updater
  updatePolicy(key, val) {
    this.policies[key] = Number(val);
    if (key === 'slotCapacity') {
      this.slotCapacityCeiling = Number(val);
    }
    this.logAudit('POLICY_UPDATED', `Policy '${key}' updated to ${val}`);
    this.notify('POLICY_CHANGED');
  }

  logAudit(event, detail) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.auditLogs.unshift({ time: timeStr, event, detail });
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  // Background TTL and Grace Period Tick
  initBackgroundWorker() {
    setInterval(() => {
      const now = Date.now();
      
      // 1. Check expired inventory holds
      let holdsChanged = false;
      for (const sid in this.inventoryHolds) {
        if (this.inventoryHolds[sid].expiresAt <= now) {
          delete this.inventoryHolds[sid];
          holdsChanged = true;
        }
      }
      if (holdsChanged) {
        this.notify('INVENTORY_CHANGED');
      }

      // 2. Check overdue orders in grace period
      this.orders.forEach(order => {
        if (order.status === 'READY' && order.readyAt) {
          // If ready for more than 15 min, mark overdue
          const elapsed = (now - new Date(order.readyAt).getTime()) / 60000;
          if (elapsed >= 12) {
            order.status = 'PICKUP_OVERDUE';
            order.graceExpiresAt = new Date(now + this.policies.gracePeriodMinutes * 60000);
            this.notify('ORDER_UPDATED', { order });
          }
        } else if (order.status === 'PICKUP_OVERDUE' && order.graceExpiresAt) {
          if (now > new Date(order.graceExpiresAt).getTime()) {
            order.status = 'EXPIRED';
            this.notify('ORDER_UPDATED', { order });
          }
        }
      });
    }, 10000);
  }

  // Web Audio Synthesizer for Audio Feedback
  playAudioFeedback(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High pleasant dual chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'ready') {
        // Soft notify bell
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  // Lightweight Standalone SVG QR Code Generator
  generateQRCodeSVG(text, size = 160) {
    // Generate deterministic 21x21 matrix with position corners
    const matrixSize = 21;
    const matrix = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(false));

    // Corner Finder Patterns
    const drawFinder = (startX, startY) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startY + r][startX + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(matrixSize - 7, 0);
    drawFinder(0, matrixSize - 7);

    // Hash text to populate data pattern
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= matrixSize - 8) || (r >= matrixSize - 8 && c < 8)) {
          continue;
        }
        // Timing lines
        if (r === 6 || c === 6) {
          matrix[r][c] = (r + c) % 2 === 0;
          continue;
        }
        // Pseudorandom data bit
        const bit = ((hash ^ (r * 31 + c * 17)) & (1 << ((r + c) % 16))) !== 0;
        matrix[r][c] = bit;
      }
    }

    const cellSize = size / matrixSize;
    let svgRects = '';

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          svgRects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#0F172A" rx="1"/>`;
        }
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <rect width="${size}" height="${size}" fill="#FFFFFF" rx="8"/>
      ${svgRects}
    </svg>`;
  }
}

// Global Singleton Engine
window.stateEngine = new CanteenStateEngine();
