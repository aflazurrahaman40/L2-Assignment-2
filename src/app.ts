import express, { Application } from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'DevPulse API is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
