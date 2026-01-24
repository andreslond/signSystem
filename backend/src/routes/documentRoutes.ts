import { Router } from 'express'
import { DocumentController } from '../controllers/DocumentController'
import { DocumentService } from '../services/DocumentService'
import { DocumentRepository } from '../repositories/DocumentRepository'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()
const documentRepository = new DocumentRepository()
const documentService = new DocumentService(documentRepository)
const documentController = new DocumentController(documentService)

router.get('/', authMiddleware, documentController.getDocuments)
router.get('/:id', authMiddleware, documentController.getDocumentById)
router.post('/:id/sign', authMiddleware, documentController.signDocument)

export default router