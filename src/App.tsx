import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LoginPage } from './pages/LoginPage';
import { GamePage } from './pages/GamePage';
import { useGame } from './context/GameContext';
import './App.css';

const AppContent = () => {
  const { gameState } = useGame();
  
  const getHeaderText = () => {
    if (gameState.gameOver && gameState.winner) {
      const winnerColor = gameState.winner === gameState.whitePlayer ? 'White' : 'Black';
      return `Game Over - ${gameState.winner} (${winnerColor}) Wins!`;
    }
    return `Chess Game - ${gameState.turn === 'white' ? "White's" : "Black's"} Turn`;
  };
  
  const headerStyle = {
    backgroundColor: gameState.gameOver 
      ? '#2c3e50' // Dark blue for game over
      : gameState.turn === 'white' ? '#ebecd0' : '#779556',
    color: gameState.gameOver || gameState.turn === 'black' ? '#fff' : '#000',
    transition: 'background-color 0.3s ease'
  };

  return (
    <div className="app">
      <header className="app-header" style={headerStyle}>
        <h1>{getHeaderText()}</h1>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <Router basename="/chess">
        <AppContent />
      </Router>
    </GameProvider>
  );
}

export default App;
