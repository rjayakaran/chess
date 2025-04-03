export type PlayerIdentity = 'RJ' | 'OJ';

export type GameState = {
  board: string;
  turn: 'white' | 'black';
  whitePlayer: string | null;
  blackPlayer: string | null;
  gameOver: boolean;
  winner: string | null;
  moveHistory: string[];
  currentPlayer: string | null;
};

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