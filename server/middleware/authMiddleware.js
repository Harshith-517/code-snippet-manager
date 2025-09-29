import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' })
  }

  const token = auth.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
    req.user = { id: payload.id }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
