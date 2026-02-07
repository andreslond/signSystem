import { Request, Response, NextFunction } from 'express'
import {createSupabaseUserClient } from '../config/supabase'

declare global {
  namespace Express {
    interface Request {
      user: any
      userToken: string
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.replace('Bearer ', '').trim() === '') {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.replace('Bearer ', '')
  console.info(`[authMiddleware] Token - ${token}`)  
  try {
    const { data, error } = await createSupabaseUserClient(token).auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.info(`[authMiddleware] User id - ${data.user.id}`)
    req.user = data.user
    req.userToken = token
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Auth error' })
  }
}