import Snippet from '../models/Snippet.js'

// Simple UUID generation without external dependency
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Create a new snippet (supports both logged-in and anonymous users)
export async function createSnippet(req, res) {
  try {
    const { title, description, code, language, tags, isPublic } = req.body
    const userId = req.user?.id // From auth middleware (optional)
    
    if (!title || !code) {
      return res.status(400).json({ message: 'Title and code are required' })
    }

    const snippetData = {
      title: title.trim(),
      description: description?.trim() || '',
      code: code.trim(),
      programmingLanguage: language || 'javascript',
      tags: tags || [],
      isPublic: isPublic !== false, // Default to public
    }

    if (userId) {
      // Logged-in user
      snippetData.owner = userId
      snippetData.isAnonymous = false
    } else {
      // Anonymous user - generate session ID or use existing one
      const anonymousId = req.headers['x-anonymous-id'] || generateId()
      snippetData.isAnonymous = true
      snippetData.anonymousId = anonymousId
    }

    const snippet = await Snippet.create(snippetData)
    await snippet.populate('owner', 'firstName lastName email')

    res.status(201).json({
      snippet,
      anonymousId: snippetData.anonymousId // Return for anonymous users to track their snippets
    })
  } catch (error) {
    console.error('Create snippet error:', error)
    res.status(500).json({ message: 'Failed to create snippet' })
  }
}

// Get snippets (user's own + public snippets)
export async function getSnippets(req, res) {
  try {
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']
    const { page = 1, limit = 10, search, language, tag } = req.query

    // Build visibility filter: show public snippets + user's own private snippets
    let visibilityFilter
    if (userId) {
      // Authenticated user: show public snippets OR their own snippets (regardless of visibility)
      visibilityFilter = {
        $or: [
          { isPublic: true },
          { owner: userId }
        ]
      }
    } else if (anonymousId) {
      // Anonymous user: show public snippets OR their own anonymous snippets (regardless of visibility)
      visibilityFilter = {
        $or: [
          { isPublic: true },
          { anonymousId: anonymousId, owner: null }
        ]
      }
    } else {
      // No authentication: only public snippets
      visibilityFilter = { isPublic: true }
    }

    // Build search filters
    const searchFilters = {}
    
    if (search) {
      // Search in title, description, and code (not just text index)
      searchFilters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    if (language) {
      searchFilters.programmingLanguage = language
    }
    
    if (tag) {
      searchFilters.tags = { $in: [tag] }
    }

    // Combine visibility and search filters
    const filter = {
      ...visibilityFilter,
      ...searchFilters
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'owner',
        select: 'firstName lastName email'
      }
    }

    const snippets = await Snippet.find(filter)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Snippet.countDocuments(filter)

    res.json({
      snippets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalSnippets: total
    })
  } catch (error) {
    console.error('Get snippets error:', error)
    res.status(500).json({ message: 'Failed to fetch snippets' })
  }
}

// Get user's own snippets
export async function getMySnippets(req, res) {
  try {
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']
    
    if (!userId && !anonymousId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const filter = userId 
      ? { owner: userId }
      : { anonymousId: anonymousId }

    const snippets = await Snippet.find(filter)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })

    res.json({ snippets })
  } catch (error) {
    console.error('Get my snippets error:', error)
    res.status(500).json({ message: 'Failed to fetch your snippets' })
  }
}

// Get snippet by ID
export async function getSnippetById(req, res) {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']

    const snippet = await Snippet.findById(id).populate('owner', 'firstName lastName email')
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' })
    }

    // Check if user can view this snippet
    const canView = snippet.isPublic || 
                   (snippet.owner && snippet.owner._id.toString() === userId) ||
                   (snippet.anonymousId === anonymousId)

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Increment view count
    snippet.views += 1
    await snippet.save()

    res.json({ snippet })
  } catch (error) {
    console.error('Get snippet error:', error)
    res.status(500).json({ message: 'Failed to fetch snippet' })
  }
}

// Update snippet
export async function updateSnippet(req, res) {
  try {
    const { id } = req.params
    const { title, description, code, language, tags, isPublic } = req.body
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']

    const snippet = await Snippet.findById(id)
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' })
    }

    // Check if user can edit this snippet
    // Allow editing if: 1) Owner, 2) Anonymous creator, 3) Public snippet (collaborative editing)
    const isOwner = (snippet.owner && snippet.owner.toString() === userId)
    const isAnonymousCreator = (snippet.anonymousId === anonymousId)
    const isPublicSnippet = snippet.isPublic === true
    
    const canEdit = isOwner || isAnonymousCreator || isPublicSnippet

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied - only private snippet owners or public snippets can be edited' })
    }

    // Update fields
    if (title) snippet.title = title.trim()
    if (description !== undefined) snippet.description = description.trim()
    if (code) snippet.code = code.trim()
    if (language) snippet.programmingLanguage = language
    if (tags) snippet.tags = tags
    if (isPublic !== undefined) snippet.isPublic = isPublic

    await snippet.save()
    await snippet.populate('owner', 'firstName lastName email')

    res.json({ snippet })
  } catch (error) {
    console.error('Update snippet error:', error)
    res.status(500).json({ message: 'Failed to update snippet' })
  }
}

// Delete snippet
export async function deleteSnippet(req, res) {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']

    const snippet = await Snippet.findById(id)
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' })
    }

    // Check if user can delete this snippet
    const canDelete = (snippet.owner && snippet.owner.toString() === userId) ||
                     (snippet.anonymousId === anonymousId)

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await Snippet.findByIdAndDelete(id)
    res.json({ message: 'Snippet deleted successfully' })
  } catch (error) {
    console.error('Delete snippet error:', error)
    res.status(500).json({ message: 'Failed to delete snippet' })
  }
}

// Advanced search snippets (including private snippets for authenticated users)
export async function searchSnippets(req, res) {
  try {
    const userId = req.user?.id
    const anonymousId = req.headers['x-anonymous-id']
    const { q: query, language, tag, includePrivate = false, exactTitle = false, page = 1, limit = 20 } = req.query

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' })
    }

    // Build base visibility filter
    let visibilityFilter
    if (includePrivate === 'true' && (userId || anonymousId)) {
      // Include private snippets for authenticated/anonymous users
      if (userId) {
        visibilityFilter = {
          $or: [
            { isPublic: true },
            { owner: userId }
          ]
        }
      } else if (anonymousId) {
        visibilityFilter = {
          $or: [
            { isPublic: true },
            { anonymousId: anonymousId, owner: null }
          ]
        }
      }
    } else {
      // Only public snippets
      visibilityFilter = { isPublic: true }
    }

    // Build search filter - exact title match or flexible search
    const searchTerm = query.trim()
    let searchFilter
    
    if (exactTitle === 'true') {
      // Exact title match (case insensitive)
      searchFilter = {
        title: { $regex: `^${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      }
    } else {
      // Flexible search across all fields
      searchFilter = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { code: { $regex: searchTerm, $options: 'i' } },
          { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
        ]
      }
    }

    // Additional filters
    const additionalFilters = {}
    if (language) {
      additionalFilters.programmingLanguage = language
    }
    if (tag) {
      additionalFilters.tags = { $in: [tag] }
    }

    // Combine all filters
    const filter = {
      ...visibilityFilter,
      ...searchFilter,
      ...additionalFilters
    }

    const snippets = await Snippet.find(filter)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Snippet.countDocuments(filter)

    res.json({
      query: searchTerm,
      snippets,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      includePrivate: includePrivate === 'true'
    })
  } catch (error) {
    console.error('Search snippets error:', error)
    res.status(500).json({ message: 'Failed to search snippets' })
  }
}
