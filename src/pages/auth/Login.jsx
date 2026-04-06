import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email before logging in.');
      } else {
        setError(error.message);
      }
    } else {
      // AuthContext login guard will handle INACTIVE check automatically
      navigate('/customers');
    }

    setLoading(false);
  };

  // Keep M2's JSX exactly as is — just make sure these are connected:
  // - form onSubmit={handleLogin}
  // - email input: value={email} onChange={(e) => setEmail(e.target.value)}
  // - password input: value={password} onChange={(e) => setPassword(e.target.value)}
  // - submit button: disabled={loading}
  // - error display: {error && <p className="text-red-500 text-sm">{error}</p>}
}