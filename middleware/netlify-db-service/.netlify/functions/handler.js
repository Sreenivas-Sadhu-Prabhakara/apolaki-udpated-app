/**
 * Netlify Functions handler for Apolaki API
 * Wraps Express app to run as serverless function
 * Configuration is read from environment variables via ConfigManager
 */

import dotenv from 'dotenv';
import serverless from 'serverless-http';

// Load environment variables
dotenv.config();

// Import and initialize configuration
import { configManager } from '../../../config/config.manager.js';

try {
  configManager.initialize();
  configManager.validate();
  console.log('✅ Configuration validated');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  throw error;
}

// Import Express app
import app from '../src/server.js';

// Wrap Express app for Netlify Functions
const handler = serverless(app);

// Export handler for Netlify
export default handler;
