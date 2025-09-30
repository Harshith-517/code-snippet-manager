// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// Add this before your other routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Error handling middleware - add this after your routes
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    path: req.path
  })
})