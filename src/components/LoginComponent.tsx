import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerIdentity } from '../types/game';

export const LoginComponent: React.FC = () => {
  const { authenticate, selectPlayer, isAuthenticated } = useGame();
  const [passcode, setPasscode] = useState('');
  const [availableIdentities, setAvailableIdentities] = useState<PlayerIdentity[]>([]);
  const [error, setError] = useState('');

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (passcode.length !== 4 || !/^\d+$/.test(passcode)) {
      setError('Please enter a valid 4-digit passcode');
      return;
    }

    const response = await authenticate(passcode);
    if (response.success) {
      setAvailableIdentities(response.availableIdentities);
    } else {
      setError('Invalid passcode');
    }
  };

  const handlePlayerSelect = async (identity: PlayerIdentity) => {
    const success = await selectPlayer(identity);
    if (!success) {
      setError('Failed to select player');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="player-selection">
        <h2>Select Your Identity</h2>
        <div className="player-options">
          {availableIdentities.map((identity) => (
            <button
              key={identity}
              onClick={() => handlePlayerSelect(identity)}
              className="player-button"
            >
              {identity}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>RJ vs OJ Chess Game</h1>
      <form onSubmit={handlePasscodeSubmit} className="login-form">
        <input
          type="text"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter 4-digit passcode"
          maxLength={4}
          pattern="\d*"
          className="passcode-input"
        />
        <button type="submit" className="submit-button">
          Enter
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}; 