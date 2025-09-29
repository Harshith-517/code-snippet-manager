import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import SnippetCard from './SnippetCard'

export default function SearchSnippets({ onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [includePrivate, setIncludePrivate] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  const languages = [
    'javascript', 'python', 'java', 'typescript', 'html', 'css', 'react', 'node', 
    'php', 'go', 'rust', 'cpp', 'c', 'csharp', 'sql', 'bash', 'powershell', 'other'
  ]

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || query.trim().length < 2) {
      alert('Please enter at least 2 characters to search')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const anonymousId = localStorage.getItem('anonymousId')
      
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else if (anonymousId) {
        headers['x-anonymous-id'] = anonymousId
      }

      const params = {
        q: query.trim(),
        includePrivate: includePrivate.toString(),
        limit: 50
      }

      if (language) {
        params.language = language
      }

      const response = await api.get('/snippets/search', { 
        headers,
        params
      })

      setResults(response.data.snippets || [])
      setTotalResults(response.data.totalResults || 0)
      setSearched(true)
    } catch (err) {
      console.error('Search error:', err)
      alert('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setLanguage('')
    setIncludePrivate(false)
    setResults([])
    setSearched(false)
    setTotalResults(0)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Search Snippets</h3>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in titles, descriptions, code, or tags..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Programming Language (Optional)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={includePrivate}
                  onChange={(e) => setIncludePrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Include my private snippets</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !query.trim() || query.trim().length < 2}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            
            {(searched || query) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Results */}
      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">
              Search Results
              {totalResults > 0 && (
                <span className="text-gray-400 text-sm ml-2">
                  ({totalResults} result{totalResults !== 1 ? 's' : ''} found)
                </span>
              )}
            </h4>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No snippets found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or include private snippets</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {results.map((snippet) => (
                <SnippetCard 
                  key={snippet._id} 
                  snippet={snippet} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}