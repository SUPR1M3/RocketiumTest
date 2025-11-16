import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import designRoutes from './routes/design.routes';
import commentRoutes from './routes/comment.routes';

const app: Application = express();

// CORS configuration
// Support multiple origins (comma-separated) or single origin
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (_req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'Canvas Editor API',
    version: '1.0.0',
    endpoints: {
      designs: '/api/designs',
      comments: '/api/designs/:id/comments',
    },
  });
});

// API Routes
app.use('/api/designs', designRoutes);
app.use('/api/designs', commentRoutes);

// Error handling - must be last
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

