<template>
  <div class="spreadsheet-app">
    <div class="spreadsheet-wrapper">
      <SpreadsheetHeader
        @export-csv="exportCSV"
        @import-csv="importCSV"
        @reset="resetSpreadsheet"
        @add-row="addRowAtSelection"
        @add-column="addColumnAtSelection"
        @update-formatting="applyFormatting"
        :current-formatting="getCurrentCellFormatting()"
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
          :get-cell-formatting="getCellFormatting"
          :get-row-height="getRowHeight"
          :get-column-width="getColumnWidth"
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
import { onMounted, ref, nextTick } from 'vue'
import SpreadsheetHeader from '@/components/SpreadsheetHeader.vue'
import SpreadsheetTable from '@/components/SpreadsheetTable.vue'

import { useGridData } from '@/composables/useGridData'
import { useSelection } from '@/composables/useSelection'
import { useFormulas } from '@/composables/useFormulas'
import { useClipboard } from '@/composables/useClipboard'
import { useColumnResize } from '@/composables/useColumnResize'
import { useExportImport } from '@/composables/useImportExport'

// Get grid data with all formatting features
const {
  rowCount,
  colCount,
  columns,
  rows,
  gridData,
  cellFormatting,
  rowHeights,
  columnWidths,
  getCellFormatting,
  updateCellFormatting,
  applyFormattingToRange,
  getRowHeight,
  setRowHeight,
  getColumnWidth,
  setColumnWidth,
  addRow,
  addColumn,
  resetSpreadsheet
} = useGridData()

// Use existing selection composable
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

const clipboardUtils = useClipboard(
  gridData,
  rowCount,
  colCount,
  selectedCell,
  getSelectionBoundaries,
  hasSelection,
)

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

const startResize = (event, colIndex) => {
  const startX = event.clientX
  const startWidth = getColumnWidth(colIndex)
  
  const handleMouseMove = (moveEvent) => {
    const delta = moveEvent.clientX - startX
    const newWidth = Math.max(50, startWidth + delta)
    setColumnWidth(colIndex, newWidth)
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const { exportCSV, importCSV } = useExportImport(
  rowCount,
  colCount,
  gridData,
  getColumnLabel,
  displayCellValue,
)


const getCurrentCellFormatting = () => {
  if (hasSelection()) {
    const { startRow, startCol } = getSelectionBoundaries()
    return getCellFormatting(startRow, startCol)
  } else if (selectedCell.row !== null && selectedCell.col !== null) {
    return getCellFormatting(selectedCell.row, selectedCell.col)
  }
  return null
}


 const applyFormatting = (formatting) => {

  if (hasSelection()) {
    const { startRow, startCol, endRow, endCol } = getSelectionBoundaries();
    applyFormattingToRange(startRow, startCol, endRow, endCol, formatting);
  } else if (selectedCell.row !== null && selectedCell.col !== null) {
    updateCellFormatting(selectedCell.row, selectedCell.col, formatting);
  }
  
  const tempRow = selectedCell.row;
  selectedCell.row = -1;
  setTimeout(() => {
    selectedCell.row = tempRow;
  }, 0);
};


const showToastNotification = () => {
  const statusEl = document.getElementById('copy-status')
  if (statusEl && typeof bootstrap !== 'undefined') {
    const toast = new bootstrap.Toast(statusEl)
    toast.show()
  }
}


const setupKeyboardHandlers = () => {
  const handleGlobalKeyDown = (event) => {
    if (editing.row !== null && editing.col !== null) return

    if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
      event.preventDefault()
      copySelectedCells()
      return
    }

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

    if (event.ctrlKey && (event.key === 'x' || event.key === 'X')) {
      event.preventDefault()
      cutSelectedCells()
      return
    }

    if (event.ctrlKey) {
      const currentFormat = getCurrentCellFormatting()
      if (!currentFormat) return
      
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault()
        applyFormatting({ bold: !currentFormat.bold })
        return
      }
      
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault()
        applyFormatting({ italic: !currentFormat.italic })
        return
      }
      
      if (event.key === 'u' || event.key === 'U') {
        event.preventDefault()
        applyFormatting({ underline: !currentFormat.underline })
        return
      }
    }

    handleKeyDown(event)
  }

  document.addEventListener('keydown', handleGlobalKeyDown)
}


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
}

onMounted(() => {
  setupKeyboardHandlers()
  resetSpreadsheet()
  
  if (typeof bootstrap !== 'undefined') {
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    dropdownElementList.forEach(dropdownToggleEl => {
      new bootstrap.Dropdown(dropdownToggleEl);
    });
  }
})
</script>

<style scoped>
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
  max-width: 1200px;
  height: calc(100vh - 2rem);
  overflow: hidden;
}

.spreadsheet-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Bootstrap dropdown fix */
.dropdown-menu.show {
  display: block !important;
}

.dropdown {
  position: relative !important;
  z-index: 100;
}

/* Ensure borders are visible */
td.cell {
  border: 1px solid #dee2e6 !important;
}

</style>