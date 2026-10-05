import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'May problema sa server');
    } finally {
      setSubmitting(false);
    }
  };

  const input = { width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', padding: 16 }}>
      <h1>IMS Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
          required
        />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: 14, fontSize: 16, border: 'none', borderRadius: 8, background: '#2563eb', color: 'white' }}
        >
          {submitting ? 'Naglo-login...' : 'Login'}
        </button>
      </form>
    </div>
  );
}