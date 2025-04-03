# RJ vs OJ Chess Game

A real-time multiplayer chess game built with React, TypeScript, and Socket.io. This game allows two players (RJ and OJ) to play chess against each other using a 4-digit passcode for authentication.

## Features

- Real-time multiplayer gameplay
- 4-digit passcode authentication
- Player identity selection (RJ or OJ)
- Move validation and game state management
- Move history tracking
- Responsive design for desktop and mobile

## Tech Stack

- Frontend:
  - React.js with TypeScript
  - Vite for development and building
  - chess.js for chess logic
  - react-chessboard for board visualization
  - Socket.io-client for real-time communication

- Backend:
  - Node.js with Express
  - Socket.io for real-time communication
  - chess.js for game logic validation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Playing the Game

1. Enter the passcode: `1234`
2. Select your player identity (RJ or OJ)
3. Start playing chess!

## Development

The project is structured as follows:

- `src/` - Frontend source code
  - `components/` - React components
  - `context/` - React context for state management
  - `types/` - TypeScript type definitions
- `server/` - Backend server code

## License

This project is licensed under the MIT License - see the LICENSE file for details.
