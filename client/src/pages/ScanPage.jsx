import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { getSocket } from '../api/socket';
export default function ScanPage() {
  const { sku } = useParams();
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const itemRes = await api.get(`/items/sku/${encodeURIComponent(sku)}`);
      setItem(itemRes.data);
      const histRes = await api.get(`/transactions/item/${itemRes.data.id}`);
      setHistory(histRes.data);
      setError('');
    } catch (err) {
      setItem(null);
      setError(
        err.response?.status === 404
          ? 'Hindi nakita ang item na ito'
          : 'May problema sa server'
      );
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
  let socket;
  let timer;

  const onUpdated = ({ item: updatedItem, transaction }) => {
    // Tingnan lang kung ito ang item na tinitingnan natin
    setItem((current) => {
      if (!current || current.id !== updatedItem.id) return current;
      return updatedItem;
    });
    setHistory((prev) => {
      if (prev.length && prev[0].item_id !== transaction.item_id) return prev;
      if (transaction.item_id !== item?.id) return prev;
      // Iwasan ang doble kung nandoon na
      if (prev.some((t) => t.id === transaction.id)) return prev;
      return [transaction, ...prev].slice(0, 20);
    });
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
}, [item?.id]);

  const submit = async (type) => {
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      await api.post('/transactions', {
        item_id: item.id,
        type,
        qty: Number(qty),
      });
      setMessage(type === 'IN' ? `Nadagdag ang ${qty}` : `Nabawas ang ${qty}`);
      setQty(1);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'May problema sa server');
    } finally {
      setSubmitting(false);
    }
  };

  const btn = (bg) => ({
    flex: 1,
    padding: 14,
    fontSize: 16,
    border: 'none',
    borderRadius: 8,
    color: 'white',
    background: bg,
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.6 : 1,
  });

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>
      <Link to="/">← Balik sa listahan</Link>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {item && (
        <>
          <div style={{ marginTop: 16, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2 style={{ marginTop: 0 }}>{item.name}</h2>
            <p><strong>SKU:</strong> {item.sku}</p>
            <p style={{ fontSize: 32, margin: '8px 0' }}>
              <strong>{item.quantity}</strong>{' '}
              <span style={{ fontSize: 16 }}>pcs sa stock</span>
            </p>

            <label>
              Dami:{' '}
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ width: 80, padding: 8, fontSize: 16 }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={btn('#16a34a')} disabled={submitting} onClick={() => submit('IN')}>
                + Stock In
              </button>
              <button style={btn('#dc2626')} disabled={submitting} onClick={() => submit('OUT')}>
                − Stock Out
              </button>
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>Huling mga galaw</h3>
          {history.length === 0 && <p>Wala pang galaw.</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {history.map((t) => (
              <li
                key={t.id}
                style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}
              >
                <strong style={{ color: t.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                  {t.type === 'IN' ? '+' : '−'}{t.qty}
                </strong>{' '}
                <span style={{ color: '#666', fontSize: 14 }}>
  {new Date(t.created_at).toLocaleString()} · {t.user_name || 'Unknown'}
</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}