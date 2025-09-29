import express from 'express'
import {
  createSnippet,
  getSnippets,
  getMySnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  searchSnippets,
} from '../controllers/snippetController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// Optional auth middleware - allows both authenticated and anonymous users
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    // If token exists, use auth middleware
    authMiddleware(req, res, next)
  } else {
    // If no token, continue without user info
    req.user = null
    next()
  }
}

// Public routes (no auth required)
router.post('/', optionalAuth, createSnippet) // Allow anonymous snippet creation
router.get('/', optionalAuth, getSnippets) // Public snippets + user's own
router.get('/search', optionalAuth, searchSnippets) // Advanced search
router.get('/:id', optionalAuth, getSnippetById) // View individual snippet

// Routes that benefit from optional auth
router.put('/:id', optionalAuth, updateSnippet) // Edit own snippets
router.delete('/:id', optionalAuth, deleteSnippet) // Delete own snippets

// Protected routes (require authentication)
router.get('/me/snippets', authMiddleware, getMySnippets) // Get user's own snippets

export default router
