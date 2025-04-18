document.getElementById('paymentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  alert('Form submitted!');

  // Create FormData to include text + file
  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('email', document.getElementById('email').value);
  formData.append('amount', document.getElementById('amount').value);
  formData.append('paymentProof', document.getElementById('paymentProof').files[0]);

  try {
    const response = await fetch('https://imf-payment-oxide.onrender.com/api/payment', {
      method: 'POST',
      body: formData // No need to set headers for FormData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const result = await response.json();
    console.log("Success:", result);
    alert('Payment successful! Check your email for confirmation and receipt.');

    // Optionally reset the form
    document.getElementById('paymentForm').reset();

  } catch (error) {
    console.error("Error:", error);
    alert('Error: ' + error.message);
  }
});
