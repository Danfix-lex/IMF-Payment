const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer'); // Uncommented since it's being used
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const fs = require('fs'); // Added for file handling
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection - added error handling
mongoose.connect('mongodb+srv://IMFAdmin:Danfix1144@imf-payments.kjvk9nv.mongodb.net/IMF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Model
const Payment = mongoose.model('Payment', {
  name: String,
  email: String,
  amount: Number,
  paymentProof: String,
  date: { type: Date, default: Date.now }
});

// Email Setup - added error handling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'internationalministersforumafr@gmail.com',
    pass: 'nrzb liwm wuvk zhph'
  }
});

// File Upload - added validation
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate Limiter - added handler
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

app.use(limiter);

// Admin Basic Auth
app.use('/admin', basicAuth({
  users: { admin: 'SecurePassword123' },
  challenge: true,
  unauthorizedResponse: 'Unauthorized Access'
}));

// Payment Endpoint - improved error handling
app.post('/api/payment', upload.single('paymentProof'), [
  body('email').isEmail().normalizeEmail(),
  body('amount').isFloat({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = new Payment({
      name: req.body.name,
      email: req.body.email,
      amount: req.body.amount,
      paymentProof: req.file?.path
    });

    const savedPayment = await payment.save();

    // Send email
    await transporter.sendMail({
      from: 'internationalministersforumafr@gmail.com',
      to: req.body.email,
      subject: 'IMF Africa Payment Received',
      text: `Hello ${req.body.name},\n\nThank you for your payment of ₦${req.body.amount}.`,
      html: `<p>Hello ${req.body.name},</p><p>Thank you for your payment of <strong>₦${req.body.amount}</strong>.</p>`
    });

    res.json({ success: true, payment: savedPayment });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Payment Error:', error);
    next(error); // Pass to error handler
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Get Payments - added error handling
app.get('/api/payments', async (req, res, next) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
