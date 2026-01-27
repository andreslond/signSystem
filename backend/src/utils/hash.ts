import { createHash } from 'crypto'

export class HashUtil {
  static sha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
  }
}