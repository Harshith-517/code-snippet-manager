import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGO_URI || (
    process.env.NODE_ENV === 'production' 
      ? 'mongodb://localhost:27017/code-snippet-prod'
      : 'mongodb://localhost:27017/code-snippet-dev'
  )

  const options = {
    // MongoDB connection options based on environment
    ...(process.env.NODE_ENV === 'development' ? {
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4  // Use IPv4, skip trying IPv6
    } : {
      maxPoolSize: 50,  // Higher pool size for production
      socketTimeoutMS: 30000,
      family: 4
    })
  }

  try {
    await mongoose.connect(uri, options)
    console.log(`Connected to MongoDB in ${process.env.NODE_ENV} mode`)
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err)
    // Exit the process - failing fast helps surface config issues during dev
    process.exit(1)
  }
}
