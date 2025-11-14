import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import SnippetCard from '../components/SnippetCard'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    snippetId: null,
    snippetTitle: ''
  })
  
  const features = [
    { title: 'Save Snippets', desc: 'Store and categorize your reusable code snippets for later use.' },
    { title: 'Tag & Search', desc: 'Quickly find snippets using tags, search and filters.' },
    { title: 'Collaborative', desc: 'Public snippets can be edited by anyone - true collaboration!' },
    { title: 'No Signup Required', desc: 'Start creating and saving snippets immediately without registration.' },
  ]

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Please enter at least 2 characters to search')
      return
    }

    setSearching(true)
    
    try {
      // First, try to find an exact title match
      const exactTitleResponse = await api.get('/snippets/search', { 
        params: {
          q: searchQuery.trim(),
          exactTitle: 'true',
          limit: 1
        }
      })

      const exactMatch = exactTitleResponse.data.snippets?.[0]
      
      if (exactMatch) {
        // Found exact title match - navigate to edit it
        navigate('/dashboard', { 
          state: { 
            editSnippet: exactMatch,
            fromSearch: true,
            searchQuery: searchQuery.trim()
          } 
        })
        return
      }

      // No exact match found - show general search results
      const generalResponse = await api.get('/snippets/search', { 
        params: {
          q: searchQuery.trim(),
          limit: 12
        }
      })

      setSearchResults(generalResponse.data.snippets || [])
      setHasSearched(true)
      
    } catch (err) {
      console.error('Search error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      })
      
      // More specific error message
      let errorMessage = 'Search failed. '
      if (err.response?.status === 404) {
        errorMessage += 'Search endpoint not found. Please check if the server is running.'
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage += 'Cannot connect to server. Please start the backend server.'
      } else {
        errorMessage += `Error: ${err.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setSearching(false)
    }
  }

  const handleCreateWithTitle = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a title first')
      return
    }
    
    // Navigate to dashboard to create new snippet with the searched title
    navigate('/dashboard', { 
      state: { 
        createWithTitle: searchQuery.trim(),
        fromSearch: true 
      } 
    })
  }

  // Fallback function if API search fails
  const handleDirectCreate = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a title to create a snippet')
      return
    }
    
    // Directly navigate to create mode
    navigate('/dashboard', { 
      state: { 
        createWithTitle: searchQuery.trim(),
        fromSearch: true 
      } 
    })
    toast(`Creating new snippet: "${searchQuery.trim()}"`, {
      icon: '✨'
    })
  }

  const handleEditSnippet = (snippet) => {
    // Navigate to dashboard with the snippet to edit
    navigate('/dashboard', { state: { editSnippet: snippet } })
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
      const anonymousId = localStorage.getItem('anonymousId')
      
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else if (anonymousId) {
        headers['x-anonymous-id'] = anonymousId
      }

      await api.delete(`/snippets/${snippetId}`, { headers })
      setSearchResults(prev => prev.filter(s => s._id !== snippetId))
      toast.success('Snippet deleted successfully')
    } catch (err) {
      console.error('Delete snippet error:', err)
      toast.error('Failed to delete snippet')
    }
  }

  return (
    <div className="py-12">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog 
        isOpen={deleteConfirmation.isOpen}
        title="Delete Snippet"
        message={`Are you sure you want to delete "${deleteConfirmation.snippetTitle}"?`}
        onConfirm={confirmDeleteSnippet}
        onCancel={() => setDeleteConfirmation({ isOpen: false, snippetId: null, snippetTitle: '' })}
      />
      
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero Section with Search */}
        <div className="grid gap-8 items-center grid-cols-1 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight transition-colors">
              Organize & Share Your Code Snippets
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors">
              Save, categorize and collaborate on code snippets. Fast search, tagging, and 
              collaborative editing make sharing a breeze. <span className="text-blue-600 dark:text-blue-400 transition-colors">No account required!</span>
            </p>
            
            {/* Smart Search Info */}
            <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-300/50 dark:border-blue-700/50 rounded-lg p-3 mb-4 transition-colors">
              <div className="text-sm text-blue-700 dark:text-blue-200 transition-colors">
                💡 <strong>Smart Search:</strong> Enter a title to find existing snippets or create new ones instantly!
              </div>
            </div>

            {/* Search Form */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
              <form onSubmit={handleSearch} className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Smart Search: Find existing snippets or create new ones by title (e.g. 'My React Hook', 'Python Helper')"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  minLength={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim() || searchQuery.trim().length < 2}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {searching ? 'Searching...' : '🔍 Smart Search'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDirectCreate}
                    disabled={!searchQuery.trim() || searchQuery.trim().length < 2}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    ✨ Create
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/signin" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition font-medium">
                Get Started
              </Link>
              <Link to="/dashboard" className="inline-block text-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Start Creating →
              </Link>
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
              Join thousands of developers sharing and collaborating on code snippets
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-6 shadow-lg border border-gray-200 dark:border-gray-600 transition-colors">
              <pre className="bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 rounded-md p-4 font-mono text-sm overflow-auto h-56 border border-gray-200 dark:border-gray-700 transition-colors">
                {`// Collaborative snippet example
function fetchUserData(userId) {
  return fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .catch(err => console.error(err))
}

// Anyone can edit public snippets! 🌐
// Try searching for "react", "python", "css"`}
              </pre>
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center transition-colors">
                💡 Public snippets are collaborative - anyone can improve them!
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">
                Search Results
                {searchResults.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-400 text-lg ml-2 transition-colors">
                    ({searchResults.length} snippet{searchResults.length !== 1 ? 's' : ''} found)
                  </span>
                )}
              </h3>
              {searchResults.length > 0 && (
                <Link 
                  to="/dashboard" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition-colors"
                >
                  View All →
                </Link>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">No snippets found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 transition-colors">Would you like to create a new snippet with this title?</p>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleCreateWithTitle}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    ✨ Create "{searchQuery}" Snippet
                  </button>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Browse All Snippets
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Option to create new snippet even when results exist */}
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 dark:text-green-300 font-medium transition-colors">Don't see what you're looking for?</p>
                      <p className="text-sm text-green-600 dark:text-green-200 transition-colors">Create a new snippet titled "{searchQuery}"</p>
                    </div>
                    <button
                      onClick={handleCreateWithTitle}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      ✨ Create New
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((snippet) => (
                    <SnippetCard 
                      key={snippet._id} 
                      snippet={snippet} 
                      onEdit={handleEditSnippet}
                      onDelete={handleDeleteSnippet}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Features */}
        <section className="mt-12">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">Features</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors">Everything you need to store, find and share code quickly.</p>

          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <div className="h-12 w-12 rounded-md bg-blue-600 text-white flex items-center justify-center font-semibold">{f.title.charAt(0)}</div>
                <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white transition-colors">{f.title}</h4>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
