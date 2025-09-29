import React from 'react'

export default function SnippetCard({ snippet, onEdit, onDelete }) {
  const title = snippet?.title || 'Untitled Snippet'
  const code = snippet?.code || '// your code here...'
  const language = snippet?.programmingLanguage || snippet?.language || 'js'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  const handleEdit = () => {
    if (onEdit) onEdit(snippet)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(snippet._id)
  }

  const canEdit = () => {
    const token = localStorage.getItem('token')
    const anonymousId = localStorage.getItem('anonymousId')
    
    // Can edit if: 1) Owner, 2) Anonymous creator, 3) Public snippet (collaborative)
    const isOwner = token && snippet.owner
    const isAnonymousCreator = !token && !snippet.owner && snippet.anonymousId === anonymousId
    const isPublicSnippet = snippet.isPublic === true
    
    return isOwner || isAnonymousCreator || isPublicSnippet
  }

  const canDelete = () => {
    const token = localStorage.getItem('token')
    const anonymousId = localStorage.getItem('anonymousId')
    
    // Can delete only if owner or anonymous creator (not public snippets by others)
    if (token && snippet.owner) {
      return true // Authenticated user and snippet has owner
    }
    
    if (!token && !snippet.owner && snippet.anonymousId === anonymousId) {
      return true // Anonymous user and snippet belongs to them
    }
    
    return false
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <article className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition p-4 border border-gray-700 hover:border-gray-600">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="mt-1 text-sm text-gray-400">{snippet?.description}</div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">{language.toUpperCase()}</div>
          <button 
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white text-sm p-1 rounded transition"
            title="Copy to clipboard"
          >
            📋
          </button>
        </div>
      </div>

      <pre className="mt-4 p-3 bg-gray-900 rounded-md text-sm overflow-x-auto border border-gray-700 text-green-400 font-mono">{code}</pre>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {(snippet?.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs">{t}</span>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          {canEdit() && (
            <button 
              onClick={handleEdit}
              className="text-sm text-gray-300 hover:text-white transition"
              title={snippet.isPublic && !snippet.owner ? "Public snippet - anyone can edit" : "Edit snippet"}
            >
              Edit {snippet.isPublic && !snippet.owner ? "🌐" : ""}
            </button>
          )}
          {canDelete() && (
            <button 
              onClick={handleDelete}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {snippet.createdAt && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {snippet.isPublic ? '🌐 Public' : '🔒 Private'}
          </span>
          <span>
            {formatDate(snippet.createdAt)}
          </span>
        </div>
      )}
    </article>
  )
}
