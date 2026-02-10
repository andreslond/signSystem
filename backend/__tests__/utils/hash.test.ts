import { HashUtil } from '../../src/utils/hash'

describe('HashUtil', () => {
  describe('sha256', () => {
    it('should generate correct SHA-256 hash for a buffer', () => {
      const buffer = Buffer.from('test data')
      const hash = HashUtil.sha256(buffer)

      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9')
      expect(hash).toHaveLength(64) // SHA-256 produces 64 character hex string
    })

    it('should generate different hashes for different inputs', () => {
      const buffer1 = Buffer.from('test data 1')
      const buffer2 = Buffer.from('test data 2')

      const hash1 = HashUtil.sha256(buffer1)
      const hash2 = HashUtil.sha256(buffer2)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate same hash for identical inputs', () => {
      const buffer1 = Buffer.from('identical data')
      const buffer2 = Buffer.from('identical data')

      const hash1 = HashUtil.sha256(buffer1)
      const hash2 = HashUtil.sha256(buffer2)

      expect(hash1).toBe(hash2)
    })

    it('should handle empty buffer', () => {
      const buffer = Buffer.from('')
      const hash = HashUtil.sha256(buffer)

      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('should handle large buffer', () => {
      const largeBuffer = Buffer.alloc(1024 * 1024, 'a') // 1MB of 'a' characters
      const hash = HashUtil.sha256(largeBuffer)

      expect(hash).toHaveLength(64)
      expect(typeof hash).toBe('string')
    })
  })
})