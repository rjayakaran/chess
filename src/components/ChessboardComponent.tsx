import React, { useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGame } from '../context/GameContext';
import { Chess } from 'chess.js';

export const ChessboardComponent: React.FC = () => {
  const { gameState, currentPlayer, makeMove } = useGame();
  const game = new Chess(gameState.board);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (!currentPlayer) return false;

      // Check if it's the current player's turn
      const isWhiteTurn = game.turn() === 'w';
      const isCurrentPlayerWhite = currentPlayer.color === 'white';
      if (isWhiteTurn !== isCurrentPlayerWhite) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // Always promote to queen for simplicity
        });

        if (move === null) return false;

        makeMove(move.san);
        return true;
      } catch (error) {
        return false;
      }
    },
    [game, currentPlayer, makeMove]
  );

  return (
    <div className="chessboard-container">
      <Chessboard
        position={gameState.board}
        onPieceDrop={onDrop}
        boardWidth={400}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#779556' }}
        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
      />
    </div>
  );
}; 