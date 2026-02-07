import { Request, Response, NextFunction } from 'express'
import { internalAuthMiddleware } from '../../src/middleware/internalAuthMiddleware'

// Mock process.env
const originalEnv = process.env

describe('internalAuthMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let jsonSpy: jest.SpyInstance
  let statusSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    jsonSpy = jest.fn()
    statusSpy = jest.fn().mockReturnThis()

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    } as any

    mockNext = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should call next() when valid token is provided', async () => {
    process.env.SIGNSYSTEM_INTERNAL_API_KEY = 'test-key-123'

    mockRequest = {
      headers: {
        authorization: 'Bearer test-key-123',
      },
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((mockRequest as any).internalAuth).toBe(true)
  })

  it('should return 401 when no authorization header is provided', async () => {
    process.env.SIGNSYSTEM_INTERNAL_API_KEY = 'test-key-123'

    mockRequest = {
      headers: {},
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No internal API key provided' })
  })

  it('should return 401 when authorization header has no Bearer token', async () => {
    process.env.SIGNSYSTEM_INTERNAL_API_KEY = 'test-key-123'

    mockRequest = {
      headers: {
        authorization: 'Basic some-token',
      },
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid internal API key' })
  })

  it('should return 401 when token does not match', async () => {
    process.env.SIGNSYSTEM_INTERNAL_API_KEY = 'test-key-123'

    mockRequest = {
      headers: {
        authorization: 'Bearer wrong-key',
      },
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid internal API key' })
  })

  it('should return 500 when SIGNSYSTEM_INTERNAL_API_KEY is not configured', async () => {
    delete process.env.SIGNSYSTEM_INTERNAL_API_KEY

    mockRequest = {
      headers: {
        authorization: 'Bearer test-key',
      },
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal authentication not configured' })
  })

  it('should handle empty Bearer token', async () => {
    process.env.SIGNSYSTEM_INTERNAL_API_KEY = 'test-key-123'

    mockRequest = {
      headers: {
        authorization: 'Bearer ',
      },
    }

    await internalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No internal API key provided' })
  })
})