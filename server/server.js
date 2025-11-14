import dotenv from 'dotenv'
dotenv.config()

// Set default environment if not set
const NODE_ENV = process.env.NODE_ENV || 'development'

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import snippetRoutes from './routes/snippets.js'
import userRoutes from './routes/users.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Basic middleware
app.use(express.json())

// Configure CORS with specific options
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

const PORT = process.env.PORT || 5000

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Code Snippet Manager API is running',
    env: process.env.NODE_ENV,
    mongoConnected: mongoose.connection.readyState === 1
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/snippets', snippetRoutes)
app.use('/api/users', userRoutes)

// Create all necessary directories
const createRequiredDirectories = () => {
  const directories = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'profiles')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
      }
    }
  });
};

// Create directories
createRequiredDirectories();

// Set up static file serving
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '1d',
  index: false,
  dotfiles: 'deny',
  fallthrough: true,
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');
    
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.set('Content-Type', 'image/gif');
    }
  }
};

// Add a diagnostic route to help debug uploads
app.get('/api/storage-info', (req, res) => {
  const storageProvider = process.env.STORAGE_PROVIDER || 'local';
  let info = {
    provider: storageProvider,
    localUploadsPath: path.join(__dirname, 'uploads'),
    localUploadsExists: fs.existsSync(path.join(__dirname, 'uploads')),
    supabaseConfigured: false
  };
  
  if (storageProvider === 'supabase') {
    info.supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
    info.supabaseUrl = process.env.SUPABASE_URL;
  }
  
  res.json(info);
});

// Serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads');

// Set up static file serving
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath, staticOptions));
} else {
  fs.mkdirSync(uploadsPath, { recursive: true });
  app.use('/uploads', express.static(uploadsPath, staticOptions));
}

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // MongoDB connection options based on environment
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...(process.env.NODE_ENV === 'development' ? { 
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
        family: 4  // Use IPv4, skip trying IPv6
      } : {})
    }

    await mongoose.connect(process.env.MONGO_URI, mongoOptions)
    console.log('Connected to MongoDB')
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// MongoDB connection error handling
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

// Start the server
startServer()
