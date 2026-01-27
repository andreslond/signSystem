import { Router } from 'express'
import { DocumentController } from '../controllers/DocumentController'
import { DocumentService } from '../services/DocumentService'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

// Middleware to inject user-specific service
const createUserService = (req: any, res: any, next: any) => {
  req.documentService = new DocumentService(req.userToken)
  next()
}

const getDocumentController = () => {
  return new DocumentController()
}

router.get('/', authMiddleware, createUserService, (req, res) => {
  const controller = getDocumentController()
  return controller.getDocuments(req, res)
})

router.get('/:id', authMiddleware, createUserService, (req, res) => {
  const controller = getDocumentController()
  return controller.getDocumentById(req, res)
})

router.post('/:id/sign', authMiddleware, createUserService, (req, res) => {
  const controller = getDocumentController()
  return controller.signDocument(req, res)
})

export default router