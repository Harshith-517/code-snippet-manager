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
  origin: '*',  // Allow all origins temporarily for debugging
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/snippets', snippetRoutes)

// Debug route to check environment variables
app.get('/', (req, res) => {
  res.json({
    message: 'Code Snippet Manager API',
    env: process.env.NODE_ENV,
    mongoConnected: mongoose.connection.readyState === 1,
    corsOrigins: corsOptions.origin
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('MongoDB URI set:', !!process.env.MONGO_URI)
  console.log('CLIENT_URL set:', !!process.env.CLIENT_URL)
})
