const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'internationalministersforumafr@gmail.com',
    pass: 'nrzb liwm wuvk zhph'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email server connection failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Middleware
app.use(cors({
  origin: ['https://imf-payment-xdde.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb+srv://IMFAdmin:Danfix1144@imf-payments.kjvk9nv.mongodb.net/IMF?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

// Payment Model
const Payment = mongoose.model('Payment', {
  name: String,
  email: String,
  amount: Number,
  paymentProof: String,
  date: { type: Date, default: Date.now }
});

// File Upload Setup
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'public/uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use(limiter);

// Admin Routes
app.use('/admin', basicAuth({
  users: { admin: 'SecurePassword123' },
  challenge: true,
  unauthorizedResponse: 'Unauthorized Access'
}));

// Payment Endpoint
app.post('/api/payment', upload.single('paymentProof'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = new Payment({
      name: req.body.name,
      email: req.body.email,
      amount: req.body.amount,
      paymentProof: req.file ? `/uploads/${req.file.filename}` : null
    });

    const savedPayment = await payment.save();
    const paymentDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send Email Receipt
    try {
      const mailOptions = {
        from: '"IMF Africa Payments" <internationalministersforumafr@gmail.com>',
        to: req.body.email,
        subject: `Payment Confirmation #${savedPayment._id.toString().slice(-6)}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .receipt { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Payment Receipt</h2>
            </div>
            <p>Dear ${req.body.name},</p>
            <p>Thank you for your payment to IMF Africa. Here are your transaction details:</p>
            
            <div class="receipt">
              <h3>Transaction Summary</h3>
              <table>
                <tr><th>Amount Paid:</th><td>₦${req.body.amount.toLocaleString()}</td></tr>
                <tr><th>Date:</th><td>${paymentDate}</td></tr>
                <tr><th>Transaction ID:</th><td>${savedPayment._id}</td></tr>
                <tr><th>Status:</th><td style="color: green;">Completed</td></tr>
              </table>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>IMF Africa Team</p>
          </div>
        </body>
        </html>
        `,
        attachments: req.file ? [{
          filename: 'payment_proof.jpg',
          path: path.join(__dirname, 'public/uploads', req.file.filename)
        }] : []
      };

      await transporter.sendMail(mailOptions);
      console.log('Receipt email sent to:', req.body.email);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.json({
      success: true,
      payment: savedPayment,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Other Endpoints
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});