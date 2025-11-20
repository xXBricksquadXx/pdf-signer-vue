<template>
  <div class="sig-container">
    <canvas
      ref="canvasEl"
      :width="width"
      :height="height"
      class="sig-canvas"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="endDraw"
      @mouseleave="endDraw"
      @touchstart.prevent="startDraw"
      @touchmove.prevent="draw"
      @touchend.prevent="endDraw"
      @touchcancel.prevent="endDraw"
    ></canvas>
    <button type="button" class="sig-clear" @click="clear">Clear</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  width: { type: Number, default: 400 },
  height: { type: Number, default: 150 },
})

const canvasEl = ref(null)
let ctx = null
let drawing = false

function getPos(event) {
  const canvas = canvasEl.value
  const rect = canvas.getBoundingClientRect()
  const isTouch = event.touches && event.touches.length > 0
  const clientX = isTouch ? event.touches[0].clientX : event.clientX
  const clientY = isTouch ? event.touches[0].clientY : event.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function startDraw(e) {
  drawing = true
  const { x, y } = getPos(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e) {
  if (!drawing) return
  const { x, y } = getPos(e)
  ctx.lineTo(x, y)
  ctx.strokeStyle = '#111827' // dark ink instead of near-white
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function endDraw() {
  if (!drawing) return
  drawing = false
}

function clear() {
  if (!ctx) return
  ctx.clearRect(0, 0, props.width, props.height)
}

function getPngDataUrl() {
  const canvas = canvasEl.value
  if (!canvas) return null
  return canvas.toDataURL('image/png')
}

function isEmpty() {
  if (!ctx) return true
  const canvas = canvasEl.value
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] !== 0) {
      return false
    }
  }
  return true
}

// new: load from saved data URL
function loadFromDataUrl(dataUrl) {
  if (!dataUrl || !canvasEl.value || !ctx) return
  const img = new Image()
  img.onload = () => {
    const canvas = canvasEl.value
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  img.src = dataUrl
}

onMounted(() => {
  if (canvasEl.value) {
    ctx = canvasEl.value.getContext('2d')
  }
})

// expose methods to parent
defineExpose({
  getPngDataUrl,
  clear,
  isEmpty,
  loadFromDataUrl,
})
</script>

<style scoped>
.sig-container {
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sig-canvas {
  border: 1px dashed #4b5563;
  border-radius: 0.75rem;
  background: #ffffff;
  touch-action: none;
}
.sig-clear {
  align-self: flex-start;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
}
.sig-clear:hover {
  background: #1f2937;
}
</style>
