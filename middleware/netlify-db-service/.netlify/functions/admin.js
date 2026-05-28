/**
 * Netlify Functions handler for the Admin Control Plane.
 *
 * Local and container deployments run middleware/admin-service directly on
 * port 3002. Netlify routes /api/admin/* here as a serverless edge gateway
 * target while keeping the old customer API handler separate.
 */

import dotenv from 'dotenv';
import serverlessModule from 'serverless-http';

dotenv.config();
process.env.ADMIN_SERVICE_LISTEN = 'false';

const serverless = serverlessModule.default || serverlessModule;

let cachedHandler;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  if (!process.env.NETLIFY) process.env.NETLIFY = 'true';
  process.env.ADMIN_SERVICE_LISTEN = 'false';

  const appModule = await import('../../../admin-service/src/server.js');
  const app = appModule.default || appModule;

  cachedHandler = serverless(app, {
    binary: ['text/csv'],
    request: () => {
      if (!process.env.NETLIFY) process.env.NETLIFY = 'true';
    }
  });

  return cachedHandler;
}

const handler = async (event, context) => {
  const resolvedHandler = await getHandler();
  return resolvedHandler(event, context);
};

export { handler };
