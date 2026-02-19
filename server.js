/**
 * Local Serverless Test Server
 * Run serverless functions locally without Netlify
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting local serverless server on http://localhost:${PORT}`);
console.log('');
console.log('Available endpoints:');
console.log('  POST /api/auth/create-account - Create new account');
console.log('  POST /api/auth/login          - Login with password/PIN');
console.log('  GET  /api/subscription        - Get subscription status');
console.log('  GET  /api/modules             - Get available modules');
console.log('  POST /api/subscription/upgrade - Upgrade to annual');
console.log('  POST /api/farmers             - Create farmer');
console.log('  GET  /api/farmers             - Get farmers');
console.log('');
console.log('⚠️  Make sure to set your Supabase credentials in .env.local');
console.log('');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // Route to appropriate function
    let functionName;
    let event = {
      httpMethod: req.method,
      path: pathname,
      headers: req.headers,
      body: ''
    };
    
    // Collect request body
    if (['POST', 'PUT'].includes(req.method)) {
      event.body = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
      });
    }
    
    // Determine which function to call
    if (pathname.includes('/auth/create-account')) {
      functionName = 'auth-create-account';
    } else if (pathname.includes('/auth/login')) {
      functionName = 'auth-login';
    } else if (pathname.includes('/subscription')) {
      functionName = 'subscription';
    } else if (pathname.includes('/farmers')) {
      functionName = 'farmers';
    } else if (pathname.includes('/milk-entries')) {
      functionName = 'milk-entries';
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    
    // Load and execute function
    const functionPath = path.join(__dirname, 'netlify', 'functions', `${functionName}.js`);
    
    if (!fs.existsSync(functionPath)) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Function ${functionName} not found` }));
      return;
    }
    
    const handler = require(functionPath).handler;
    
    const context = {};
    
    const result = await handler(event, context);
    
    res.writeHead(result.statusCode, {
      'Content-Type': 'application/json',
      ...result.headers
    });
    res.end(result.body);
    
    console.log(`  → ${result.statusCode}`);
    
  } catch (error) {
    console.error('  → Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server ready at http://localhost:${PORT}`);
});
