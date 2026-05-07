import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env = { ...process.env, ...env }

  return {
    plugins: [
      react(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/gerar-plano') {
              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }
              if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk.toString() });
                req.on('end', async () => {
                  try {
                    req.body = JSON.parse(body);
                    
                    // Polyfill res.status and res.json for the serverless function
                    res.status = (statusCode) => {
                      res.statusCode = statusCode;
                      return res;
                    };
                    res.json = (data) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    };

                    // Import dynamically
                    const { default: handler } = await import('./api/gerar-plano.js?' + Date.now());
                    await handler(req, res);
                  } catch (e) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.message || 'Erro interno no servidor' }));
                  }
                });
                return;
              }
            }
            next();
          });
        }
      }
    ],
  }
})
