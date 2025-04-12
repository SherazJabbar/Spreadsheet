<template>
  <div class="spreadsheet-app">
    <div class="spreadsheet-wrapper">
      <SpreadsheetHeader
        @export-csv="exportCSV"
        @import-csv="importCSV"
        @reset="resetSpreadsheet"
        @add-row="addRowAtSelection"
        @add-column="addColumnAtSelection"
      />

      <div class="spreadsheet-container">
        <SpreadsheetTable
          :columns="columns"
          :rows="rows"
          :display-cell-value="displayCellValue"
          :is-selected-cell="isSelectedCell"
          :is-in-selected-range="isInSelectedRange"
          :get-column-label="getColumnLabel"
          :select-cell="selectCell"
          :select-entire-row="selectEntireRow"
          :select-entire-column="selectEntireColumn"
          :edit-cell="editCell"
          :handle-editor-key-down="handleEditorKeyDown"
          :finish-editing="finishEditing"
          :start-range-selection="startRangeSelection"
          :update-range-selection="updateRangeSelection"
          :end-range-selection="endRangeSelection"
          :start-resize="startResize"
          :editing="editing"
          :edit-value="editValue"
          v-model:edit-value="editValue"
        />
      </div>
    </div>

    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div
        class="toast align-items-center text-white bg-dark border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="copy-status"
      >
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-clipboard-check me-2"></i> Selection copied to clipboard
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SpreadsheetHeader from '@/components/SpreadsheetHeader.vue'
import SpreadsheetTable from '@/components/SpreadsheetTable.vue'

import { useGridData } from '@/composables/useGridData'
import { useSelection } from '@/composables/useSelection'
import { useFormulas } from '@/composables/useFormulas'
import { useClipboard } from '@/composables/useClipboard'
import { useColumnResize } from '@/composables/useColumnResize'
import { useExportImport } from '@/composables/useImportExport'

const { rowCount, colCount, columns, rows, gridData, addRow, addColumn, resetSpreadsheet } =
  useGridData()

const {
  selectedCell,
  selectionRange,
  editing,
  editValue,
  hasSelection,
  getSelectionBoundaries,
  isSelectedCell,
  isInSelectedRange,
  selectCell,
  selectEntireRow,
  selectEntireColumn,
  startRangeSelection,
  updateRangeSelection,
  endRangeSelection,
  editCell,
  handleEditorKeyDown,
  finishEditing,
  handleKeyDown,
} = useSelection(rowCount, colCount, gridData)

const { getColumnLabel, getCellReference, colLabelToIndex, parseFormula, displayCellValue } =
  useFormulas(rowCount, colCount, gridData)

// Create local functions that will use the clipboard utilities
// This allows us to modify their behavior without reassigning to constants
const clipboardUtils = useClipboard(
  gridData,
  rowCount,
  colCount,
  selectedCell,
  getSelectionBoundaries,
  hasSelection,
)

// Create wrapper functions so we don't reassign to constants
const copySelectedCells = () => {
  clipboardUtils.copySelectedCells()
  showToastNotification()
}

const cutSelectedCells = () => {
  clipboardUtils.cutSelectedCells()
}

const pasteFromClipboard = async () => {
  return await clipboardUtils.pasteFromClipboard()
}

// Initialize column resizing
const { columnWidths, startResize, addColumnWidth } = useColumnResize(colCount)

// Initialize export/import
const { exportCSV, importCSV } = useExportImport(
  rowCount,
  colCount,
  gridData,
  getColumnLabel,
  displayCellValue,
)

// Update the showCopyStatus function to use Bootstrap toast
const showToastNotification = () => {
  const statusEl = document.getElementById('copy-status')
  if (statusEl && typeof bootstrap !== 'undefined') {
    const toast = new bootstrap.Toast(statusEl)
    toast.show()
  }
}

// Handle keyboard events at the document level
const setupKeyboardHandlers = () => {
  const handleGlobalKeyDown = (event) => {
    // Ignore if we're currently editing
    if (editing.row !== null && editing.col !== null) return

    // Copy (Ctrl+C)
    if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault()
      copySelectedCells()
      return
    }

    // Paste (Ctrl+V)
    if (event.ctrlKey && (event.key === 'v' || event.key === 'V')) {
      event.preventDefault()
      const pasteResult = pasteFromClipboard()
      if (pasteResult) {
        selectionRange.startRow = pasteResult.startRow
        selectionRange.startCol = pasteResult.startCol
        selectionRange.endRow = pasteResult.endRow
        selectionRange.endCol = pasteResult.endCol
      }
      return
    }

    // Cut (Ctrl+X)
    if (event.ctrlKey && (event.key === 'x' || event.key === 'X')) {
      event.preventDefault()
      cutSelectedCells()
      return
    }

    // Handle other keyboard navigation
    handleKeyDown(event)
  }

  document.addEventListener('keydown', handleGlobalKeyDown)
}

// Add row at selection position
const addRowAtSelection = () => {
  let insertIndex

  if (hasSelection()) {
    const { endRow } = getSelectionBoundaries()
    insertIndex = endRow + 1
  } else if (selectedCell.row !== null) {
    insertIndex = selectedCell.row + 1
  } else {
    insertIndex = rowCount.value
  }

  addRow(insertIndex)
}

// Add column at selection position
const addColumnAtSelection = () => {
  let insertIndex

  if (hasSelection()) {
    const { endCol } = getSelectionBoundaries()
    insertIndex = endCol + 1
  } else if (selectedCell.col !== null) {
    insertIndex = selectedCell.col + 1
  } else {
    insertIndex = colCount.value
  }

  addColumn(insertIndex)
  addColumnWidth()
}

// Setup spreadsheet on component mount
onMounted(() => {
  setupKeyboardHandlers()
  resetSpreadsheet()
})
</script>

<style>
body {
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

.spreadsheet-app {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 1rem;
  box-sizing: border-box;
}

.spreadsheet-wrapper {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  width: 100%;
  max-width: 1200px; /* Set a max-width for larger screens */
  height: calc(100vh - 2rem);
  overflow: hidden;
}

.spreadsheet-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
