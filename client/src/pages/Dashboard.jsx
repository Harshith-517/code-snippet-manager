import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SnippetCard from '../components/SnippetCard'
import SnippetForm from '../components/SnippetForm'
import api from '../utils/api'

export default function Dashboard() {
  const location = useLocation()
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState(null)

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
      setError('Failed to load snippets')
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
      
      // Show message if coming from search
      if (location.state?.fromSearch) {
        setTimeout(() => {
          alert(`Found existing snippet "${location.state.editSnippet.title}" - you can now edit it!`)
        }, 100)
      }
      
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
    
    // Check if we should create a new snippet with a specific title
    if (location.state?.createWithTitle) {
      setEditingSnippet({ title: location.state.createWithTitle })
      setShowForm(true)
      
      setTimeout(() => {
        alert(`No snippet found with title "${location.state.createWithTitle}" - creating a new one for you!`)
      }, 100)
      
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleSnippetSaved = (savedSnippet) => {
    if (editingSnippet) {
      // Update existing snippet
      setSnippets(prev => prev.map(s => s._id === savedSnippet._id ? savedSnippet : s))
      setEditingSnippet(null)
    } else {
      // Add new snippet
      setSnippets(prev => [savedSnippet, ...prev])
    }
    setShowForm(false)
  }

  const handleEditSnippet = (snippet) => {
    setEditingSnippet(snippet)
    setShowForm(true)
  }

  const handleDeleteSnippet = async (snippetId) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return

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
    } catch (err) {
      console.error('Delete snippet error:', err)
      alert('Failed to delete snippet')
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
          <div className="text-white">Loading snippets...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {localStorage.getItem('token') ? 'My Snippets' : 'Code Snippets'}
          </h2>
          <p className="text-sm text-gray-400">
            {localStorage.getItem('token') 
              ? 'Your saved snippets and public snippets' 
              : 'Create and save snippets (no account required)'
            }
          </p>
        </div>
        <div>
          <button 
            onClick={handleNewSnippet}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            New Snippet
          </button>
        </div>
      </div>

      <div className="mb-6 text-center">
        <p className="text-gray-400">
          💡 Want to find specific snippets? Try the <a href="/" className="text-blue-400 hover:text-blue-300 underline">search on homepage</a>
        </p>
      </div>

      {error && (
        <div className="text-red-400 mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-white mb-3">
            {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h3>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
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
          <div className="text-gray-400 mb-4">No snippets found</div>
          <button 
            onClick={handleNewSnippet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
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
