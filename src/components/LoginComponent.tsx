import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export const LoginComponent: React.FC = () => {
  const { authenticate, selectPlayer } = useGame();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [preferredColor, setPreferredColor] = useState<'white' | 'black' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await authenticate(passcode);
      if (!result.success) {
        setError('Invalid passcode');
      }
    } catch (error) {
      setError('Authentication failed');
    }
  };

  const handlePlayerSelect = async (identity: string) => {
    setSelectedIdentity(identity);
    if (identity === 'OJ' && preferredColor) {
      await selectPlayer(identity as 'RJ' | 'OJ', preferredColor);
    } else if (identity === 'RJ') {
      await selectPlayer(identity as 'RJ' | 'OJ');
    }
  };

  const handleColorSelect = async (color: 'white' | 'black') => {
    setPreferredColor(color);
    if (selectedIdentity === 'OJ') {
      await selectPlayer('OJ', color);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
          className="passcode-input"
        />
        <button type="submit" className="submit-button">
          Login
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <div className="player-selection">
        <h3>Select Your Identity</h3>
        <div className="player-options">
          <button
            onClick={() => handlePlayerSelect('RJ')}
            className={`player-button ${selectedIdentity === 'RJ' ? 'selected' : ''}`}
          >
            RJ
          </button>
          <button
            onClick={() => handlePlayerSelect('OJ')}
            className={`player-button ${selectedIdentity === 'OJ' ? 'selected' : ''}`}
          >
            OJ
          </button>
        </div>
      </div>

      {selectedIdentity === 'OJ' && (
        <div className="color-selection">
          <h3>Choose Your Color</h3>
          <div className="color-options">
            <button
              onClick={() => handleColorSelect('white')}
              className={`color-button white ${preferredColor === 'white' ? 'selected' : ''}`}
              disabled={preferredColor !== null}
            >
              White
            </button>
            <button
              onClick={() => handleColorSelect('black')}
              className={`color-button black ${preferredColor === 'black' ? 'selected' : ''}`}
              disabled={preferredColor !== null}
            >
              Black
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 