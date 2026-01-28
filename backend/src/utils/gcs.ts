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
    this.init()
    const file = this.storage.bucket(this.bucketName).file(filePath)
    const [buffer] = await file.download()
    return buffer
  }

  static async uploadPdf(filePath: string, buffer: Buffer): Promise<void> {
    this.init()
    const file = this.storage.bucket(this.bucketName).file(filePath)
    await file.save(buffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    })
  }

  static async deletePdf(filePath: string): Promise<void> {
    this.init()
    const file = this.storage.bucket(this.bucketName).file(filePath)
    await file.delete()
  }
}