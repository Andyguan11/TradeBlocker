import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import React from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      if (!data.user) throw new Error('User not created');

      // Create user_settings entry
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({ user_id: data.user.id, block_state: 'inactive' });
      
      if (settingsError) throw settingsError;

      alert('Signup successful! Please check your email for verification.');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <div>
        <h2>Install Browser Extension</h2>
        <p>To use the TradingView Element Blocker, please install our browser extension:</p>
        <ul>
          <li><a href="#chrome-extension-link">Chrome Extension</a></li>
          <li><a href="#firefox-extension-link">Firefox Extension</a></li>
        </ul>
        <p>After installation, log in to the extension using your account credentials.</p>
      </div>
    </div>
  );
}