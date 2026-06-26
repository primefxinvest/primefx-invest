'use client'

const PDFJS_VERSION = '4.4.168'

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> }
}

type PdfDocument = {
  getPage: (page: number) => Promise<PdfPage>
}

type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number }
  render: (params: {
    canvasContext: CanvasRenderingContext2D
    viewport: { width: number; height: number }
  }) => { promise: Promise<void> }
}

let pdfJsPromise: Promise<PdfJsModule> | null = null

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import(
      /* webpackIgnore: true */
      `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`
    ).then((mod) => {
      const pdfjs = mod as PdfJsModule
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`
      return pdfjs
    })
  }
  return pdfJsPromise
}

async function pdfFirstPageToDataUrl(file: File): Promise<string> {
  const pdfjs = await loadPdfJs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not prepare PDF preview for scanning.')
  }
  await page.render({ canvasContext: context, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.9)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

export async function fileToScanImageDataUrl(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return pdfFirstPageToDataUrl(file)
  }
  if (file.type.startsWith('image/')) {
    return fileToDataUrl(file)
  }
  throw new Error('Unsupported file type for document scanning.')
}
