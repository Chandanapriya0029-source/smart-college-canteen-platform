/**
 * ============================================================================
 * MAIN APPLICATION BOOTSTRAP, PRESENTATION & GEMINI AI ORCHESTRATOR
 * Handles: View Switching, Toast Notifications, Presentation Presets, Gemini AI
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Toast System
  window.showToast = (message, type = 'info') => {
    const container = document.getElementById('global-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '🟢';
    if (type === 'warning') icon = '🟡';
    if (type === 'danger') icon = '🔴';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  };

  // Tab View Switcher
  const navButtons = document.querySelectorAll('.nav-tab-btn');
  const viewSections = document.querySelectorAll('.view-section');

  const switchView = (targetViewId) => {
    navButtons.forEach(btn => {
      if (btn.dataset.target === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    viewSections.forEach(section => {
      if (section.id === targetViewId) {
        section.classList.add('active-view');
      } else {
        section.classList.remove('active-view');
      }
    });

    // Layout adjustment for split view vs single view
    const splitStudentSlot = document.getElementById('split-student-slot');
    const studentShell = document.getElementById('student-device-shell-wrapper');
    const singleStudentSlot = document.getElementById('single-student-slot');

    if (targetViewId === 'view-split-demo') {
      if (splitStudentSlot && studentShell) {
        splitStudentSlot.appendChild(studentShell);
      }
      window.managerApp.renderKanban();
      window.managerApp.renderHeatmap();
    } else if (targetViewId === 'view-student') {
      if (singleStudentSlot && studentShell) {
        singleStudentSlot.appendChild(studentShell);
      }
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      switchView(target);
    });
  });

  // --- GEMINI API INTEGRATION LISTENERS ---

  const syncGeminiKeyUI = () => {
    const hasKey = window.geminiService.hasApiKey();
    const dot = document.getElementById('gemini-status-dot');
    const btnText = document.getElementById('gemini-btn-text');
    const input = document.getElementById('input-gemini-api-key');

    if (hasKey) {
      if (dot) dot.innerText = '🟢';
      if (btnText) btnText.innerText = 'Gemini Active';
      if (input) input.value = window.geminiService.getApiKey();
    } else {
      if (dot) dot.innerText = '🔑';
      if (btnText) btnText.innerText = 'Add Gemini Key';
      if (input) input.value = '';
    }
  };
  syncGeminiKeyUI();

  // Open Gemini Config Modal
  const btnOpenGemini = document.getElementById('btn-open-gemini-modal');
  if (btnOpenGemini) {
    btnOpenGemini.addEventListener('click', () => {
      syncGeminiKeyUI();
      document.getElementById('modal-gemini-config').classList.add('active');
    });
  }

  // Save Gemini Key
  const btnSaveKey = document.getElementById('btn-save-gemini-key');
  if (btnSaveKey) {
    btnSaveKey.addEventListener('click', () => {
      const val = document.getElementById('input-gemini-api-key').value;
      if (!val || val.length < 10) {
        window.showToast('Please enter a valid Gemini API Key from Google AI Studio', 'warning');
        return;
      }
      window.geminiService.setApiKey(val);
      syncGeminiKeyUI();
      document.getElementById('modal-gemini-config').classList.remove('active');
      window.showToast('✨ Gemini API Key connected successfully!', 'success');
    });
  }

  // Remove / Clear Gemini Key
  const btnClearKey = document.getElementById('btn-clear-gemini-key');
  if (btnClearKey) {
    btnClearKey.addEventListener('click', () => {
      window.geminiService.clearApiKey();
      syncGeminiKeyUI();
      document.getElementById('modal-gemini-config').classList.remove('active');
      window.showToast('🗑️ Gemini API Key removed successfully', 'info');
    });
  }

  // KDS Gemini Batch Prep Advice Trigger
  const btnKdsAdvice = document.getElementById('btn-kds-gemini-advice');
  if (btnKdsAdvice) {
    btnKdsAdvice.addEventListener('click', async () => {
      if (!window.geminiService.hasApiKey()) {
        document.getElementById('modal-gemini-config').classList.add('active');
        window.showToast('Enter your Gemini API key first to get AI forecasts.', 'info');
        return;
      }

      document.getElementById('gemini-modal-title').innerHTML = '<span>✨</span> Gemini Smart Kitchen Batch Forecast';
      document.getElementById('gemini-student-chat-bar').style.display = 'none';
      document.getElementById('gemini-modal-content').innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary-600); font-weight: 700;">
          <span class="pulse-dot"></span> Analyzing live slot capacities and orders with Gemini...
        </div>
      `;
      document.getElementById('modal-gemini-output').classList.add('active');

      const result = await window.geminiService.getKitchenPrepAdvice();
      if (result.success) {
        // Convert markdown to clean HTML
        const html = result.text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\*/g, '<br>•')
          .replace(/\n/g, '<br>');
        document.getElementById('gemini-modal-content').innerHTML = `<div>${html}</div>`;
      } else {
        document.getElementById('gemini-modal-content').innerHTML = `
          <div style="color: #EF4444;">❌ ${result.message}</div>
        `;
      }
    });
  }

  // Student Gemini Advisor Trigger
  const btnStudentAI = document.getElementById('btn-open-student-ai-modal');
  if (btnStudentAI) {
    btnStudentAI.addEventListener('click', () => {
      if (!window.geminiService.hasApiKey()) {
        document.getElementById('modal-gemini-config').classList.add('active');
        window.showToast('Enter your Gemini API key to chat with AI Advisor.', 'info');
        return;
      }

      document.getElementById('gemini-modal-title').innerHTML = '<span>💬</span> Gemini Meal Advisor';
      document.getElementById('gemini-student-chat-bar').style.display = 'flex';
      document.getElementById('gemini-modal-content').innerHTML = `
        <div style="color: var(--text-secondary);">
          👋 <strong>Hi Aarav!</strong> Ask me anything like:
          <ul style="margin-top: 0.4rem; padding-left: 1.2rem; font-size: 0.72rem;">
            <li>"What is the healthiest dinner available right now?"</li>
            <li>"What can I get for under ₹100 with zero wait time?"</li>
            <li>"Can I get a quick snack before 7:30 PM?"</li>
          </ul>
        </div>
      `;
      document.getElementById('modal-gemini-output').classList.add('active');
    });
  }

  // Send Student AI Question
  const btnSendAI = document.getElementById('btn-send-student-ai');
  const inputAI = document.getElementById('gemini-student-input');

  const executeStudentAIQuery = async () => {
    const q = inputAI.value.trim();
    if (!q) return;

    const contentBox = document.getElementById('gemini-modal-content');
    contentBox.innerHTML += `
      <div style="margin-top: 0.75rem; padding: 0.5rem; background: var(--bg-surface-white); border-radius: var(--radius-sm); border: 1px solid #E2E8F0;">
        <strong>You:</strong> ${q}
      </div>
      <div id="ai-loading-response" style="margin-top: 0.5rem; color: var(--primary-600); font-weight: 600;">
        ✨ Gemini is finding the best meal...
      </div>
    `;
    inputAI.value = '';
    contentBox.scrollTop = contentBox.scrollHeight;

    const res = await window.geminiService.getStudentRecommendation(q);
    const loadingEl = document.getElementById('ai-loading-response');
    if (loadingEl) loadingEl.remove();

    if (res.success) {
      const html = res.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      contentBox.innerHTML += `
        <div style="margin-top: 0.5rem; padding: 0.75rem; background: var(--primary-50); border-radius: var(--radius-sm); border: 1px solid var(--primary-100); color: var(--text-primary);">
          <strong>Gemini AI:</strong><br>${html}
        </div>
      `;
    } else {
      contentBox.innerHTML += `<div style="color: #EF4444; margin-top: 0.5rem;">❌ ${res.message}</div>`;
    }
    contentBox.scrollTop = contentBox.scrollHeight;
  };

  if (btnSendAI) btnSendAI.addEventListener('click', executeStudentAIQuery);
  if (inputAI) {
    inputAI.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeStudentAIQuery();
    });
  }

  // Presentation Quick-Demo Runner
  const btnRunScenario = document.getElementById('btn-run-dinner-demo');
  if (btnRunScenario) {
    btnRunScenario.addEventListener('click', () => {
      switchView('view-split-demo');
      window.showToast('🚀 Running End-to-End Dinner Rush Demo...', 'info');

      setTimeout(() => {
        studentApp.changeQty('biryani', 1);
        window.showToast('1. Aarav added Chicken Biryani → 5-Min Lock Started (14 → 13 available)', 'success');
      }, 1000);

      setTimeout(() => {
        studentApp.openSlotModal();
        window.showToast('2. Slot 7:30 PM is FULL → Capacity Engine redirects to 7:45 PM slot', 'warning');
      }, 2500);

      setTimeout(() => {
        studentApp.selectSlot('slot_745');
        studentApp.proceedToPaymentModal();
      }, 4200);

      setTimeout(() => {
        studentApp.processPayment();
      }, 5500);

      setTimeout(() => {
        window.showToast('3. Ticket #B-24 arrives at KDS for 7:45 PM window!', 'info');
        const latestOrder = window.stateEngine.orders[0];
        if (latestOrder) {
          window.stateEngine.updateOrderStatus(latestOrder.id, 'PREPARING');
        }
      }, 7500);

      setTimeout(() => {
        const latestOrder = window.stateEngine.orders[0];
        if (latestOrder) {
          window.stateEngine.updateOrderStatus(latestOrder.id, 'READY');
          window.showToast('4. Cook marks READY at Counter 2 → Student pass glows emerald!', 'success');
        }
      }, 9500);
    });
  }

  // Update Status Bar Time Clock
  const updateTime = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeEl = document.getElementById('ios-current-time');
    if (timeEl) timeEl.innerText = timeStr;
  };
  updateTime();
  setInterval(updateTime, 30000);
});
