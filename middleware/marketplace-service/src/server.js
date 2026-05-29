import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import marketplaceRoutes from './routes.js';
import { connectMQ } from './mq.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Enable CORS with credentials for session support
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true,
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'marketplace-service' });
});

// Marketplace Routes
app.use('/api/marketplace', marketplaceRoutes);

// Connect to MQ and Start Server
const startServer = async () => {
  await connectMQ();
  app.listen(PORT, () => {
    console.log(`Marketplace Service running on port ${PORT}`);
  });
};

startServer();
