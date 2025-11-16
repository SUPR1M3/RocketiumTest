# Canvas-based Design Editor

A collaborative canvas-based design editor built with React, Redux, Fabric.js, Node.js, Express, and MongoDB.

## Features

- Canvas-based design editor with text, images, and shapes
- Real-time multi-user collaboration
- Layer management with reordering, renaming, and deletion
- Undo/Redo functionality (10+ actions)
- Export designs to PNG
- Comments with @mentions
- Persistent storage in MongoDB

## Tech Stack

### Frontend
- React 18 + TypeScript
- Redux Toolkit for state management
- Fabric.js for canvas manipulation
- Vite for build tooling
- React Router for navigation
- Axios for API calls
- React Toastify for notifications

### Backend
- Node.js + Express
- TypeScript
- MongoDB with Mongoose ODM
- Zod for runtime validation
- Socket.io for real-time collaboration

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local installation)

## Setup Instructions

### 1. Install MongoDB locally

**Windows:**
Download from https://www.mongodb.com/try/download/community

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
```

### 2. Start MongoDB

```bash
# Windows (as service)
net start MongoDB

# macOS/Linux
mongosh
# or
sudo systemctl start mongod
```

### 3. Install dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 4. Set up environment variables

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/canvas-editor
NODE_ENV=development
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

### 5. Run the application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `https://canvas-editor-frontend.onrender.com`
The backend API will be available at `https://canvas-editor-backend.onrender.com`

## Testing

### Run backend tests
```bash
cd backend
npm test
```

### Run frontend tests
```bash
cd frontend
npm test
```

### Run E2E tests
```bash
cd frontend
npm run test:e2e
```

## Project Structure

```
.
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature-specific components
│   │   ├── store/        # Redux store and slices
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── hooks/        # Custom React hooks
│   └── tests/            # Frontend tests
│
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── validators/   # Zod validators
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   └── tests/            # Backend tests
│
└── .cursor/              # Cursor IDE rules and documentation
```

## API Endpoints

### Designs
- `POST /api/designs` - Create a new design
- `GET /api/designs` - List all designs
- `GET /api/designs/:id` - Get a single design
- `PUT /api/designs/:id` - Update a design
- `DELETE /api/designs/:id` - Delete a design

### Comments
- `POST /api/designs/:id/comments` - Add a comment
- `GET /api/designs/:id/comments` - Get all comments for a design

## Development Notes

### AI Assistance
This project was developed with assistance from Claude (Anthropic) for:
- Architecture planning and design decisions
- Code generation and implementation
- Testing strategy
- Documentation

## License

MIT

