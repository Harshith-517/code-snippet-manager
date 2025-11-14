import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String }, // Keep for backward compatibility
  firstName: { type: String, required: function() { return !this.googleId; } },
  lastName: { type: String, required: function() { return !this.googleId; } },
  email: { type: String, required: function() { return !this.googleId; }, unique: true },
  password: { type: String, required: function() { return !this.googleId; } }, // Password not required if Google auth
  googleId: { type: String },
  profileImage: { type: String },
  givenName: { type: String },
  familyName: { type: String },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  role: { type: String, default: "user" },
}, { timestamps: true })

// Email validation
userSchema.pre('validate', function(next) {
  if (!this.email && !this.googleId) {
    this.invalidate('email', 'Email is required')
  }
  next()
})

export default mongoose.model('User', userSchema)
