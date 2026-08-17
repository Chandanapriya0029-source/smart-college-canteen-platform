/**
 * ============================================================================
 * CANTEEN MANAGER & KDS CONTROLLER (Kitchen Display & Counter Operations)
 * Handles: Live Kanban, Peak Demand Heatmap, QR Scanner, Stock Overrides
 * ============================================================================
 */

class ManagerAppController {
  constructor() {
    this.init();
  }

  init() {
    this.renderMetrics();
    this.renderHeatmap();
    this.renderKanban();
    this.renderStockOverrides();
    this.bindEvents();

    // Subscribe to global engine updates
    window.stateEngine.subscribe((event, data) => {
      this.renderMetrics();
      this.renderHeatmap();
      this.renderKanban();
      this.renderStockOverrides();
    });
  }

  bindEvents() {
    const scannerOpenBtn = document.getElementById('btn-open-qr-scanner');
    if (scannerOpenBtn) {
      scannerOpenBtn.addEventListener('click', () => {
        this.openScannerModal();
      });
    }
  }

  // --- OPERATIONAL METRICS BAR ---

  renderMetrics() {
    const orders = window.stateEngine.orders;
    const active = orders.filter(o => ['PLACED', 'PREPARING', 'READY', 'PICKUP_OVERDUE'].includes(o.status)).length;
    const preparing = orders.filter(o => o.status === 'PREPARING').length;
    const ready = orders.filter(o => o.status === 'READY').length;
    const overdue = orders.filter(o => o.status === 'PICKUP_OVERDUE').length;

    // Low stock items count (< 5 remaining)
    const lowStock = window.stateEngine.menu.filter(m => window.stateEngine.getAvailableStock(m.id) <= 3).length;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal('kds-metric-active', active);
    setVal('kds-metric-prep', preparing);
    setVal('kds-metric-ready', ready);
    setVal('kds-metric-overdue', overdue);
    setVal('kds-metric-lowstock', lowStock);
  }

  // --- 15-MINUTE PEAK DEMAND HEATMAP ---

  renderHeatmap() {
    const container = document.getElementById('kds-slot-heatmap');
    if (!container) return;

    const slots = window.stateEngine.getAllSlots();

    container.innerHTML = slots.map(slot => {
      let barColor = '#10B981';
      let statusColor = '#059669';
      let labelTag = 'Normal';

      if (slot.status === 'full') {
        barColor = '#EF4444';
        statusColor = '#DC2626';
        labelTag = '🔴 FULL';
      } else if (slot.status === 'almost_full') {
        barColor = '#F59E0B';
        statusColor = '#D97706';
        labelTag = '🟡 PEAK';
      }

      return `
        <div class="heatmap-slot-col">
          <div class="slot-col-time">${slot.label}</div>
          <div class="slot-col-meter">
            <div class="slot-col-bar" style="width: ${slot.loadPct}%; background: ${barColor};"></div>
          </div>
          <div class="slot-col-footer">
            <span style="color: ${statusColor}; font-weight: 700;">${labelTag}</span>
            <span>${slot.booked}/${slot.capacity} orders</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- KANBAN BOARD & STATE TRANSITIONS ---

  renderKanban() {
    const orders = window.stateEngine.orders;

    const queuedOrders = orders.filter(o => o.status === 'PLACED');
    const prepOrders = orders.filter(o => o.status === 'PREPARING');
    const readyOrders = orders.filter(o => o.status === 'READY');
    const overdueOrders = orders.filter(o => o.status === 'PICKUP_OVERDUE');

    this.renderCol('kds-col-queued', queuedOrders, 'queued');
    this.renderCol('kds-col-prep', prepOrders, 'prep');
    this.renderCol('kds-col-ready', readyOrders, 'ready');
    this.renderCol('kds-col-overdue', overdueOrders, 'overdue');

    // Update column counters
    const setColCount = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.innerText = count;
    };
    setColCount('kds-count-queued', queuedOrders.length);
    setColCount('kds-count-prep', prepOrders.length);
    setColCount('kds-count-ready', readyOrders.length);
    setColCount('kds-count-overdue', overdueOrders.length);
  }

  renderCol(elementId, orderList, colType) {
    const col = document.getElementById(elementId);
    if (!col) return;

    if (orderList.length === 0) {
      col.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: var(--text-xs); padding: 2rem 0;">
          No active tickets in this stage
        </div>
      `;
      return;
    }

    col.innerHTML = orderList.map(o => {
      let priorityClass = '';
      if (colType === 'ready') priorityClass = 'priority-ready';
      if (colType === 'overdue') priorityClass = 'priority-overdue';

      let actionButtons = '';
      if (colType === 'queued') {
        actionButtons = `
          <button class="btn-kds-action btn-kds-start" onclick="managerApp.moveOrder('${o.id}', 'PREPARING')">
            👨‍🍳 Start Prep
          </button>
        `;
      } else if (colType === 'prep') {
        actionButtons = `
          <button class="btn-kds-action btn-kds-ready" onclick="managerApp.moveOrder('${o.id}', 'READY')">
            🟢 Mark Ready
          </button>
        `;
      } else if (colType === 'ready') {
        actionButtons = `
          <button class="btn-kds-action btn-kds-start" style="font-size: 0.7rem;" onclick="managerApp.testScanOrder('${o.qrToken}')">
            📷 Test QR Scan
          </button>
          <button class="btn-kds-action" style="background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; font-size: 0.7rem;" onclick="managerApp.moveOrder('${o.id}', 'PICKUP_OVERDUE')">
            ⚠️ Mark Overdue
          </button>
        `;
      } else if (colType === 'overdue') {
        actionButtons = `
          <button class="btn-kds-action btn-kds-ready" style="font-size: 0.7rem;" onclick="managerApp.testScanOrder('${o.qrToken}')">
            📷 Late Scan
          </button>
          <button class="btn-kds-action btn-danger" style="font-size: 0.7rem;" onclick="managerApp.moveOrder('${o.id}', 'EXPIRED')">
            🗑️ Expire Ticket
          </button>
        `;
      }

      const itemsListHtml = o.items.map(i => `
        <div class="order-item-line">
          <span>${i.name}</span>
          <span class="order-item-qty">×${i.qty}</span>
        </div>
      `).join('');

      return `
        <div class="kds-order-card ${priorityClass}">
          <div class="order-card-header">
            <span class="order-token">${o.token}</span>
            <span class="order-slot-tag">🕒 ${o.slotLabel}</span>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted);">
            👤 ${o.studentName} · 📍 <strong>${o.counter}</strong>
          </div>

          <div class="order-items-list">
            ${itemsListHtml}
          </div>

          <div class="order-card-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');
  }

  moveOrder(orderId, nextStatus) {
    window.stateEngine.updateOrderStatus(orderId, nextStatus);
  }

  // --- QR SCANNER & TEST INJECTOR ---

  openScannerModal() {
    this.populateActivePassQuickScans();
    document.getElementById('modal-qr-scanner').classList.add('active');
  }

  closeScannerModal() {
    document.getElementById('modal-qr-scanner').classList.remove('active');
  }

  populateActivePassQuickScans() {
    const listEl = document.getElementById('quick-scan-test-buttons');
    if (!listEl) return;

    const readyOrders = window.stateEngine.orders.filter(o => ['READY', 'PICKUP_OVERDUE', 'PREPARING', 'PLACED'].includes(o.status));
    
    if (readyOrders.length === 0) {
      listEl.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">No live orders available to scan.</span>`;
      return;
    }

    listEl.innerHTML = readyOrders.slice(0, 5).map(o => `
      <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.75rem;" onclick="managerApp.testScanOrder('${o.qrToken}')">
        Scan ${o.token} (${o.studentName.split(' ')[0]})
      </button>
    `).join('');
  }

  submitManualQR() {
    const input = document.getElementById('manual-qr-input');
    const token = input.value.trim();
    if (!token) return;
    this.testScanOrder(token);
    input.value = '';
  }

  testScanOrder(qrToken) {
    const res = window.stateEngine.verifyQRCode(qrToken);
    const resultBox = document.getElementById('scanner-verification-result');

    if (res.success) {
      resultBox.innerHTML = `
        <div style="background: var(--status-available-bg); border: 1.5px solid var(--status-available); padding: 1rem; border-radius: var(--radius-md); text-align: center; color: var(--status-available);">
          <div style="font-size: var(--text-lg); font-weight: 800;">✅ PASS VERIFIED</div>
          <div style="font-size: var(--text-sm); font-weight: 700; margin-top: 0.25rem; color: var(--text-primary);">${res.message}</div>
          <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: 0.35rem;">
            Order ID: ${res.order.id} · Total: ₹${res.order.totalAmount}
          </div>
        </div>
      `;
      window.showToast(`✅ Token ${res.order.token} Verified! Order fulfilled.`, 'success');
    } else {
      resultBox.innerHTML = `
        <div style="background: var(--status-danger-bg); border: 1.5px solid var(--status-danger); padding: 1rem; border-radius: var(--radius-md); text-align: center; color: var(--status-danger);">
          <div style="font-size: var(--text-lg); font-weight: 800;">❌ VERIFICATION FAILED</div>
          <div style="font-size: var(--text-xs); margin-top: 0.25rem;">${res.message}</div>
        </div>
      `;
      window.showToast(`❌ Verification Failed: ${res.message}`, 'danger');
    }
  }

  // --- LIVE STOCK OVERRIDE PANEL ---

  renderStockOverrides() {
    const container = document.getElementById('kds-stock-override-list');
    if (!container) return;

    container.innerHTML = window.stateEngine.menu.map(item => {
      const avail = window.stateEngine.getAvailableStock(item.id);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-surface-white); border-radius: var(--radius-sm); border: 1px solid var(--glass-border-subtle); font-size: var(--text-xs);">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span>${item.emoji}</span>
            <strong>${item.name}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-weight: 700; color: ${avail > 3 ? '#10B981' : '#EF4444'};">${avail} left</span>
            <button class="btn-secondary" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;" onclick="managerApp.adjustStock('${item.id}', 10)">+10 Stock</button>
            <button class="btn-danger" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;" onclick="managerApp.zeroStock('${item.id}')">Sold Out</button>
          </div>
        </div>
      `;
    }).join('');
  }

  adjustStock(itemId, addAmount) {
    const item = window.stateEngine.menu.find(m => m.id === itemId);
    if (item) {
      item.totalStock += addAmount;
      window.stateEngine.logAudit('STOCK_MANUAL_RESTOCK', `Added +${addAmount} stock to ${item.name}`);
      window.stateEngine.notify('INVENTORY_CHANGED');
      window.showToast(`Restocked +${addAmount} ${item.name}`, 'info');
    }
  }

  zeroStock(itemId) {
    const item = window.stateEngine.menu.find(m => m.id === itemId);
    if (item) {
      item.totalStock = item.confirmedSold; // make available = 0
      window.stateEngine.logAudit('STOCK_MANUAL_OUT', `Marked ${item.name} SOLD OUT`);
      window.stateEngine.notify('INVENTORY_CHANGED');
      window.showToast(`Marked ${item.name} as Sold Out`, 'warning');
    }
  }
}

window.managerApp = new ManagerAppController();
