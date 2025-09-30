import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import snippetRoutes from './routes/snippets.js'

const app = express()

// Basic middleware
app.use(express.json())
app.use(cors())

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

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('Environment:', process.env.NODE_ENV)
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
