const pool = require('../db');
const { getIO } = require('../socket');
// Stock IN / OUT
const createTransaction = async (req, res) => {
  const { item_id, type, qty } = req.body;
  const amount = Number(qty);

  if (
    !item_id ||
    !['IN', 'OUT'].includes(type) ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      message: 'Kailangan ng item_id, type (IN o OUT), at qty na buong numero na higit sa 0',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const delta = type === 'IN' ? amount : -amount;

    // Isang atomic na update: hindi papayagan kung magiging negative
    const updated = await client.query(
      `UPDATE items
       SET quantity = quantity + $1
       WHERE id = $2 AND quantity + $1 >= 0
       RETURNING *`,
      [delta, item_id]
    );

    if (updated.rows.length === 0) {
      await client.query('ROLLBACK');

      const exists = await pool.query('SELECT quantity FROM items WHERE id = $1', [item_id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: 'Hindi nakita ang item' });
      }
      return res.status(400).json({
        message: `Kulang ang stock. Available lang: ${exists.rows[0].quantity}`,
      });
    }

    const userId = req.user?.id || null;

    const tx = await client.query(
      `INSERT INTO transactions (item_id, user_id, type, qty)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [item_id, userId, type, amount]
    );

    await client.query('COMMIT');

// Ibalita sa lahat ng naka-connect, pagkatapos lang ng COMMIT
getIO()?.emit('item:updated', {
  item: updated.rows[0],
  transaction: {
    ...tx.rows[0],
    user_name: req.user?.name || null,
  },
});

res.status(201).json({ item: updated.rows[0], transaction: tx.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// History ng isang item (pinakabago muna), kasama ang pangalan ng user
const getItemTransactions = async (req, res) => {
  try {
    const { itemId } = req.params;
    const result = await pool.query(
      `SELECT t.*, u.name AS user_name
       FROM transactions t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.item_id = $1
       ORDER BY t.created_at DESC, t.id DESC
       LIMIT 20`,
      [itemId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTransaction, getItemTransactions };