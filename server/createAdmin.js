require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.log('Gamit: node createAdmin.js "Pangalan" email@example.com password');
  process.exit(1);
}

(async () => {
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role`,
      [name, email.toLowerCase().trim(), hash]
    );
    console.log('Admin created:', result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      console.log('Existing na ang email na ito');
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
})();