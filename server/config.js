import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/code-snippet'
  try {
    await mongoose.connect(uri, {
      // These options are defaults in mongoose 7+, but kept for clarity
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err)
    // Exit the process - failing fast helps surface config issues during dev
    process.exit(1)
  }
}
