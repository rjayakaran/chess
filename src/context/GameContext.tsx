import React, { createContext, useContext, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { GameContextType, GameState, Player, PlayerIdentity } from '../types/game';
import { Socket, io } from 'socket.io-client';

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: new Chess().fen(),
    turn: 'white',
    whitePlayer: null,
    blackPlayer: null,
    gameOver: false,
    winner: null,
    moveHistory: [],
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const authenticate = useCallback(async (passcode: string) => {
    try {
      console.log('Attempting authentication with passcode:', passcode); // Debug log
      const response = await fetch('http://localhost:3001/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ passcode }),
        credentials: 'include',
      });
      
      console.log('Authentication response:', response); // Debug log
      const data = await response.json();
      console.log('Authentication data:', data); // Debug log
      
      if (data.success) {
        setIsAuthenticated(true);
        const newSocket = io('http://localhost:3001', {
          withCredentials: true
        });
        setSocket(newSocket);
      }
      return data;
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, availableIdentities: [] };
    }
  }, []);

  const selectPlayer = useCallback(async (identity: PlayerIdentity) => {
    if (!socket) return false;
    
    try {
      const response = await fetch('http://localhost:3001/api/player', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ identity }),
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrentPlayer({
          identity,
          color: data.color,
          token: data.token,
        });
        
        // Emit select_player event to server
        socket.emit('select_player', {
          player: identity,
          gameId: 'default-game', // Using a default game ID for now
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Player selection failed:', error);
      return false;
    }
  }, [socket]);

  const makeMove = useCallback((move: string) => {
    if (!socket || !currentPlayer) return;
    
    socket.emit('make_move', {
      move,
      player: currentPlayer.identity,
      gameId: 'default-game', // Using the same game ID
    });
  }, [socket, currentPlayer]);

  const startNewGame = useCallback(() => {
    if (!socket || !currentPlayer) return;
    
    socket.emit('new_game', {
      player: currentPlayer.identity,
      gameId: 'default-game',
    });
  }, [socket, currentPlayer]);

  const resign = useCallback(() => {
    if (!socket || !currentPlayer) return;
    
    socket.emit('resign', {
      player: currentPlayer.identity,
      gameId: 'default-game',
    });
  }, [socket, currentPlayer]);

  React.useEffect(() => {
    if (!socket) return;

    socket.on('game_update', (newState: GameState) => {
      setGameState(newState);
    });

    socket.on('game_over', (winner: PlayerIdentity) => {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner,
      }));
    });

    return () => {
      socket.off('game_update');
      socket.off('game_over');
    };
  }, [socket]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentPlayer,
        makeMove,
        startNewGame,
        resign,
        isAuthenticated,
        authenticate,
        selectPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 