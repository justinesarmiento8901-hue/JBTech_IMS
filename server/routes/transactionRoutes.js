const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getItemTransactions,
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate); // lahat ng route dito ay kailangan ng login

router.post('/', createTransaction);
router.get('/item/:itemId', getItemTransactions);

module.exports = router;