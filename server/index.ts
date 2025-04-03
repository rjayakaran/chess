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
    : 'http://localhost:5173',
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
  const { identity } = req.body;
  
  // TODO: Implement proper player selection logic
  res.json({
    success: true,
    color: Math.random() > 0.5 ? 'white' : 'black',
    token: 'dummy-token',
  });
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
    };

    if (!game.whitePlayer) {
      game.whitePlayer = player;
      console.log('Assigned white to:', player);
    } else if (!game.blackPlayer) {
      game.blackPlayer = player;
      console.log('Assigned black to:', player);
    }

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
        io.emit('game_update', {
          board: chess.fen(),
          turn: chess.turn() === 'w' ? 'white' : 'black',
          whitePlayer: game.whitePlayer,
          blackPlayer: game.blackPlayer,
          gameOver: chess.isGameOver(),
          winner: chess.isGameOver() ? player : null,
          moveHistory: chess.history(),
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
    const game = {
      chess: new Chess(),
      whitePlayer: null,
      blackPlayer: null,
    };
    games.set(gameId, game);

    io.emit('game_update', {
      board: game.chess.fen(),
      turn: 'white',
      whitePlayer: null,
      blackPlayer: null,
      gameOver: false,
      winner: null,
      moveHistory: [],
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

const startServer = (port: number) => {
  if (httpServer.listening) {
    httpServer.close();
  }
  
  httpServer.listen(port, () => {
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
};

startServer(currentPort); 