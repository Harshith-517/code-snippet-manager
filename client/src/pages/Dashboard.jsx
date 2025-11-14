import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SnippetCard from '../components/SnippetCard'
import SnippetForm from '../components/SnippetForm'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const location = useLocation()
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    snippetId: null,
    snippetTitle: ''
  })

  // Get or generate anonymous ID for non-logged users
  const getAnonymousId = () => {
    let anonymousId = localStorage.getItem('anonymousId')
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('anonymousId', anonymousId)
    }
    return anonymousId
  }

  const fetchSnippets = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = {}
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else {
        headers['x-anonymous-id'] = getAnonymousId()
      }

      const response = await api.get('/snippets', { headers })
      setSnippets(response.data.snippets || [])
    } catch (err) {
      console.error('Fetch snippets error:', err)
      const errorMsg = 'Failed to load snippets';
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSnippets()
    
    // Check if we were passed a snippet to edit from search
    if (location.state?.editSnippet) {
      setEditingSnippet(location.state.editSnippet)
      setShowForm(true)
      
      // Only show toast notification if we haven't seen this snippet yet
      // and we came from search
      if (location.state?.fromSearch && !location.state?.notificationShown) {
        toast.success(`Found existing snippet "${location.state.editSnippet.title}" - you can now edit it!`)
        
        // Update state to prevent duplicate notifications
        window.history.replaceState(
          { ...location.state, notificationShown: true },
          document.title
        )
      }
      
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
    
    // Check if we should create a new snippet with a specific title
    if (location.state?.createWithTitle) {
      setEditingSnippet({ title: location.state.createWithTitle })
      setShowForm(true)
      
      // Show toast instead of alert
      toast(`No snippet found with title "${location.state.createWithTitle}" - creating a new one for you!`, {
        icon: '✨'
      })
      
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleSnippetSaved = (savedSnippet) => {
    if (editingSnippet) {
      // Update existing snippet
      setSnippets(prev => prev.map(s => s._id === savedSnippet._id ? savedSnippet : s))
      setEditingSnippet(null)
      toast.success('Snippet updated successfully')
    } else {
      // Add new snippet
      setSnippets(prev => [savedSnippet, ...prev])
      toast.success('New snippet created!')
    }
    setShowForm(false)
  }

  const handleEditSnippet = (snippet) => {
    setEditingSnippet(snippet)
    setShowForm(true)
  }

  const handleDeleteSnippet = (snippet) => {
    // Open the confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      snippetId: snippet._id,
      snippetTitle: snippet.title || 'this snippet'
    })
  }

  const confirmDeleteSnippet = async () => {
    const snippetId = deleteConfirmation.snippetId;
    
    // Close the dialog first
    setDeleteConfirmation({
      isOpen: false,
      snippetId: null,
      snippetTitle: ''
    })

    try {
      const token = localStorage.getItem('token')
      const headers = {}
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else {
        headers['x-anonymous-id'] = getAnonymousId()
      }

      await api.delete(`/snippets/${snippetId}`, { headers })
      setSnippets(prev => prev.filter(s => s._id !== snippetId))
      toast.success('Snippet deleted successfully')
    } catch (err) {
      console.error('Delete snippet error:', err)
      toast.error('Failed to delete snippet')
    }
  }

  const handleNewSnippet = () => {
    setEditingSnippet(null)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingSnippet(null)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-700 dark:text-white transition-colors">Loading snippets...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog 
        isOpen={deleteConfirmation.isOpen}
        title="Delete Snippet"
        message={`Are you sure you want to delete "${deleteConfirmation.snippetTitle}"?`}
        onConfirm={confirmDeleteSnippet}
        onCancel={() => setDeleteConfirmation({ isOpen: false, snippetId: null, snippetTitle: '' })}
      />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">
            {localStorage.getItem('token') ? 'My Snippets' : 'Code Snippets'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
            {localStorage.getItem('token') 
              ? 'Your saved snippets and public snippets' 
              : 'Create and save snippets (no account required)'
            }
          </p>
        </div>
        <div>
          <button 
            onClick={handleNewSnippet}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            New Snippet
          </button>
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 transition-colors">
          💡 Want to find specific snippets? Try the <a href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors">search on homepage</a>
        </p>
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 transition-colors">
            {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
            <SnippetForm 
              snippet={editingSnippet}
              onSave={handleSnippetSaved}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}

      {/* Snippets Content */}
      {snippets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-gray-400 mb-4 transition-colors">No snippets found</div>
          <button 
            onClick={handleNewSnippet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            Create Your First Snippet
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((snippet) => (
            <SnippetCard 
              key={snippet._id} 
              snippet={snippet} 
              onEdit={handleEditSnippet}
              onDelete={handleDeleteSnippet}
            />
          ))}
        </div>
      )}
    </div>
  )
}
