const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const cors = require('cors'); // Added for CORS support
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('trust proxy', 1);
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb+srv://IMFAdmin:Danfix1144@imf-payments.kjvk9nv.mongodb.net/IMF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// MongoDB Model
const Payment = mongoose.model('Payment', {
  name: String,
  email: String,
  amount: Number,
  paymentProof: String,
  date: { type: Date, default: Date.now }
});

// Email Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'internationalministersforumafr@gmail.com',
    pass: 'nrzb liwm wuvk zhph'
  }
});

// File Upload
const upload = multer({ dest: 'uploads/' });

// Rate Limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Admin Basic Auth
app.use('/admin', basicAuth({
  users: { admin: 'SecurePassword123' },
  challenge: true
}));

// Payment Endpoint
app.post('/api/payment', upload.single('paymentProof'), [
  body('email').isEmail(),
  body('amount').isFloat({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const payment = new Payment({
      name: req.body.name,
      email: req.body.email,
      amount: req.body.amount,
      paymentProof: req.file?.path
    });

    const savedPayment = await payment.save();

    await transporter.sendMail({
      from: 'internationalministersforumafr@gmail.com',
      to: req.body.email,
      subject: 'IMF Africa Payment Received',
      text: `Hello ${req.body.name},\n\nThank you for your payment of ₦${req.body.amount}.`
    });

    res.json({ success: true, payment: savedPayment });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get Payments
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`); // Fixed template literal
});
