import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Basic validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(), // PR-04 trigger reads this
          username,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already in use. Try logging in instead.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Check your email for the confirmation link!');
    }

    setLoading(false);
  };

  // Keep M2's JSX exactly as is — just make sure these are connected:
  // - form onSubmit={handleRegister}
  // - firstName input: value={firstName} onChange={(e) => setFirstName(e.target.value)}
  // - lastName input: value={lastName} onChange={(e) => setLastName(e.target.value)}
  // - username input: value={username} onChange={(e) => setUsername(e.target.value)}
  // - email input: value={email} onChange={(e) => setEmail(e.target.value)}
  // - password input: value={password} onChange={(e) => setPassword(e.target.value)}
  // - error display: {error && <p className="text-red-500 text-sm">{error}</p>}
  // - success display: {message && <p className="text-green-500 text-sm">{message}</p>}
}