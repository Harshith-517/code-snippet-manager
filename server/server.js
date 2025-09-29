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
    ? [process.env.CLIENT_URL, 'https://your-app-name.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
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

app.get('/', (req, res) => res.send('Code Snippet Manager API'))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
