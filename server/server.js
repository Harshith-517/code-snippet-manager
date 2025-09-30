import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import connectDB from './config.js'
import authRoutes from './routes/auth.js'
import snippetRoutes from './routes/snippets.js'

const app = express()

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://code-snippet-manager-gamma.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}

app.use(cors(corsOptions))
app.use(express.json())

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Debug middleware
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: corsOptions
  })
})

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/snippets', snippetRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    path: req.path
  })
})

app.get('/', (req, res) => res.send('Code Snippet Manager API'))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
