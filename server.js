const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// === FIX: Trust proxy for Render/hosting ===
app.set('trust proxy', 1);  // 👈 Add this line

// === MongoDB Connection ===
mongoose.connect('mongodb+srv://IMFAdmin:Danfix1144@imf-payments.kjvk9nv.mongodb.net/IMF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// === MongoDB Model ===
const Payment = mongoose.model('Payment', {
  name: String,
  email: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});

// === Email Setup ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'internationalministersforumafr@gmail.com',
    pass: 'nrzb liwm wuvk zhph' // Consider using environment variables instead
  }
});

// === Middleware ===
app.use(express.json());
app.use(express.static('public'));

// === Rate Limiter ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// === Admin Basic Auth ===
app.use('/admin', basicAuth({
  users: { admin: 'SecurePassword123' },
  challenge: true
}));

// === Payment Endpoint ===
app.post(
  '/api/payment',
  upload.single('paymentProof'),
  [
    body('email').isEmail(),
    body('amount').isFloat({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const payment = new Payment({
        name: req.body.name,
        email: req.body.email,
        amount: parseFloat(req.body.amount),
      });

      const savedPayment = await payment.save();

      // === Email to Admin ===
      await transporter.sendMail({
        from: 'internationalministersforumafr@gmail.com',
        to: 'danielojolex@gmail.com',
        subject: 'New IMF Payment Received',
        text: `New payment received from ${req.body.name} (₦${req.body.amount})\nEmail: ${req.body.email}`
      });

      // === Email to Payer === (No payment proof included)
      await transporter.sendMail({
        from: 'internationalministersforumafr@gmail.com',
        to: req.body.email,
        subject: 'IMF Africa Payment Receipt',
        text: `Hello ${req.body.name},\n\nThank you for your payment of ₦${req.body.amount}.\n\nWe have received your payment and it has been recorded.\n\nIf you have any questions, reply to this email.\n\nRegards,\nInternational Ministers Forum Africa`
      });

      res.json({ success: true, payment: savedPayment });
    } catch (error) {
      console.error('SERVER ERROR:', error);
      res.status(500).json({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// === Get All Payments (Admin use) ===
app.get('/api/payments', async (req, res) => {
  const payments = await Payment.find().sort({ date: -1 });
  res.json(payments);
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

