import { Router } from 'express'
import multer from 'multer'
import { DocumentController } from '../controllers/DocumentController'
import { DocumentService } from '../services/DocumentService'
import { authMiddleware } from '../middleware/authMiddleware'
import { internalAuthMiddleware } from '../middleware/internalAuthMiddleware'

const router = Router()

// Multer setup for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

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

router.get('/:id/pdf-url', authMiddleware, createUserService, (req, res) => {
  const controller = getDocumentController()
  return controller.getDocumentPdfUrl(req, res)
})

router.post('/:id/sign', authMiddleware, createUserService, (req, res) => {
  const controller = getDocumentController()
  return controller.signDocument(req, res)
})

router.post('/', internalAuthMiddleware, upload.single('pdf'), (req, res) => {
  const controller = getDocumentController()
  return controller.uploadDocument(req, res)
})

export default router