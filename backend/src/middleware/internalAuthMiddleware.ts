import { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      internalAuth: boolean
    }
  }
}

export const internalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const expectedKey = process.env.SIGNSYSTEM_INTERNAL_API_KEY

  console.log(`[internalAuthMiddleware] Received token: ${token ? 'present' : 'missing'}`)
  console.log(`[internalAuthMiddleware] Expected key configured: ${expectedKey ? 'yes' : 'no'}`)

  if (!token) {
    console.log(`[internalAuthMiddleware] No token provided`)
    return res.status(401).json({ error: 'No internal API key provided' })
  }

  if (!expectedKey) {
    console.error(`[internalAuthMiddleware] SIGNSYSTEM_INTERNAL_API_KEY not configured`)
    return res.status(500).json({ error: 'Internal authentication not configured' })
  }

  if (token !== expectedKey) {
    console.log(`[internalAuthMiddleware] Invalid token provided`)
    return res.status(401).json({ error: 'Invalid internal API key' })
  }

  console.log(`[internalAuthMiddleware] Authentication successful`)
  req.internalAuth = true
  next()
}