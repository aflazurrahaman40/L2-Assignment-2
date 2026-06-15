import app from './app';
import { initDB } from './db';
import config from './config/env';

const startServer = async (): Promise<void> => {
  await initDB();

  app.listen(config.port, () => {
    console.log(`DevPulse API running on port ${config.port}`);
  });
};

startServer();
