import { GCSUtil } from '../../src/utils/gcs'

// Mock @google-cloud/storage
jest.mock('@google-cloud/storage', () => {
  const mockFile = {
    download: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  const mockBucket = {
    file: jest.fn(() => mockFile),
  }

  const mockStorage = {
    bucket: jest.fn(() => mockBucket),
  }

  return {
    Storage: jest.fn(() => mockStorage),
  }
})

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}))

describe('GCSUtil', () => {
  let mockStorage: any
  let mockBucket: any
  let mockFile: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the static instance
    ;(GCSUtil as any).storage = null
    ;(GCSUtil as any).bucketName = null

    // Get the mocked instances
    const Storage = require('@google-cloud/storage').Storage
    mockStorage = new Storage()
    mockBucket = mockStorage.bucket()
    mockFile = mockBucket.file()
  })

  describe('downloadPdf', () => {
    it('should download PDF from GCS', async () => {
      const testBuffer = Buffer.from('test pdf content')
      mockFile.download.mockResolvedValue([testBuffer])

      const result = await GCSUtil.downloadPdf('test/path.pdf')

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket')
      expect(mockBucket.file).toHaveBeenCalledWith('test/path.pdf')
      expect(mockFile.download).toHaveBeenCalled()
      expect(result).toBe(testBuffer)
    })

    it('should throw error on download failure', async () => {
      const error = new Error('Download failed')
      mockFile.download.mockRejectedValue(error)

      await expect(GCSUtil.downloadPdf('test/path.pdf')).rejects.toThrow('Failed to download PDF from GCS: Download failed')
    })
  })

  describe('uploadPdf', () => {
    it('should upload PDF to GCS with correct metadata', async () => {
      mockFile.save.mockResolvedValue(undefined)

      const testBuffer = Buffer.from('test pdf content')
      await GCSUtil.uploadPdf('test/path.pdf', testBuffer)

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket')
      expect(mockBucket.file).toHaveBeenCalledWith('test/path.pdf')
      expect(mockFile.save).toHaveBeenCalledWith(testBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      })
    })

    it('should throw error on upload failure', async () => {
      const error = new Error('Upload failed')
      mockFile.save.mockRejectedValue(error)

      const testBuffer = Buffer.from('test pdf content')
      await expect(GCSUtil.uploadPdf('test/path.pdf', testBuffer)).rejects.toThrow('Failed to upload PDF to GCS: Upload failed')
    })
  })

  describe('deletePdf', () => {
    it('should delete PDF from GCS', async () => {
      mockFile.delete.mockResolvedValue(undefined)

      await GCSUtil.deletePdf('test/path.pdf')

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket')
      expect(mockBucket.file).toHaveBeenCalledWith('test/path.pdf')
      expect(mockFile.delete).toHaveBeenCalled()
    })

    it('should throw error on delete failure', async () => {
      const error = new Error('Delete failed')
      mockFile.delete.mockRejectedValue(error)

      await expect(GCSUtil.deletePdf('test/path.pdf')).rejects.toThrow('Failed to delete PDF from GCS: Delete failed')
    })
  })

  describe('initialization', () => {
    it('should initialize storage and bucket on first call', async () => {
      // Call any method to trigger init
      mockFile.download.mockResolvedValue([Buffer.from('test')])
      await GCSUtil.downloadPdf('test.pdf')

      expect(require('@google-cloud/storage').Storage).toHaveBeenCalledWith({
        keyFilename: expect.stringContaining('gcp-key.json'),
      })
      expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket')
    })

    it('should reuse initialized storage instance', async () => {
      // Reset the mock call count from beforeEach
      const Storage = require('@google-cloud/storage').Storage
      Storage.mockClear()

      mockFile.download.mockResolvedValue([Buffer.from('test')])
      await GCSUtil.downloadPdf('test1.pdf')
      await GCSUtil.downloadPdf('test2.pdf')

      expect(Storage).toHaveBeenCalledTimes(1)
    })
  })
})