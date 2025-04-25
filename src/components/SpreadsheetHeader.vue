<template>
  <div class="spreadsheet-header">
    <h5 class="spreadsheet-title mb-3">Advanced Spreadsheet</h5>

    <!-- Main toolbar -->
    <div class="toolbar mb-3">
      <button class="btn btn-light btn-sm" @click="$emit('export-csv')">
        <i class="bi bi-download"></i> Export CSV
      </button>
      <label class="btn btn-light btn-sm mx-2">
        <i class="bi bi-upload"></i> Import CSV
        <input
          type="file"
          style="display: none"
          @change="$emit('import-csv', $event)"
          accept=".csv"
        />
      </label>
      <button class="btn btn-light btn-sm me-2" @click="$emit('reset')">
        <i class="bi bi-arrow-counterclockwise"></i> Reset
      </button>
      <button class="btn btn-light btn-sm me-2" @click="$emit('add-row')">
        <i class="bi bi-plus"></i> Add Row
      </button>
      <button class="btn btn-light btn-sm me-2" @click="$emit('add-column')">
        <i class="bi bi-plus"></i> Add Column
      </button>
      <!-- New JSON Data Button -->
      <button class="btn btn-info btn-sm" @click="$emit('toggle-json-panel')">
        <i class="bi bi-braces"></i> JSON Data
      </button>
    </div>

    <!-- Formatting toolbar -->
    <div class="formatting-toolbar mb-3">
      <!-- Text style buttons -->
      <div class="btn-group me-2">
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': currentFormat.bold, 'btn-light': !currentFormat.bold }"
          @click="toggleFormat('bold')"
          title="Bold"
        >
          <i class="bi bi-type-bold"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': currentFormat.italic, 'btn-light': !currentFormat.italic }"
          @click="toggleFormat('italic')"
          title="Italic"
        >
          <i class="bi bi-type-italic"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': currentFormat.underline, 'btn-light': !currentFormat.underline }"
          @click="toggleFormat('underline')"
          title="Underline"
        >
          <i class="bi bi-type-underline"></i>
        </button>
      </div>

      <!-- Font family -->
      <div class="dropdown me-2">
        <button
          class="btn btn-sm btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-fonts me-1"></i>
          <span class="d-none d-sm-inline">Font</span>
        </button>
        <ul class="dropdown-menu">
          <li v-for="font in fontFamilies" :key="font.value">
            <a
              class="dropdown-item"
              href="#"
              :style="{ fontFamily: font.value }"
              @click.prevent="setFontFamily(font.value)"
            >
              {{ font.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Font size -->
      <div class="dropdown me-2">
        <button
          class="btn btn-sm btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-123 me-1"></i>
          <span class="d-none d-sm-inline">Size</span>
        </button>
        <ul class="dropdown-menu">
          <li v-for="size in fontSizes" :key="size">
            <a
              class="dropdown-item"
              href="#"
              :style="{ fontSize: size }"
              @click.prevent="setFontSize(size)"
            >
              {{ size }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Text color -->
      <div class="btn-group me-2 dropdown">
        <button
          class="btn btn-sm btn-light dropdown-toggle color-button"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          :style="{ borderBottom: '3px solid ' + currentFormat.textColor }"
          title="Text Color"
        >
          <i class="bi bi-palette-fill"></i>
        </button>
        <div class="dropdown-menu p-2 color-picker">
          <div class="color-grid">
            <div
              v-for="color in colors"
              :key="color.value"
              class="color-option"
              :style="{ backgroundColor: color.value }"
              @click="setTextColor(color.value)"
              :title="color.name"
            ></div>
          </div>
        </div>
      </div>

      <!-- Fill color -->
      <div class="btn-group me-2 dropdown">
        <button
          class="btn btn-sm btn-light dropdown-toggle color-button"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          :style="{
            borderBottom: '3px solid',
            borderColor:
              currentFormat.backgroundColor === 'transparent'
                ? '#ccc'
                : currentFormat.backgroundColor,
          }"
          title="Fill Color"
        >
          <i class="bi bi-paint-bucket"></i>
        </button>
        <div class="dropdown-menu p-2 color-picker">
          <div class="color-grid">
            <div
              v-for="color in fillColors"
              :key="color.value"
              class="color-option"
              :style="{ backgroundColor: color.value }"
              @click="setBackgroundColor(color.value)"
              :title="color.name"
            ></div>
          </div>
        </div>
      </div>

      <!-- Number format -->
      <div class="dropdown me-2">
        <button
          class="btn btn-sm btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Number Format"
        >
          <i class="bi bi-123"></i>
        </button>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('auto')">Automatic</a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('plaintext')"
              >Plain text</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('number')"
              >Number (1,000.12)</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('percent')"
              >Percent (10.12%)</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('scientific')"
              >Scientific (1.01E+03)</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('accounting')"
              >Accounting ($ 1,000.12)</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('financial')"
              >Financial (1,000.12)</a
            >
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setNumberFormat('currency')"
              >Currency ($1,000.12)</a
            >
          </li>
        </ul>
      </div>

      <!-- Decimal places -->
      <div class="btn-group me-2">
        <button
          class="btn btn-sm btn-light"
          @click="decreaseDecimals"
          title="Decrease decimal places"
        >
          <i class="bi bi-dash"></i>.0
        </button>
        <button
          class="btn btn-sm btn-light"
          @click="increaseDecimals"
          title="Increase decimal places"
        >
          <i class="bi bi-plus"></i>.00
        </button>
      </div>

      <!-- Borders -->
      <div class="btn-group me-2 dropdown">
        <button
          class="btn btn-sm btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Borders"
        >
          <i class="bi bi-border-all"></i>
        </button>
        <div class="dropdown-menu p-2">
          <button
            class="dropdown-item"
            @click="
              setBorders({
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
              })
            "
          >
            <i class="bi bi-border-none"></i> No Border
          </button>
          <button
            class="dropdown-item"
            @click="
              setBorders({
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderLeft: '1px solid',
              })
            "
          >
            <i class="bi bi-border-all"></i> All Borders
          </button>
          <button
            class="dropdown-item"
            @click="
              setBorders({
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderLeft: '1px solid',
              })
            "
          >
            <i class="bi bi-border-outer"></i> Outer Border
          </button>
          <button class="dropdown-item" @click="setBorders({ borderBottom: '1px solid' })">
            <i class="bi bi-border-bottom"></i> Bottom Border
          </button>
          <button class="dropdown-item" @click="setBorders({ borderTop: '1px solid' })">
            <i class="bi bi-border-top"></i> Top Border
          </button>
          <button class="dropdown-item" @click="setBorders({ borderLeft: '1px solid' })">
            <i class="bi bi-border-left"></i> Left Border
          </button>
          <button class="dropdown-item" @click="setBorders({ borderRight: '1px solid' })">
            <i class="bi bi-border-right"></i> Right Border
          </button>
        </div>
      </div>

      <!-- Text rotation -->
      <div class="dropdown me-2">
        <button
          class="btn btn-sm btn-light dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Text Rotation"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setTextRotation(0)">
              <i class="bi bi-text-left"></i> No Rotation
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setTextRotation(90)">
              <i class="bi bi-arrow-90deg-right"></i> Rotate 90°
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setTextRotation(-90)">
              <i class="bi bi-arrow-90deg-left"></i> Rotate -90°
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setTextRotation(45)">
              <i class="bi bi-arrow-up-right"></i> Rotate 45°
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="setTextRotation(-45)">
              <i class="bi bi-arrow-up-left"></i> Rotate -45°
            </a>
          </li>
        </ul>
      </div>

      <!-- Text wrap -->
      <div class="btn-group me-2">
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': currentFormat.wrapText, 'btn-light': !currentFormat.wrapText }"
          @click="toggleWrapText()"
          title="Wrap Text"
        >
          <i class="bi bi-text-wrap"></i>
        </button>
      </div>

      <!-- Alignment -->
      <div class="btn-group me-2">
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.align === 'left',
            'btn-light': currentFormat.align !== 'left',
          }"
          @click="setAlignment('left')"
          title="Align Left"
        >
          <i class="bi bi-text-left"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.align === 'center',
            'btn-light': currentFormat.align !== 'center',
          }"
          @click="setAlignment('center')"
          title="Align Center"
        >
          <i class="bi bi-text-center"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.align === 'right',
            'btn-light': currentFormat.align !== 'right',
          }"
          @click="setAlignment('right')"
          title="Align Right"
        >
          <i class="bi bi-text-right"></i>
        </button>
      </div>

      <!-- Vertical alignment -->
      <div class="btn-group me-2">
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.verticalAlign === 'top',
            'btn-light': currentFormat.verticalAlign !== 'top',
          }"
          @click="setVerticalAlignment('top')"
          title="Align Top"
        >
          <i class="bi bi-align-top"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.verticalAlign === 'middle',
            'btn-light': currentFormat.verticalAlign !== 'middle',
          }"
          @click="setVerticalAlignment('middle')"
          title="Align Middle"
        >
          <i class="bi bi-align-middle"></i>
        </button>
        <button
          class="btn btn-sm"
          :class="{
            'btn-primary': currentFormat.verticalAlign === 'bottom',
            'btn-light': currentFormat.verticalAlign !== 'bottom',
          }"
          @click="setVerticalAlignment('bottom')"
          title="Align Bottom"
        >
          <i class="bi bi-align-bottom"></i>
        </button>
      </div>

      <!-- Clear formatting -->
      <button class="btn btn-sm btn-light" @click="clearFormatting" title="Clear Formatting">
        <i class="bi bi-eraser"></i>
      </button>
    </div>

    <div class="help-text small text-muted mb-2">
      <div class="mb-1">
        <strong>Formula Tip:</strong> Try entering a formula like =A1+B1 in a cell
      </div>
      <div class="mb-1">
        <strong>JSON Data:</strong> Access JSON data using =data.users[0].name or =data.product.price
      </div>
      <div>
        <strong>Keyboard Shortcuts:</strong>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>C</kbd> Copy</span>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>V</kbd> Paste</span>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>X</kbd> Cut</span>
        <span class="shortcut"><kbd>Enter</kbd> Edit Cell</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const colors = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#777777' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Orange', value: '#ff9900' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Cyan', value: '#00ffff' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Purple', value: '#9900ff' },
  { name: 'Magenta', value: '#ff00ff' },
]

const fillColors = [
  { name: 'None', value: 'transparent' },
  { name: 'Light Gray', value: '#f5f5f5' },
  { name: 'Light Yellow', value: '#ffffcc' },
  { name: 'Light Green', value: '#ccffcc' },
  { name: 'Light Blue', value: '#ccccff' },
  { name: 'Light Purple', value: '#eeccff' },
  { name: 'Light Pink', value: '#ffcccc' },
  { name: 'Light Orange', value: '#ffddcc' },
  { name: 'White', value: '#ffffff' },
]

const fontFamilies = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

const fontSizes = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px',
  '36px',
  '48px',
  '72px',
]

// Default formatting
const defaultFormat = {
  bold: false,
  italic: false,
  underline: false,
  textColor: '#000000',
  backgroundColor: 'transparent',
  fontSize: '14px',
  fontFamily: 'Arial, sans-serif',
  align: 'center',
  verticalAlign: 'middle',
  textRotation: 0,
  borderTop: '1px solid #dee2e6',
  borderRight: '1px solid #dee2e6',
  borderBottom: '1px solid #dee2e6',
  borderLeft: '1px solid #dee2e6',
  borderColor: '#dee2e6',
  numberFormat: 'auto',
  decimalPlaces: 2,
  useThousandsSeparator: true,
  currencySymbol: '$',
  customFormat: null,
  wrapText: false,
}

const currentFormat = reactive({ ...defaultFormat })

// Props
const props = defineProps({
  currentFormatting: {
    type: Object,
    default: () => null,
  },
})

watch(
  () => props.currentFormatting,
  (newFormatting) => {
    if (newFormatting) {
      Object.assign(currentFormat, newFormatting)
    }
  },
  { deep: true, immediate: true },
)

const emit = defineEmits([
  'export-csv',
  'import-csv',
  'reset',
  'add-row',
  'add-column',
  'update-formatting',
  'toggle-json-panel', // New event for JSON panel
])

const toggleFormat = (format) => {
  currentFormat[format] = !currentFormat[format]
  emitFormatting({ [format]: currentFormat[format] })
}

const setFontFamily = (fontFamily) => {
  currentFormat.fontFamily = fontFamily
  emitFormatting({ fontFamily })
}

const setFontSize = (fontSize) => {
  currentFormat.fontSize = fontSize
  emitFormatting({ fontSize })
}

const setTextColor = (color) => {
  currentFormat.textColor = color
  emitFormatting({ textColor: color })
}

const setBackgroundColor = (color) => {
  currentFormat.backgroundColor = color
  emitFormatting({ backgroundColor: color })
}

const setTextRotation = (angle) => {
  currentFormat.textRotation = angle
  emitFormatting({ textRotation: angle })
}

const toggleWrapText = () => {
  currentFormat.wrapText = !currentFormat.wrapText
  emitFormatting({ wrapText: currentFormat.wrapText })
}

const setBorders = (borders) => {
  const borderChanges = {}

  if (borders.borderTop !== undefined) {
    if (borders.borderTop === '1px solid') borders.borderTop = '1px solid #571717'
    borderChanges.borderTop = borders.borderTop
    currentFormat.borderTop = borders.borderTop
  }

  if (borders.borderRight !== undefined) {
    if (borders.borderRight === '1px solid') borders.borderRight = '1px solid #333'
    borderChanges.borderRight = borders.borderRight
    currentFormat.borderRight = borders.borderRight
  }

  if (borders.borderBottom !== undefined) {
    if (borders.borderBottom === '1px solid') borders.borderBottom = '1px solid #333'
    borderChanges.borderBottom = borders.borderBottom
    currentFormat.borderBottom = borders.borderBottom
  }

  if (borders.borderLeft !== undefined) {
    if (borders.borderLeft === '1px solid') borders.borderLeft = '1px solid #333'
    borderChanges.borderLeft = borders.borderLeft
    currentFormat.borderLeft = borders.borderLeft
  }

  if (borders.borderColor !== undefined) {
    borderChanges.borderColor = borders.borderColor
    currentFormat.borderColor = borders.borderColor
  }

  emitFormatting(borderChanges)
}

const setAlignment = (align) => {
  currentFormat.align = align
  emitFormatting({ align })
}

const setVerticalAlignment = (align) => {
  currentFormat.verticalAlign = align
  emitFormatting({ verticalAlign: align })
}

const setNumberFormat = (format) => {
  currentFormat.numberFormat = format
  currentFormat.customFormat = null
  emitFormatting({
    numberFormat: format,
    customFormat: null,
  })
}

const increaseDecimals = () => {
  currentFormat.decimalPlaces = Math.min(10, currentFormat.decimalPlaces + 1)
  emitFormatting({ decimalPlaces: currentFormat.decimalPlaces })
}

const decreaseDecimals = () => {
  currentFormat.decimalPlaces = Math.max(0, currentFormat.decimalPlaces - 1)
  emitFormatting({ decimalPlaces: currentFormat.decimalPlaces })
}

const clearFormatting = () => {
  Object.assign(currentFormat, defaultFormat)
  emitFormatting({ ...defaultFormat })
}

const emitFormatting = (formattingChanges) => {
  emit('update-formatting', formattingChanges)
}
</script>

<style scoped>
.dropdown-menu {
  z-index: 1050 !important;
  position: absolute !important;
}

.dropdown-menu.show {
  display: block !important;
}

.dropdown {
  position: relative !important;
}

.btn-group {
  position: relative;
  z-index: 5;
}

.spreadsheet-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  position: relative;
  z-index: 10;
}

.spreadsheet-title {
  font-weight: 500;
  color: #212529;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.formatting-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
}

.btn-light {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #212529;
}

.btn-light:hover {
  background-color: #e9ecef;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  border: 1px solid #dee2e6;
  cursor: pointer;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: #0d6efd;
}

.color-button {
  position: relative;
  padding-bottom: 0.75rem;
}

.help-text {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.5;
}

kbd {
  display: inline-block;
  padding: 0.1rem 0.25rem;
  font-size: 11px;
  line-height: 1;
  color: #212529;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

.shortcut {
  margin-right: 0.75rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .formatting-toolbar {
    flex-wrap: nowrap;
    white-space: nowrap;
  }
}
</style>