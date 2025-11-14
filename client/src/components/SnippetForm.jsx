import React, { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SnippetForm({ snippet, onSave, onCancel }) {
  const [title, setTitle] = useState(snippet?.title || '')
  const [description, setDescription] = useState(snippet?.description || '')
  const [code, setCode] = useState(snippet?.code || '')
  const [language, setLanguage] = useState(snippet?.programmingLanguage || snippet?.language || 'javascript')
  const [tags, setTags] = useState(snippet?.tags?.join(', ') || '')
  const [isPublic, setIsPublic] = useState(snippet?.isPublic !== false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Removed showSuccessToast state as we'll use react-hot-toast

  // Check if this is a collaborative edit (public snippet by someone else)
  const token = localStorage.getItem('token')
  const anonymousId = localStorage.getItem('anonymousId')
  
  const isCollaborativeEdit = snippet && snippet.isPublic && snippet.owner && token
  const isAnonymousEdit = snippet && snippet.isPublic && !snippet.owner && !token

  const languages = [
    'javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 
    'ruby', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'bash', 'other'
  ]

  // Get or generate anonymous ID for non-logged users
  const getAnonymousId = () => {
    let anonymousId = localStorage.getItem('anonymousId')
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('anonymousId', anonymousId)
    }
    return anonymousId
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!title.trim() || !code.trim()) {
      setError('Title and code are required')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const headers = {}
      
      // Add auth header if user is logged in
      if (token) {
        headers.Authorization = `Bearer ${token}`
      } else {
        // Add anonymous ID for non-logged users
        headers['x-anonymous-id'] = getAnonymousId()
      }

      const snippetData = {
        title: title.trim(),
        description: description.trim(),
        code: code.trim(),
        language,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublic
      }

      let response
      const snippetId = snippet?._id || snippet?.id // MongoDB uses _id
      
      if (snippetId) {
        // Update existing snippet
        response = await api.put(`/snippets/${snippetId}`, snippetData, { headers })
      } else {
        // Create new snippet
        response = await api.post('/snippets', snippetData, { headers })
        
        // Store anonymous ID if returned (for new anonymous users)
        if (response.data.anonymousId) {
          localStorage.setItem('anonymousId', response.data.anonymousId)
        }
      }

      // Reset form for new snippets
      if (!snippetId) {
        setTitle('')
        setDescription('')
        setCode('')
        setLanguage('javascript')
        setTags('')
        setIsPublic(true)
      }

      // Show success toast for collaborative edits
      if (isCollaborativeEdit || isAnonymousEdit) {
        toast.success('🎉 Collaborative edit saved! Your improvements are now live for everyone.', {
          icon: '🌐',
        })
      }

      // Call parent callback if provided
      if (onSave) {
        onSave(response.data.snippet)
      }

      // Show success message or redirect
      console.log(snippetId ? 'Snippet updated successfully:' : 'Snippet created successfully:', response.data.snippet)
      
    } catch (err) {
      console.error('Save snippet error:', err)
      const errorMessage = err.response?.data?.message || 'Failed to save snippet';
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      {/* Collaborative Editing Notice */}
      {(isCollaborativeEdit || isAnonymousEdit) && (
        <div className="mb-4 p-4 bg-blue-50/50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg transition-colors">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌐</span>
            <div>
              <h4 className="text-blue-700 dark:text-blue-300 font-medium transition-colors">Collaborative Editing</h4>
              <p className="text-sm text-blue-600 dark:text-blue-200 transition-colors">
                You're editing a public snippet! Your changes will be visible to everyone and help improve this snippet for the community.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
        <div className="text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors">Title *</label>
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter snippet title..." 
          required
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors">Description</label>
        <input 
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..." 
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors">Tags (comma separated)</label>
          <input 
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, hooks, utility..." 
            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors">Code *</label>
        <textarea 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..." 
          required
          rows={8}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-green-700 dark:text-green-400 font-mono rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mr-2 w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 transition-colors"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Make this snippet public (others can view it)
        </label>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            loading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Saving...' : ((snippet?._id || snippet?.id) ? 'Update Snippet' : 'Save Snippet')}
        </button>
      </div>
    </form>
    </div>
  )
}
