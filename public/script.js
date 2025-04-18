document.getElementById('paymentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = document.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  const formData = new FormData(this);

  try {
    const response = await fetch('https://imf-payment-oxide.onrender.com/api/payment', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `Server error (HTTP ${response.status})`); // Fixed backticks
    }

    const result = await response.json();
    alert('✅ Payment successful! Check your email for confirmation.');
    this.reset();

  } catch (error) {
    console.error("Fetch Error:", error);
    alert(`❌ Payment failed: ${error.message || "Network/server error"}`); // Fixed backticks
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Payment';
  }
});
