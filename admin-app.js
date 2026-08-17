/**
 * ============================================================================
 * ADMIN LAYER & POLICY ENGINE CONTROLLER
 * Handles: Policy Matrix, Slot Throttles, Rush Simulator, Real-Time Audit Logs
 * ============================================================================
 */

class AdminAppController {
  constructor() {
    this.init();
  }

  init() {
    this.syncPolicyForm();
    this.renderAuditLogs();
    this.bindEvents();

    // Subscribe to state engine updates
    window.stateEngine.subscribe((event, data) => {
      this.renderAuditLogs();
    });
  }

  syncPolicyForm() {
    const p = window.stateEngine.policies;

    const setSlider = (id, valId, val, suffix = '%') => {
      const slider = document.getElementById(id);
      const valEl = document.getElementById(valId);
      if (slider) slider.value = val;
      if (valEl) valEl.innerText = `${val}${suffix}`;
    };

    setSlider('slider-pre-prep', 'val-pre-prep', p.prePrepRefundPct, '%');
    setSlider('slider-prep', 'val-prep', p.preparingRefundPct, '%');
    setSlider('slider-ready', 'val-ready', p.readyRefundPct, '%');
    setSlider('slider-grace', 'val-grace', p.gracePeriodMinutes, ' min');
    setSlider('slider-capacity', 'val-capacity', p.slotCapacity, ' orders');
  }

  bindEvents() {
    // Policy Sliders
    const bindSlider = (sliderId, valId, policyKey, suffix = '%') => {
      const slider = document.getElementById(sliderId);
      if (!slider) return;
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        document.getElementById(valId).innerText = `${val}${suffix}`;
        window.stateEngine.updatePolicy(policyKey, val);
      });
    };

    bindSlider('slider-pre-prep', 'val-pre-prep', 'prePrepRefundPct', '%');
    bindSlider('slider-prep', 'val-prep', 'preparingRefundPct', '%');
    bindSlider('slider-ready', 'val-ready', 'readyRefundPct', '%');
    bindSlider('slider-grace', 'val-grace', 'gracePeriodMinutes', ' min');
    bindSlider('slider-capacity', 'val-capacity', 'slotCapacity', ' orders');

    // Simulator Buttons
    const simRushBtn = document.getElementById('btn-sim-rush');
    if (simRushBtn) {
      simRushBtn.addEventListener('click', () => {
        window.stateEngine.simulateRush(15);
        window.showToast('🚀 Simulated 15-Student Dinner Rush! Check KDS & Slot Heatmap.', 'success');
      });
    }

    const simGraceBtn = document.getElementById('btn-sim-grace-expire');
    if (simGraceBtn) {
      simGraceBtn.addEventListener('click', () => {
        const overdue = window.stateEngine.orders.find(o => o.status === 'PICKUP_OVERDUE');
        if (overdue) {
          window.stateEngine.updateOrderStatus(overdue.id, 'EXPIRED');
          window.showToast(`Order ${overdue.token} Grace Period Expired -> Marked EXPIRED (0% Refund)`, 'warning');
        } else {
          window.showToast('No orders currently in grace period to expire.', 'info');
        }
      });
    }

    const resetBtn = document.getElementById('btn-sim-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  // --- LIVE AUDIT LOGS ---

  renderAuditLogs() {
    const tableBody = document.getElementById('admin-audit-log-rows');
    if (!tableBody) return;

    const logs = window.stateEngine.auditLogs;

    tableBody.innerHTML = logs.map(log => {
      let badgeClass = 'badge-blue';
      if (log.event.includes('CANCEL') || log.event.includes('EXPIRE')) badgeClass = 'badge-red';
      if (log.event.includes('HOLD') || log.event.includes('POLICY')) badgeClass = 'badge-yellow';
      if (log.event.includes('COLLECTED') || log.event.includes('CREATED')) badgeClass = 'badge-green';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted); width: 85px;">
            ${log.time}
          </td>
          <td style="width: 170px;">
            <span class="badge ${badgeClass}">${log.event}</span>
          </td>
          <td>${log.detail}</td>
        </tr>
      `;
    }).join('');
  }
}

window.adminApp = new AdminAppController();
