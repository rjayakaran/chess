import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { Chess } from 'chess.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Add root endpoint handler
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Chess server is running' });
});

const PORT = process.env.PORT || 3001;
const MAX_PORT_ATTEMPTS = 8;
let currentPort: number = parseInt(PORT as string);
let serverInstance: HttpServer | null = null;
let io: SocketServer | null = null;

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

const startServer = (port: number) => {
  try {
    // Create HTTP server instance
    serverInstance = new HttpServer(app);
    
    // Initialize Socket.IO
    io = new SocketServer(serverInstance, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Socket.io connection handling
    io.on('connection', (socket: Socket) => {
      console.log('Client connected');

      socket.on('authenticate', (passcode: string) => {
        // ... existing code ...
      });

      socket.on('select_player', (data: { player: string; gameId: string }) => {
        console.log('Player selected:', data.player, 'for game:', data.gameId);
        const game = games.get(data.gameId) || {
          chess: new Chess(),
          whitePlayer: null,
          blackPlayer: null,
          selectedColor: null
        };

        // If OJ is white, RJ should be black and vice versa
        if (data.player === 'OJ') {
          if (!game.whitePlayer && !game.blackPlayer) {
            game.whitePlayer = data.player;
            game.blackPlayer = 'RJ';  // Automatically assign RJ as black
            console.log('Assigned white to OJ and black to RJ');
          } else if (!game.blackPlayer) {
            game.blackPlayer = data.player;
            game.whitePlayer = 'RJ';  // Automatically assign RJ as white
            console.log('Assigned black to OJ and white to RJ');
          }
        } else if (data.player === 'RJ') {
          if (!game.whitePlayer && !game.blackPlayer) {
            game.whitePlayer = data.player;
            game.blackPlayer = 'OJ';  // Automatically assign OJ as black
            console.log('Assigned white to RJ and black to OJ');
          } else if (!game.blackPlayer) {
            game.blackPlayer = data.player;
            game.whitePlayer = 'OJ';  // Automatically assign OJ as white
            console.log('Assigned black to RJ and white to OJ');
          }
        }

        // Save the updated game state
        games.set(data.gameId, game);
        
        // Send game state to all clients
        io?.emit('game_update', {
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

      socket.on('make_move', (data: { move: string; player: string; gameId: string }) => {
        console.log('Move attempted:', data.move, 'by player:', data.player, 'in game:', data.gameId);
        const game = games.get(data.gameId);
        if (!game) {
          console.log('Game not found:', data.gameId);
          return;
        }

        try {
          const chess = game.chess;
          const result = chess.move(data.move);

          if (result) {
            console.log('Move successful:', result.san);
            
            // Determine whose turn it is next
            const nextTurn = chess.turn() === 'w' ? 'white' : 'black';
            const nextPlayer = nextTurn === 'white' ? game.whitePlayer : game.blackPlayer;
            
            // Check for game over conditions
            const isGameOver = chess.isGameOver();
            const isCheckmate = chess.isCheckmate();
            const isDraw = chess.isDraw();
            
            console.log('Game state:', {
              isGameOver,
              isCheckmate,
              isDraw,
              nextTurn,
              nextPlayer
            });
            
            // Save the updated game state
            games.set(data.gameId, game);

            io?.emit('game_update', {
              board: chess.fen(),
              turn: nextTurn,
              whitePlayer: game.whitePlayer,
              blackPlayer: game.blackPlayer,
              gameOver: isGameOver,
              winner: isCheckmate ? data.player : null,
              moveHistory: chess.history(),
              currentPlayer: isGameOver ? null : nextPlayer
            });
          } else {
            console.log('Invalid move');
          }
        } catch (error) {
          console.error('Move error:', error);
        }
      });

      socket.on('request_new_game', (data: { player: string; gameId: string }) => {
        console.log('New game requested by:', data.player);
        const existingGame = games.get(data.gameId);
        const game = {
          chess: new Chess(),
          whitePlayer: existingGame?.whitePlayer || null,
          blackPlayer: existingGame?.blackPlayer || null,
          selectedColor: null
        };
        games.set(data.gameId, game);

        io?.emit('game_update', {
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

        io?.emit('game_over', player === game.whitePlayer ? game.blackPlayer : game.whitePlayer);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Start listening on the port
    serverInstance.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error(`Failed to start server on port ${port}:`, error);
    if (port < currentPort + MAX_PORT_ATTEMPTS) {
      console.log(`Attempting to start on next port: ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Max port attempts reached. Server failed to start.');
      process.exit(1);
    }
  }
};

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Start the server
startServer(currentPort); 