import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface SignatureData {
  fullName: string
  identificationNumber: string
  signingTimestamp: string
  ipAddress: string
  originalPdfHash: string
}

export class PDFUtil {
  static async appendSignatureBlock(pdfBuffer: Buffer, signatureData: SignatureData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]

    const { width, height } = lastPage.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 10

    const signatureText = `
Electronic Signature Block
-------------------------
Full Name: ${signatureData.fullName}
Identification Number: ${signatureData.identificationNumber}
Signing Timestamp (UTC): ${signatureData.signingTimestamp}
IP Address: ${signatureData.ipAddress}
Original PDF Hash (SHA-256): ${signatureData.originalPdfHash}

This document has been electronically signed.
`

    // const textWidth = font.widthOfTextAtSize(signatureText, fontSize)
    // const textHeight = font.heightAtSize(fontSize) * signatureText.split('\n').length

    // Position at bottom of page with some margin
    const x = 100
    let yPosition = 150

    const signatureLines = signatureText.split('\n')

    for (const line of signatureLines) {
        lastPage.drawText(line, {
            x: x,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0)
        })
        yPosition -= 14
    }

    const uint8Array = await pdfDoc.save()
    return Buffer.from(uint8Array)
  }
}