import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ChessboardComponent } from '../components/ChessboardComponent';
import { GameInfoComponent } from '../components/GameInfoComponent';

export const GamePage: React.FC = () => {
  const { currentPlayer } = useGame();
  const navigate = useNavigate();

  // If no player is selected, redirect to login
  React.useEffect(() => {
    if (!currentPlayer) {
      navigate('/login');
    }
  }, [currentPlayer, navigate]);

  if (!currentPlayer) {
    return null;
  }

  return (
    <div className="game-container">
      <div className="game-board">
        <ChessboardComponent />
      </div>
      <GameInfoComponent />
    </div>
  );
}; 