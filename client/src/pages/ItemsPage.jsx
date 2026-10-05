import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { getSocket } from '../api/socket';
export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/items')
      .then((res) => setItems(res.data))
      .catch(() => setError('Hindi makuha ang listahan ng items'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  // Maaaring hindi pa nakakonekta ang socket sa unang render, kaya may maikling retry
  let socket = getSocket();
  let timer;

  const onUpdated = ({ item }) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };

  const attach = () => {
    socket = getSocket();
    if (socket) {
      socket.on('item:updated', onUpdated);
    } else {
      timer = setTimeout(attach, 300);
    }
  };
  attach();

  return () => {
    clearTimeout(timer);
    socket?.off('item:updated', onUpdated);
  };
}, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      <h1>Inventory</h1>
      <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
            <th>Name</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{item.name}</td>
              <td>
                <Link to={`/scan/${encodeURIComponent(item.sku)}`}>{item.sku}</Link>
              </td>
              <td>{item.quantity}</td>
              <td>
                <img
                  src={`${import.meta.env.VITE_API_URL}/items/${item.id}/qr`}
                  alt={`QR ng ${item.sku}`}
                  width={80}
                  height={80}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p>Walang items pa.</p>}
    </div>
  );
}