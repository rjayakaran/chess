import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Get port from environment variable or use 3001 as default
const PORT = parseInt(process.env.PORT || '3001', 10);

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rjayakaran.github.io'] // Your GitHub Pages URL
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Local development URLs
  methods: ['GET', 'POST'],
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});

// Enable CORS for all routes
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// In-memory game state
const games = new Map<string, {
  chess: Chess;
  whitePlayer: string | null;
  blackPlayer: string | null;
  selectedColor: 'white' | 'black' | null;
}>();

// Authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { passcode } = req.body;
  console.log('Received passcode:', passcode); // Debug log
  
  if (passcode === '1234') {
    next();
  } else {
    res.status(401).json({ success: false, availableIdentities: [] });
  }
};

// Routes
app.post('/api/auth', authenticate, (req, res) => {
  console.log('Authentication successful'); // Debug log
  res.json({
    success: true,
    availableIdentities: ['RJ', 'OJ'],
  });
});

app.post('/api/player', (req, res) => {
  const { identity, preferredColor } = req.body;
  const game = games.get('default-game') || {
    chess: new Chess(),
    whitePlayer: null,
    blackPlayer: null,
    selectedColor: null,
  };
  
  // If OJ is selecting, they get to choose the color
  if (identity === 'OJ' && preferredColor) {
    game.selectedColor = preferredColor;
    games.set('default-game', game);
    res.json({
      success: true,
      color: preferredColor,
      token: 'dummy-token',
    });
  } 
  // If RJ is selecting, they get the opposite color of what OJ chose
  else if (identity === 'RJ' && game.selectedColor) {
    const color = game.selectedColor === 'white' ? 'black' : 'white';
    res.json({
      success: true,
      color,
      token: 'dummy-token',
    });
  }
  // If no color is selected yet, assign randomly
  else {
    const color = Math.random() > 0.5 ? 'white' : 'black';
    res.json({
      success: true,
      color,
      token: 'dummy-token',
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('select_player', ({ player, gameId }) => {
    console.log('Player selected:', player, 'for game:', gameId);
    const game = games.get(gameId) || {
      chess: new Chess(),
      whitePlayer: null,
      blackPlayer: null,
      selectedColor: null
    };

    // If OJ is white, RJ should be black and vice versa
    if (player === 'OJ') {
      if (!game.whitePlayer && !game.blackPlayer) {
        game.whitePlayer = player;
        game.blackPlayer = 'RJ';  // Automatically assign RJ as black
        console.log('Assigned white to OJ and black to RJ');
      } else if (!game.blackPlayer) {
        game.blackPlayer = player;
        game.whitePlayer = 'RJ';  // Automatically assign RJ as white
        console.log('Assigned black to OJ and white to RJ');
      }
    } else if (player === 'RJ') {
      if (!game.whitePlayer && !game.blackPlayer) {
        game.whitePlayer = player;
        game.blackPlayer = 'OJ';  // Automatically assign OJ as black
        console.log('Assigned white to RJ and black to OJ');
      } else if (!game.blackPlayer) {
        game.blackPlayer = player;
        game.whitePlayer = 'OJ';  // Automatically assign OJ as white
        console.log('Assigned black to RJ and white to OJ');
      }
    }

    // Save the updated game state
    games.set(gameId, game);
    
    // Send game state to all clients
    io.emit('game_update', {
      board: game.chess.fen(),
      turn: game.chess.turn() === 'w' ? 'white' : 'black',
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      gameOver: false,
      winner: null,
      moveHistory: game.chess.history(),
      currentPlayer: game.chess.turn() === 'w' ? game.whitePlayer : game.blackPlayer
    });
  });

  socket.on('make_move', ({ move, player, gameId }) => {
    console.log('Move attempted:', move, 'by player:', player, 'in game:', gameId);
    const game = games.get(gameId);
    if (!game) {
      console.log('Game not found:', gameId);
      return;
    }

    try {
      const chess = game.chess;
      const result = chess.move(move);

      if (result) {
        console.log('Move successful:', result.san);
        
        // Determine whose turn it is next
        const nextTurn = chess.turn() === 'w' ? 'white' : 'black';
        const nextPlayer = nextTurn === 'white' ? game.whitePlayer : game.blackPlayer;
        
        console.log('Next turn:', nextTurn, 'Next player:', nextPlayer);
        console.log('Current game state - White:', game.whitePlayer, 'Black:', game.blackPlayer);

        // Save the updated game state
        games.set(gameId, game);

        io.emit('game_update', {
          board: chess.fen(),
          turn: nextTurn,
          whitePlayer: game.whitePlayer,
          blackPlayer: game.blackPlayer,
          gameOver: chess.isGameOver(),
          winner: chess.isGameOver() ? player : null,
          moveHistory: chess.history(),
          currentPlayer: nextPlayer
        });
      } else {
        console.log('Invalid move');
      }
    } catch (error) {
      console.error('Move error:', error);
    }
  });

  socket.on('new_game', ({ player, gameId }) => {
    console.log('New game requested by:', player);
    const existingGame = games.get(gameId);
    const game = {
      chess: new Chess(),
      whitePlayer: existingGame?.whitePlayer || null,
      blackPlayer: existingGame?.blackPlayer || null,
      selectedColor: null
    };
    games.set(gameId, game);

    io.emit('game_update', {
      board: game.chess.fen(),
      turn: 'white',
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      gameOver: false,
      winner: null,
      moveHistory: [],
      currentPlayer: game.whitePlayer
    });
  });

  socket.on('resign', ({ player, gameId }) => {
    console.log('Player resigned:', player);
    const game = games.get(gameId);
    if (!game) return;

    io.emit('game_over', player === game.whitePlayer ? game.blackPlayer : game.whitePlayer);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server with error handling
let currentPort = PORT;
const MAX_PORT_ATTEMPTS = 10;
let serverInstance: ReturnType<typeof httpServer.listen> | null = null;

const startServer = async (port: number) => {
  try {
    // Close existing server if it exists
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance!.close(() => {
          console.log(`Closed server on port ${port}`);
          serverInstance = null;
          resolve();
        });
      });
    }

    // Start new server
    serverInstance = httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE' && currentPort < PORT + MAX_PORT_ATTEMPTS) {
        currentPort++;
        console.log(`Port ${port} is already in use. Trying port ${currentPort}`);
        startServer(currentPort);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

// Start the server
startServer(currentPort); 