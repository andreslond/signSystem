import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../../src/middleware/authMiddleware'

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  createSupabaseUserClient: jest.fn(),
}))

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
}

const { createSupabaseUserClient } = require('../../src/config/supabase')
createSupabaseUserClient.mockReturnValue(mockSupabaseClient)

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let jsonSpy: jest.SpyInstance
  let statusSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()

    jsonSpy = jest.fn()
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy })

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    } as any

    mockNext = jest.fn()
  })

  it('should call next() and attach user when valid token is provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(createSupabaseUserClient).toHaveBeenCalledWith('valid-token')
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('valid-token')
    expect(mockNext).toHaveBeenCalled()
    expect((mockRequest as any).user).toEqual(mockUser)
    expect((mockRequest as any).userToken).toBe('valid-token')
  })

  it('should return 401 when no authorization header is provided', async () => {
    mockRequest = {
      headers: {},
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
  })

  it('should return 401 when authorization header has no Bearer token', async () => {
    mockRequest = {
      headers: {
        authorization: 'Basic some-token',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
  })

  it('should return 401 when getUser returns error', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    mockRequest = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })

  it('should return 401 when getUser returns no user', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    mockRequest = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })

  it('should return 401 when getUser throws an error', async () => {
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Auth service error'))

    mockRequest = {
      headers: {
        authorization: 'Bearer token',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Auth error' })
  })

  it('should handle empty Bearer token', async () => {
    mockRequest = {
      headers: {
        authorization: 'Bearer ',
      },
    }

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' })
  })
})