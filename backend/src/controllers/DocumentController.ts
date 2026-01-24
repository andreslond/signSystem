import { Request, Response } from 'express'
import { DocumentService } from '../services/DocumentService'

export class DocumentController {
  constructor(private documentService: DocumentService) {}

  getDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await this.documentService.getDocuments(req.user.id)
      res.json(documents)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const document = await this.documentService.getDocumentById(req.user.id, req.params.id as string)
      if (!document) {
        return res.status(404).json({ error: 'Document not found' })
      }
      res.json(document)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  signDocument = async (req: Request, res: Response) => {
    try {
      // TODO: Implement signing logic in Phase 2
      await this.documentService.signDocument(req.user.id, req.params.id as string)
      res.json({ message: 'Document signed successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}