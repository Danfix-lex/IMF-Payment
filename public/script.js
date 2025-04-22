document.getElementById('paymentForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  
  // Initialize feedback element
  let feedbackEl = document.getElementById('formFeedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'formFeedback';
    form.appendChild(feedbackEl);
  }
  
  // Reset UI state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner"></span> Processing...
  `;
  feedbackEl.textContent = '';
  feedbackEl.className = '';
  feedbackEl.style.display = 'none';

  try {
    const formData = new FormData(form);
    
    // Show loading state
    feedbackEl.textContent = 'Processing your payment...';
    feedbackEl.className = 'info';
    feedbackEl.style.display = 'block';
    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const response = await fetch('https://imf-payment-xdde.onrender.com/api/payment', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || result.message || 'Payment failed');
    }

    // Success handling
    feedbackEl.innerHTML = `
      <div class="success-message">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <div>
          <h3>Payment Successful!</h3>
          <p>Check your email/spam for confirmation.</p>
          <p class="small">Transaction ID: ${result.payment?._id || ''}</p>
        </div>
      </div>
    `;
    feedbackEl.className = 'success';
    
    form.reset();

  } catch (error) {
    console.error("Payment Error:", error);
    
    feedbackEl.innerHTML = `
      <div class="error-message">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div>
          <h3>Payment Failed</h3>
          <p>${error.message || 'Please try again later.'}</p>
        </div>
      </div>
    `;
    feedbackEl.className = 'error';
    
  } finally {
    feedbackEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

// Enhanced styles
const style = document.createElement('style');
style.textContent = `
  #formFeedback {
    padding: 16px;
    margin: 16px 0;
    border-radius: 8px;
    display: none;
  }
  
  #formFeedback.success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  
  #formFeedback.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }
  
  #formFeedback.info {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
  }
  
  .success-message, .error-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .success-message svg {
    color: #22c55e;
  }
  
  .error-message svg {
    color: #ef4444;
  }
  
  .success-message h3, .error-message h3 {
    margin: 0 0 4px 0;
    font-size: 1.1em;
  }
  
  .success-message p, .error-message p {
    margin: 0;
    font-size: 0.9em;
  }
  
  .small {
    font-size: 0.8em;
    opacity: 0.8;
  }
  
  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: currentColor;
    animation: spin 1s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
