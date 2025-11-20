<template>
  <section class="layout">
    <!-- LEFT: controls -->
    <div class="panel left">
      <h2>Sign PDF</h2>

      <div class="block">
        <label class="label">1. Upload PDF</label>
        <input type="file" accept="application/pdf" @change="onPdfSelected" />
        <p class="hint">MVP: signature is stamped bottom-right on the selected page.</p>
        <p v-if="pdfName" class="hint">
          Loaded: {{ pdfName }} ({{ pageCount }} page<span v-if="pageCount !== 1">s</span>)
        </p>
      </div>

      <div class="block">
        <label class="label">2. Draw Signature</label>
        <SignaturePad ref="sigRef" :width="420" :height="160" />
        <p class="hint">Use mouse or touch. Everything stays in the browser.</p>
      </div>

      <div class="block">
        <label class="label">3. Target page</label>
        <input
          type="number"
          v-model.number="targetPage"
          :min="1"
          :max="pageCount || 1"
          class="page-input"
        />
        <p class="hint">Scroll the preview on the right, then choose the page to stamp.</p>
      </div>

      <div class="block">
        <label class="label">4. Stamp & Download</label>
        <button type="button" class="primary" @click="downloadSigned">Download signed PDF</button>
        <p class="hint">{{ status }}</p>
      </div>
    </div>

    <!-- RIGHT: preview -->
    <div class="panel right">
      <h3>Preview</h3>
      <div v-if="pdfUrl" class="pdf-preview">
        <iframe :src="pdfUrl" title="PDF preview" class="pdf-frame"></iframe>
      </div>
      <p v-else class="hint">Upload a PDF on the left to see it here.</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { PDFDocument } from 'pdf-lib'
import SignaturePad from '../components/SignaturePad.vue'

const pdfBytes = ref(null)
const pdfName = ref('')
const pdfUrl = ref(null)
const pageCount = ref(0)
const targetPage = ref(1)
const status = ref('')
const sigRef = ref(null)

async function onPdfSelected(event) {
  const file = event.target.files[0]
  if (!file) {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
    pdfBytes.value = null
    pdfName.value = ''
    pdfUrl.value = null
    pageCount.value = 0
    targetPage.value = 1
    status.value = 'No PDF selected.'
    return
  }

  const buf = await file.arrayBuffer()
  pdfBytes.value = buf
  pdfName.value = file.name

  // preview URL
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
  pdfUrl.value = URL.createObjectURL(file)

  // page count (for UI)
  const pdfDoc = await PDFDocument.load(buf)
  // getPageCount() exists in newer pdf-lib, fallback to pages.length
  pageCount.value = pdfDoc.getPageCount ? pdfDoc.getPageCount() : pdfDoc.getPages().length

  targetPage.value = 1
  status.value = `Loaded PDF: ${file.name}`
}

function dataURLToUint8Array(dataURL) {
  const base64 = dataURL.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function downloadSigned() {
  if (!pdfBytes.value) {
    status.value = 'Select a PDF first.'
    return
  }

  if (!sigRef.value || sigRef.value.isEmpty()) {
    status.value = 'Draw a signature first.'
    return
  }

  status.value = 'Stamping signature...'

  try {
    const sigDataUrl = sigRef.value.getPngDataUrl()
    const sigBytes = dataURLToUint8Array(sigDataUrl)

    const pdfDoc = await PDFDocument.load(pdfBytes.value)
    const pages = pdfDoc.getPages()

    // clamp page index
    const idx = Math.min(Math.max((targetPage.value || 1) - 1, 0), pages.length - 1)

    const page = pages[idx]

    const sigImage = await pdfDoc.embedPng(sigBytes)
    const sigDims = sigImage.scale(0.5) // adjust scaling here

    const { width } = page.getSize()
    const margin = 36
    const x = width - sigDims.width - margin
    const y = margin

    page.drawImage(sigImage, {
      x,
      y,
      width: sigDims.width,
      height: sigDims.height,
    })

    const signedBytes = await pdfDoc.save()
    const blob = new Blob([signedBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = pdfName.value ? pdfName.value.replace(/\.pdf$/i, '') + '_signed.pdf' : 'signed.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    status.value = `Signed PDF downloaded (page ${idx + 1}).`
  } catch (err) {
    console.error(err)
    status.value = 'Error while signing PDF (check console).'
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
}

.panel {
  border: 1px solid #1f2937;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: #020617;
}

.left {
  flex: 0 0 360px; /* slightly narrower to give more space to preview */
}

.right {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.block {
  margin-top: 1rem;
}

.label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.hint {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.primary {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #111827;
  color: #f9fafb;
  cursor: pointer;
  font-size: 0.9rem;
}

.primary:hover {
  background: #1f2937;
}

.page-input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
}

/* Bigger viewer */
.pdf-preview {
  margin-top: 0.75rem;
  height: 72vh; /* big, scrollable viewport */
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #1f2937;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
