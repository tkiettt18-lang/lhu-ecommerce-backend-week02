
const express = require('express');
const router = express.Router();

const {
    createPaymentQR,
    confirmPayment
} = require('../controllers/paymentController');

router.post('/create-qr', createPaymentQR);
router.post('/confirm-paid', confirmPayment);

module.exports = router;
