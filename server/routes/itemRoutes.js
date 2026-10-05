const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemQR,
  getItemBySku,
} = require('../controllers/itemController');
const { authenticate, requireRole } = require('../middleware/auth');

// Mga specific na route muna
router.get('/sku/:sku', authenticate, getItemBySku);
router.get('/:id/qr', getItemQR); // public, tingnan ang paliwanag sa baba

// Kahit sinong naka-login
router.get('/', authenticate, getItems);
router.get('/:id', authenticate, getItemById);

// Admin lang
router.post('/', authenticate, requireRole('admin'), createItem);
router.put('/:id', authenticate, requireRole('admin'), updateItem);
router.delete('/:id', authenticate, requireRole('admin'), deleteItem);

module.exports = router;