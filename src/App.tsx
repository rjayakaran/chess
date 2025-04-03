import React from 'react';
import { GameProvider } from './context/GameContext';
import { LoginComponent } from './components/LoginComponent';
import { ChessboardComponent } from './components/ChessboardComponent';
import { GameInfoComponent } from './components/GameInfoComponent';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="app">
        <header className="app-header">
          <h1>RJ vs OJ Chess Game</h1>
        </header>
        <main className="app-main">
          <LoginComponent />
          <div className="game-container">
            <ChessboardComponent />
            <GameInfoComponent />
          </div>
        </main>
      </div>
    </GameProvider>
  );
}

export default App;
