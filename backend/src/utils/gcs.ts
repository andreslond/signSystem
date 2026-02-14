import { Storage } from '@google-cloud/storage'
import * as path from 'path'

interface GcpCredentials {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

export class GCSUtil {
  private static storage: Storage
  private static bucketName: string

  static init() {
    if (!this.storage) {
      const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON
      
      if (!credentialsJson) {
        throw new Error('GCP_SERVICE_ACCOUNT_JSON environment variable is not set')
      }
      
      let credentials: GcpCredentials
      try {
        credentials = JSON.parse(credentialsJson)
      } catch (error) {
        throw new Error('Failed to parse GCP_SERVICE_ACCOUNT_JSON: Invalid JSON format')
      }
      
      this.storage = new Storage({
        credentials
      })
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

  /**
   * Generate a signed URL for accessing a PDF file
   * @param filePath - Path to the file in GCS
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL string
   */
  static async getSignedUrl(filePath: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      this.init()
      const file = this.storage.bucket(this.bucketName).file(filePath)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
        version: 'v4'
      })
      return url
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}