require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Strict configuration validation
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
  process.exit(1);
}

const app = express();

// Configure CORS dynamically to support same-origin requests as well as FRONTEND_URL
app.use((req, res, next) => {
  const allowedOrigins = [];
  
  // Dynamically allow the server's own origin
  const host = req.headers.host;
  if (host) {
    allowedOrigins.push(`http://${host}`);
    allowedOrigins.push(`https://${host}`);
  }
  
  if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(o => o.trim());
    allowedOrigins.push(...urls);
  }
  
  cors({
    origin: (origin, callback) => {
      const isLocalOrigin = origin && (
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') || 
        origin === 'http://localhost' || 
        origin === 'http://127.0.0.1'
      );

      // Allow if request is same-origin, is a local origin, or is in our authorized list
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLocalOrigin) {
        callback(null, true);
      } else {
        // Fallback for local development when FRONTEND_URL is not set
        if (!process.env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true
  })(req, res, next);
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve index.html with dynamically injected API_BASE_URL from .env
const serveIndex = (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace('__API_BASE_URL__', process.env.API_BASE_URL || '');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    res.status(404).send('Frontend index.html not found');
  }
};

// Route root pages specifically to inject variables before serving static files
app.get('/', serveIndex);
app.get('/index.html', serveIndex);

// Serve other static frontend assets (css, js, images) from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Route Bindings
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// Catch-all route to serve the SPA frontend for non-API requests
app.get('*', (req, res) => {
  // If requesting an API route that wasn't matched above, send 404
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  // Otherwise, serve the frontend app
  serveIndex(req, res);
});

// Database connection & Server initialization
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Atlas Connected Successfully!');

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed. Server not started.');
    console.error(err);
    process.exit(1);
  }
};

startServer();
