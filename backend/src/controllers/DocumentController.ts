import { Request, Response } from 'express'
import { DocumentService } from '../services/DocumentService'

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  getDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await this.documentService.getDocuments(req.user.id)
      console.log(`[DocumentController] getDocuments: Retrieved ${documents.length} documents for user ${req.user.id}`)
      res.json(documents)
    } catch (error: any) {
      console.error(`[DocumentController] getDocuments: Error - ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const document = await this.documentService.getDocumentById(req.user.id, req.params.id as string)
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
      // TODO: Implement signing logic in Phase 2
      await this.documentService.signDocument(req.user.id, req.params.id as string)
      console.log(`[DocumentController] signDocument: Document ${req.params.id} signed successfully for user ${req.user.id}`)
      res.json({ message: 'Document signed successfully' })
    } catch (error: any) {
      console.error(`[DocumentController] signDocument: Error - ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }
}