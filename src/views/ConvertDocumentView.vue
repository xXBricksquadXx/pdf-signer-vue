<template>
  <section class="panel">
    <h2>Convert Document → PDF</h2>

    <div class="block">
      <label class="label">Upload document</label>
      <input type="file" :accept="acceptTypes" @change="onFileSelected" />
      <p class="hint">Target: .docx / .odt / .rtf / .txt / images → PDF via backend service.</p>
      <p v-if="fileName" class="hint">Selected: {{ fileName }}</p>
    </div>

    <div class="block">
      <button class="primary" type="button" :disabled="!file || converting" @click="convert">
        {{ converting ? 'Converting…' : 'Convert to PDF (stub)' }}
      </button>
      <p class="hint">
        Currently stubbed: this will later call an API like
        <code>POST /api/convert</code> (Python/Node) and download the returned PDF.
      </p>
      <p class="hint">{{ status }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const acceptTypes = '.pdf,.doc,.docx,.odt,.rtf,.txt,.png,.jpg,.jpeg,.webp,.heic'

const file = ref(null)
const fileName = ref('')
const converting = ref(false)
const status = ref('')

function onFileSelected(event) {
  const f = event.target.files[0]
  file.value = f || null
  fileName.value = f ? f.name : ''
  status.value = f ? '' : 'No file selected.'
}

async function convert() {
  if (!file.value) {
    status.value = 'Select a file first.'
    return
  }

  converting.value = true
  status.value = 'Stub: this is where we will call the backend converter.'

  // later:
  // const form = new FormData()
  // form.append('file', file.value)
  // const res = await fetch('/api/convert', { method: 'POST', body: form })
  // const blob = await res.blob()
  // ... trigger download

  setTimeout(() => {
    converting.value = false
    status.value = 'Conversion stub complete. Backend wiring is the next step.'
  }, 600)
}
</script>

<style scoped>
.panel {
  border: 1px solid #1f2937;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: #020617;
  max-width: 720px;
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
.primary:disabled {
  opacity: 0.5;
  cursor: default;
}
.primary:hover:enabled {
  background: #1f2937;
}
</style>
