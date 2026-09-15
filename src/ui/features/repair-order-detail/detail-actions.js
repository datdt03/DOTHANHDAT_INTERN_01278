/**
 * Order Detail Event Handlers & Actions
 */

import { showToast } from '../../shared/components/toast.js';
import { showModal } from '../../shared/components/modal.js';
import { approveQuote, rejectQuote, createQuoteVersion } from '../../mocks/mock-api.js';

export function setupDetailActions(container, order, onOrderUpdated) {
  const customerLink = `${window.location.origin}${window.location.pathname}#/customer/${order.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customerLink).then(() => {
      showToast('Customer link copied to clipboard.', 'success');
    }).catch(() => {
      showToast('Please copy the link directly from the input.', 'warning');
    });
  };

  // Copy Link Buttons
  const copyBtnTop = container.querySelector('#btn-copy-customer-link');
  if (copyBtnTop) copyBtnTop.addEventListener('click', copyToClipboard);

  const copyBtnInline = container.querySelector('#btn-copy-link-inline');
  if (copyBtnInline) copyBtnInline.addEventListener('click', copyToClipboard);

  // Resend ZNS
  const resendBtn = container.querySelector('#btn-resend-zns');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      showToast('Sending the link to the customer...', 'info');
      setTimeout(() => {
        showToast(`Approval link resent to ${order.customer.phone} successfully!`, 'success');
      }, 600);
    });
  }

  // Approve By Phone
  const phoneApproveBtn = container.querySelector('#btn-phone-approve');
  if (phoneApproveBtn) {
    phoneApproveBtn.addEventListener('click', () => {
      showModal({
        title: 'Confirm customer approval by phone',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">You are confirming on behalf of customer <strong>${order.customer.name}</strong> that the customer approved the full repair cost during a recorded call.</p>
          <div class="p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
            ⚠️ The status will immediately change to <strong>Approved</strong> and unlock the repair stage.
          </div>
        `,
        confirmText: 'Confirm approval',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await approveQuote(order.id, 'Consultant (phone approval)');
          showToast('Customer quotation approval recorded.', 'success');
          onOrderUpdated();
        }
      });
    });
  }

  // Reject Repair
  const rejectBtn = container.querySelector('#btn-order-reject');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      showModal({
        title: 'Confirm customer repair rejection',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">Please confirm that customer <strong>${order.customer.name}</strong> wants to cancel this repair order.</p>
          <textarea id="modal-reject-reason" class="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Enter a rejection reason (for example: cost too high, changed plans...)">Customer did not approve the genuine-part replacement cost</textarea>
        `,
        confirmText: 'Record rejection',
        cancelText: 'Close',
        onConfirm: async () => {
          const reasonInput = document.querySelector('#modal-reject-reason');
          const reason = reasonInput ? reasonInput.value : 'Customer rejected the repair';
          await rejectQuote(order.id, reason);
          showToast('Order status updated: customer rejected the repair.', 'warning');
          onOrderUpdated();
        }
      });
    });
  }

  // Create Quote Version v2.0
  const handleCreateV2 = () => {
    showModal({
      title: 'Create a new quotation version',
      contentHtml: `
        <div class="space-y-3 text-xs text-slate-600">
          <p>When a new quotation version is created, the old version remains in history for audit. The customer must review the new version again.</p>
          <div>
            <label class="font-bold text-slate-700 block mb-1">Change note for the new version:</label>
            <textarea id="modal-quote-v2-notes" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs" rows="3" placeholder="For example: apply a customer discount or change the screen type...">Additional loyalty-customer discount applied.</textarea>
          </div>
        </div>
      `,
      confirmText: 'Publish new version',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const notes = document.querySelector('#modal-quote-v2-notes')?.value || '';
        const currentItems = order.quoteVersions[0]?.items || [];
        await createQuoteVersion(order.id, currentItems, notes);
        showToast('New quotation version created successfully.', 'success');
        onOrderUpdated();
      }
    });
  };

  const createQuoteBtnTop = container.querySelector('#btn-create-quote-version');
  if (createQuoteBtnTop) createQuoteBtnTop.addEventListener('click', handleCreateV2);

  const createQuoteBtnInline = container.querySelector('#btn-create-v2-inline');
  if (createQuoteBtnInline) createQuoteBtnInline.addEventListener('click', handleCreateV2);

  // Tab switching
  const tabBtns = container.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => {
        b.classList.remove('border-sky-700', 'text-sky-800');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      e.currentTarget.classList.add('border-sky-700', 'text-sky-800');
      e.currentTarget.classList.remove('border-transparent', 'text-slate-500');

      const targetTab = e.currentTarget.dataset.tab;
      showToast(`Switched to tab: ${e.currentTarget.innerText.trim()}`, 'info', 1200);
    });
  });
}

