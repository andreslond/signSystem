import { Request, Response } from 'express'
import { DocumentService } from '../services/DocumentService'
import { SignDocumentRequest } from '../types'

declare global {
  namespace Express {
    interface Request {
      documentService: DocumentService
    }
  }
}

export class DocumentController {
  getDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await req.documentService.listUserDocuments(req.user.id)
      console.log(`[DocumentController] getDocuments: Retrieved ${documents.length} documents for user ${req.user.id}`)
      res.json(documents)
    } catch (error: any) {
      console.error(`[DocumentController] getDocuments: Error - ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const document = await req.documentService.getUserDocument(req.params.id as string, req.user.id)
      if (!document) {
        console.log(`[DocumentController] getDocumentById: Document ${req.params.id} not found for user ${req.user.id}`)
        return res.status(404).json({ error: 'Document not found' })
      }
      console.log(`[DocumentController] getDocumentById: Retrieved document ${req.params.id} for user ${req.user.id}`)
      res.json(document)
    } catch (error: any) {
      console.error(`[DocumentController] getDocumentById: Error - ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  signDocument = async (req: Request, res: Response) => {
    try {
      const signRequest: SignDocumentRequest = req.body
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      const userAgent = req.get('User-Agent') || 'unknown'

      await req.documentService.signDocument(
        req.params.id as string,
        req.user.id,
        signRequest,
        ip,
        userAgent,
        req.user.email
      )

      console.log(`[DocumentController] signDocument: Document ${req.params.id} signed successfully for user ${req.user.id}`)
      res.json({ message: 'Document signed successfully' })
    } catch (error: any) {
      console.error(`[DocumentController] signDocument: Error - ${error.message}`)
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('already signed') ? 400 :
                        error.message.includes('Authentication failed') ? 401 : 500
      res.status(statusCode).json({ error: error.message })
    }
  }
}