import { Storage } from '@google-cloud/storage'
import * as path from 'path'

export class GCSUtil {
  private static storage: Storage
  private static bucketName: string

  static init() {
    if (!this.storage) {
      const keyFilename = path.join(__dirname, '../../secrets/gcp-key.json')
      this.storage = new Storage({ keyFilename })
      this.bucketName = process.env.GCS_BUCKET!
    }
  }

  static async downloadPdf(filePath: string): Promise<Buffer> {
    try {
      this.init()
      const file = this.storage.bucket(this.bucketName).file(filePath)
      const [buffer] = await file.download()
      return buffer
    } catch (error) {
      throw new Error(`Failed to download PDF from GCS: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static async uploadPdf(filePath: string, buffer: Buffer): Promise<void> {
    try {
      this.init()
      const file = this.storage.bucket(this.bucketName).file(filePath)
      await file.save(buffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      })
    } catch (error) {
      throw new Error(`Failed to upload PDF to GCS: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  static async deletePdf(filePath: string): Promise<void> {
    try {
      this.init()
      const file = this.storage.bucket(this.bucketName).file(filePath)
      await file.delete()
    } catch (error) {
      throw new Error(`Failed to delete PDF from GCS: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}