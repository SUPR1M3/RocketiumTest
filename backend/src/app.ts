import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import designRoutes from './routes/design.routes';
import commentRoutes from './routes/comment.routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api', (_req, res) => {
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

