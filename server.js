const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

// Connect to MongoDB (replace with your connection string)
mongoose.connect('mongodb+srv://IMFAdmin:Danfix1144@imf-payments.kjvk9nv.mongodb.net/IMF?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Create a payment model
const Payment = mongoose.model('Payment', {
    name: String,
    email: String,
    amount: Number,
    date: { type: Date, default: Date.now }
});

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'danielojolex@gmail.com',
        pass: 'asao lzhd ruvy anrs'
    }
});

app.use(express.json());
app.use(express.static('public'));

app.post('/api/payment', async (req, res) => {
    console.log('Incoming request body:', req.body); // Log the received data

    try {
        // Validate required fields
        if (!req.body.name || !req.body.email || !req.body.amount) {
            throw new Error('Missing required fields');
        }

        const payment = new Payment({
            name: req.body.name,
            email: req.body.email,
            amount: parseFloat(req.body.amount) // Ensure amount is a number
        });

        const savedPayment = await payment.save();
        console.log('Saved payment:', savedPayment);

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: 'IMF Payment Received',
            text: `Hello ${req.body.name},\n\nThank you for your payment of $${req.body.amount}.`
        });

        res.json({ success: true, payment: savedPayment });

    } catch (error) {
        console.error('SERVER ERROR:', error); // Detailed error logging
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});