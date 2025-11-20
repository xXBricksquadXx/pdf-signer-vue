<template>
  <section class="layout">
    <!-- LEFT: controls -->
    <div class="panel left">
      <h2>Sign PDF</h2>

      <div class="block">
        <label class="label">1. Upload PDF</label>
        <input type="file" accept="application/pdf" @change="onPdfSelected" />
        <p class="hint">Use the preview on the right to see the page, then adjust offsets.</p>
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
        <p class="hint">Set which page to stamp (preview shows the whole document).</p>
      </div>

      <div class="block">
        <label class="label">4. Position (offsets)</label>

        <div class="offset-control">
          <span class="offset-label">X offset (left → right)</span>
          <input type="range" min="0" max="100" v-model.number="xOffset" />
          <span class="offset-value">{{ xOffset }}%</span>
        </div>

        <div class="offset-control">
          <span class="offset-label">Y offset (bottom → top)</span>
          <input type="range" min="0" max="100" v-model.number="yOffset" />
          <span class="offset-value">{{ yOffset }}%</span>
        </div>

        <p class="hint">Adjust until the signature lands on the line you want.</p>
      </div>

      <div class="block">
        <label class="label">5. Stamp & Download</label>
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
import { ref, onUnmounted } from 'vue'
import { PDFDocument } from 'pdf-lib'
import SignaturePad from '../components/SignaturePad.vue'

const pdfBytes = ref(null)
const pdfName = ref('')
const pdfUrl = ref(null)
const pageCount = ref(0)
const targetPage = ref(1)
const status = ref('')
const sigRef = ref(null)

// offsets in percent (0–100)
const xOffset = ref(80) // start near bottom-right
const yOffset = ref(10)

onUnmounted(() => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
})

async function onPdfSelected(event) {
  const input = event.target
  const file = input.files[0]

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
  status.value = `Loaded PDF: ${file.name}`

  // preview URL
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
  pdfUrl.value = URL.createObjectURL(file)

  // page count via pdf-lib
  const pdfDoc = await PDFDocument.load(buf)
  pageCount.value = pdfDoc.getPageCount ? pdfDoc.getPageCount() : pdfDoc.getPages().length

  targetPage.value = 1

  // allow selecting the same file again later
  input.value = ''
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

    const idx = Math.min(Math.max((targetPage.value || 1) - 1, 0), pages.length - 1)
    const page = pages[idx]

    const sigImage = await pdfDoc.embedPng(sigBytes)
    const sigDims = sigImage.scale(0.5) // adjust size if needed

    const { width, height } = page.getSize()

    // offsets 0–100 → coordinates; ensure sig stays fully on page
    const xMax = width - sigDims.width
    const yMax = height - sigDims.height

    const x = (xOffset.value / 100) * xMax
    const y = (yOffset.value / 100) * yMax

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
  flex: 0 0 360px;
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

/* offset controls */
.offset-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.offset-label {
  flex: 0 0 150px;
  font-size: 0.8rem;
  color: #e5e7eb;
}

.offset-control input[type='range'] {
  flex: 1 1 auto;
}

.offset-value {
  width: 3rem;
  text-align: right;
  font-size: 0.8rem;
  color: #e5e7eb;
}

/* preview */

.pdf-preview {
  position: relative;
  margin-top: 0.75rem;
  height: 72vh;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #1f2937;
  background: #020617;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
