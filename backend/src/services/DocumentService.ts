import { DocumentRepository } from '../repositories/DocumentRepository'

export class DocumentService {
  constructor(private documentRepository: DocumentRepository) {}

  async getDocuments(userId: string) {
    // TODO: Add business logic in Phase 2
    return await this.documentRepository.findAll(userId)
  }

  async getDocumentById(userId: string, id: string) {
    // TODO: Add business logic in Phase 2
    return await this.documentRepository.findById(userId, id)
  }

  async signDocument(userId: string, id: string) {
    // TODO: Implement PDF signing logic in Phase 2
    // This will involve validating the document, generating signature, updating DB
    throw new Error('Not implemented in Phase 1')
  }
}