document.getElementById('paymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const paymentData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        amount: document.getElementById('amount').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const result = await response.json();
        console.log("Success:", result);
        alert('Payment details saved! Check your email for confirmation.');

    } catch (error) {
        console.error("Error:", error);
        alert('Error: ' + error.message);
    }

    const multer = require('multer');
    const upload = multer({ dest: 'uploads/' });

// Update your POST route
    app.post('/api/payment', upload.single('paymentProof'), async (req, res) => {
        // req.file contains the uploaded file
        console.log('Uploaded file:', req.file);
        // Add file path to your MongoDB document
    });

    // Add to server.js
    app.get('/api/payments', async (req, res) => {
        const payments = await Payment.find().sort({ date: -1 });
        res.json(payments);
    });

    const basicAuth = require('express-basic-auth');

    app.use('/admin', basicAuth({
        users: { admin: 'SecurePassword123' },
        challenge: true
    }));

    // In server.js
    const { body, validationResult } = require('express-validator');

    app.post('/api/payment',
        [
            body('email').isEmail(),
            body('amount').isFloat({ min: 1 })
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // ... rest of your code
        }
    );

    const rateLimit = require('express-rate-limit');

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per window
    });

    app.use(limiter);

});