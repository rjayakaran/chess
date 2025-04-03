import React from 'react';
import { useGame } from '../context/GameContext';

export const GameInfoComponent: React.FC = () => {
  const { gameState, currentPlayer, startNewGame, resign } = useGame();

  const getTurnMessage = () => {
    if (!currentPlayer) return 'Waiting for players...';
    if (gameState.gameOver) {
      return gameState.winner
        ? `Game Over! ${gameState.winner} wins!`
        : 'Game Over!';
    }
    const isCurrentPlayerTurn =
      (gameState.turn === 'white' && currentPlayer.color === 'white') ||
      (gameState.turn === 'black' && currentPlayer.color === 'black');
    return isCurrentPlayerTurn ? 'Your turn!' : "Opponent's turn";
  };

  return (
    <div className="game-info">
      <div className="game-status">
        <h2>Game Status</h2>
        <p className="turn-message">{getTurnMessage()}</p>
        <p className="player-info">
          You are playing as {currentPlayer?.identity} ({currentPlayer?.color})
        </p>
      </div>

      <div className="game-controls">
        <button
          onClick={startNewGame}
          className="control-button"
          disabled={!currentPlayer}
        >
          New Game
        </button>
        <button
          onClick={resign}
          className="control-button"
          disabled={!currentPlayer || gameState.gameOver}
        >
          Resign
        </button>
      </div>

      <div className="move-history">
        <h3>Move History</h3>
        <div className="moves-list">
          {gameState.moveHistory.map((move, index) => (
            <span key={index} className="move">
              {move}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}; 