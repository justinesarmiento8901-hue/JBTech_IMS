const pool = require('../db');
const QRCode = require('qrcode');
// CREATE: magdagdag ng item
const createItem = async (req, res) => {
  try {
    const { name, sku, quantity, location_id } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ message: 'name at sku ay required' });
    }

    const result = await pool.query(
      `INSERT INTO items (name, sku, quantity, location_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, sku, quantity || 0, location_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Existing na ang SKU na ito' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ: lahat ng items
const getItems = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// READ: isang item lang
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hindi nakita ang item' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE: i-edit ang item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, location_id } = req.body;

    const result = await pool.query(
      `UPDATE items
       SET name = COALESCE($1, name),
           sku = COALESCE($2, sku),
           location_id = COALESCE($3, location_id)
       WHERE id = $4
       RETURNING *`,
      [name, sku, location_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hindi nakita ang item' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Existing na ang SKU na ito' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE: magbura ng item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hindi nakita ang item' });
    }

    res.json({ message: 'Nabura na ang item' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'Hindi mabura: may transaction history na ang item na ito',
      });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// QR code bilang image (PNG) na pwedeng ipakita o i-print
const getItemQR = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT sku FROM items WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hindi nakita ang item' });
    }

    const url = `${process.env.CLIENT_URL}/scan/${encodeURIComponent(result.rows[0].sku)}`;

    res.type('png');
    await QRCode.toFileStream(res, url, { width: 300, margin: 2 });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Hanapin ang item gamit ang SKU (gagamitin ng scanner page)
const getItemBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const result = await pool.query('SELECT * FROM items WHERE sku = $1', [sku]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hindi nakita ang item' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemQR,
  getItemBySku,
};