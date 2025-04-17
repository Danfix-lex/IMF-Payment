document.getElementById('paymentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  // Show loading state
  const submitBtn = document.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('email', document.getElementById('email').value);
  formData.append('amount', document.getElementById('amount').value);
  formData.append('paymentProof', document.getElementById('paymentProof').files[0]);

  try {
    // ✅ Correct the URL to match your server endpoint
    const response = await fetch('https://imf-payment-oxide.onrender.com/api/payment', {
      method: 'POST',
      body: formData // FormData automatically sets Content-Type to multipart/form-data
    });

    if (!response.ok) {
      // Try to get error message from server
      const errorText = await response.text();
      throw new Error(errorText || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Success:", result);
    alert('Payment successful! Check your email for confirmation and receipt.');
    document.getElementById('paymentForm').reset();

  } catch (error) {
    console.error("Error:", error);
    alert('Payment failed: ' + error.message);
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Payment';
  }
});
