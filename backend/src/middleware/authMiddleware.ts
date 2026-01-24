import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'

declare global {
  namespace Express {
    interface Request {
      user: any
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  console.info(`[authMiddleware] Token - ${token}`)
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.info(`[authMiddleware] User id - ${data.user.id}`)
    req.user = data.user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Auth error' })
  }
}