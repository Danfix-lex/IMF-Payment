document.getElementById('paymentForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

  // Create feedback element if it doesn't exist
  let feedbackEl = document.getElementById('formFeedback');
  if (!feedbackEl) {
    feedbackEl = document.createElement('div');
    feedbackEl.id = 'formFeedback';
    this.appendChild(feedbackEl);
  }
  feedbackEl.textContent = '';
  feedbackEl.className = '';

  try {
    const formData = new FormData(this);
    
    const response = await fetch('https://imf-payment-oxide.onrender.com/api/payment', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Payment failed');
    }

    feedbackEl.textContent = '✅ Payment successful! Check your email/spam for confirmation.';
    feedbackEl.className = 'success';
    this.reset();

  } catch (error) {
    console.error("Payment Error:", error);
    feedbackEl.textContent = `❌ Error: ${error.message || "Payment failed. Please try again."}`;
    feedbackEl.className = 'error';
    
    // Scroll to feedback message
    feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

// Add some basic CSS for the feedback
const style = document.createElement('style');
style.textContent = `
  #formFeedback {
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
    text-align: center;
  }
  #formFeedback.success {
    background-color: #d4edda;
    color: #155724;
  }
  #formFeedback.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: #000;
    animation: spin 1s ease-in-out infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
