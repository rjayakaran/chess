export type PlayerIdentity = 'RJ' | 'OJ';

export interface GameState {
  board: string; // FEN string
  turn: 'white' | 'black';
  whitePlayer: PlayerIdentity | null;
  blackPlayer: PlayerIdentity | null;
  gameOver: boolean;
  winner: PlayerIdentity | null;
  moveHistory: string[];
}

export interface Player {
  identity: PlayerIdentity;
  color: 'white' | 'black';
  token: string;
}

export interface AuthResponse {
  success: boolean;
  availableIdentities: PlayerIdentity[];
  token?: string;
}

export interface GameContextType {
  gameState: GameState;
  currentPlayer: Player | null;
  makeMove: (move: string) => void;
  startNewGame: () => void;
  resign: () => void;
  isAuthenticated: boolean;
  authenticate: (passcode: string) => Promise<AuthResponse>;
  selectPlayer: (identity: PlayerIdentity) => Promise<boolean>;
} 