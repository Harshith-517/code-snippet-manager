import mongoose from 'mongoose'

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  code: { type: String, required: true },
  programmingLanguage: { type: String, default: 'javascript' }, // Renamed to avoid MongoDB text search conflict
  tags: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for anonymous users
  isPublic: { type: Boolean, default: true }, // Public snippets can be viewed by anyone
  isAnonymous: { type: Boolean, default: false }, // Track if created by anonymous user
  anonymousId: { type: String }, // Session ID for anonymous users
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

// Index for better search performance
snippetSchema.index({ title: 'text', description: 'text', tags: 'text' })
snippetSchema.index({ owner: 1, createdAt: -1 })
snippetSchema.index({ isPublic: 1, createdAt: -1 })
snippetSchema.index({ anonymousId: 1, createdAt: -1 })

export default mongoose.model('Snippet', snippetSchema)
