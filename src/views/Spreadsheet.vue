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
        @toggle-json-panel="toggleJsonPanel"
        :current-formatting="getCurrentCellFormatting()"
      />

      <div class="spreadsheet-container" @contextmenu.prevent="showContextMenu">
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
          @contextmenu.prevent="onCellContextMenu"
        />
      </div>
    </div>

    <ContextMenu
      :is-visible="contextMenuVisible"
      :position="contextMenuPosition"
      @command="handleContextMenuCommand"
      @close="closeContextMenu"
    />

    <ConditionalFormattingPanel
      :is-open="conditionalFormattingUI.isOpen"
      :selected-range="conditionalFormattingUI.selectedRange"
      :editing-rule-id="conditionalFormattingUI.editingRule"
      :rule-types="ruleTypes"
      :format-colors="formatColors"
      :conditional-rules="conditionalRules"
      :selected-rule-type="conditionalFormattingUI.selectedRuleType"
      :criterion1="conditionalFormattingUI.criterion1"
      :criterion2="conditionalFormattingUI.criterion2"
      :selected-format="conditionalFormattingUI.selectedFormat"
      :get-column-label="getColumnLabel"
      @close="closeConditionalFormatting"
      @add-rule="addConditionalRule"
      @update-rule="updateConditionalRule"
      @delete-rule="deleteConditionalRule"
      @edit-rule="editConditionalRule"
      @change-rule-type="onChangeRuleType"
      @update-criterion1="onUpdateCriterion1"
      @update-criterion2="onUpdateCriterion2"
      @update-format="onUpdateFormat"
    />

    <JsonDataPanel
      :is-visible="jsonPanelVisible"
      :current-json="jsonData"
      :error="jsonError"
      @close="closeJsonPanel"
      @update-json="updateJsonData"
      @json-error="onJsonError"
    />

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

<script>
import { onMounted, ref } from 'vue'
import SpreadsheetHeader from '@/components/SpreadsheetHeader.vue'
import SpreadsheetTable from '@/components/SpreadsheetTable.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import ConditionalFormattingPanel from '@/components/ConditionalFormattingPanel.vue'
import JsonDataPanel from '@/components/DataPanel.vue'

import { useGridData } from '@/composables/useGridData'
import { useSelection } from '@/composables/useSelection'
import { useClipboard } from '@/composables/useClipboard'
import { useExportImport } from '@/composables/useImportExport'
import { useConditionalFormatting } from '@/composables/useConditionalFormatting'
import { useJsonData } from '@/composables/useJsonData'
import { evaluateFormulaValue } from '@/utils/formulaParser'

export default {
  name: 'Spreadsheet',
  components: {
    SpreadsheetHeader,
    SpreadsheetTable,
    ContextMenu,
    ConditionalFormattingPanel,
    JsonDataPanel,
  },
  setup() {
    const {
      rowCount,
      colCount,
      columns,
      rows,
      gridData,
      getCellFormatting,
      updateCellFormatting,
      applyFormattingToRange,
      getRowHeight,
      getColumnWidth,
      setColumnWidth,
      addRow,
      addColumn,
      resetSpreadsheet,
    } = useGridData()

    const {
      jsonData,
      jsonError,
      jsonPanelVisible,
      parseJsonData,
      toggleJsonPanel,
      getValueFromPath,
    } = useJsonData()

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

    const getColumnLabel = (col) => {
      let result = ''
      while (col >= 0) {
        result = String.fromCharCode(65 + (col % 26)) + result
        col = Math.floor(col / 26) - 1
      }
      return result
    }

    const displayCellValue = (row, col) => {
      if (row < 0 || row >= rowCount.value || col < 0 || col >= colCount.value) {
        return ''
      }

      const value = gridData[row][col]

      if (typeof value === 'string' && value.startsWith('=')) {
        return evaluateFormulaValue(value, gridData, rowCount.value, colCount.value)
      }

      return value
    }

    const clipboardUtils = useClipboard(
      gridData,
      rowCount,
      colCount,
      selectedCell,
      getSelectionBoundaries,
      hasSelection,
    )

    const { exportCSV, importCSV } = useExportImport(
      rowCount,
      colCount,
      gridData,
      getColumnLabel,
      displayCellValue,
    )

    const {
      conditionalRules,
      ruleTypes,
      formatColors,
      conditionalFormattingUI,
      openConditionalFormatting,
      closeConditionalFormatting,
      addConditionalRule,
      editConditionalRule,
      updateConditionalRule,
      deleteConditionalRule,
      applyConditionalFormattingToGrid,
    } = useConditionalFormatting(
      rowCount,
      colCount,
      gridData,
      getCellFormatting,
      updateCellFormatting,
      displayCellValue,
    )

    const contextMenuVisible = ref(false)
    const contextMenuPosition = ref({ x: 0, y: 0 })

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
        const { startRow, startCol, endRow, endCol } = getSelectionBoundaries()
        applyFormattingToRange(startRow, startCol, endRow, endCol, formatting)
      } else if (selectedCell.row !== null && selectedCell.col !== null) {
        updateCellFormatting(selectedCell.row, selectedCell.col, formatting)
      }

      const tempRow = selectedCell.row
      selectedCell.row = -1
      setTimeout(() => {
        selectedCell.row = tempRow
      }, 0)
    }

    const showToastNotification = () => {
      const statusEl = document.getElementById('copy-status')
      if (statusEl && typeof bootstrap !== 'undefined') {
        const toast = new bootstrap.Toast(statusEl)
        toast.show()
      }
    }

    const closeJsonPanel = () => {
      jsonPanelVisible.value = false
    }

    const updateJsonData = (newJsonData) => {
      jsonData.value = newJsonData
      const tempRow = selectedCell.row
      selectedCell.row = -1
      setTimeout(() => {
        selectedCell.row = tempRow
        applyConditionalFormattingToGrid()
      }, 0)
    }

    const onJsonError = (error) => {
      jsonError.value = error
    }

   
    const showContextMenu = (event) => {
      if (event.target.closest('.spreadsheet-table')) {
        contextMenuPosition.value = { x: event.clientX, y: event.clientY }
        contextMenuVisible.value = true
        event.preventDefault()
      }
    }


    const onCellContextMenu = (event) => {
      const cellEl = event.target.closest('td.cell')
      if (cellEl) {
        const row = parseInt(cellEl.dataset.row)
        const col = parseInt(cellEl.dataset.col)

        if (!isNaN(row) && !isNaN(col)) {
          if (!isSelectedCell(row, col) && !isInSelectedRange(row, col)) {
            selectCell(row, col, { shiftKey: false })
          }
        }
      }

      showContextMenu(event)
    }

  
    const closeContextMenu = () => {
      contextMenuVisible.value = false
    }

    const handleContextMenuCommand = (command) => {
      switch (command) {
        case 'copy':
          copySelectedCells()
          break

        case 'cut':
          cutSelectedCells()
          break

        case 'paste':
          pasteFromClipboard()
          break

        case 'insert-row-above':
          if (selectedCell.row !== null) {
            addRow(selectedCell.row)
          }
          break

        case 'insert-row-below':
          if (selectedCell.row !== null) {
            addRow(selectedCell.row + 1)
          }
          break

        case 'insert-column-left':
          if (selectedCell.col !== null) {
            addColumn(selectedCell.col)
          }
          break

        case 'insert-column-right':
          if (selectedCell.col !== null) {
            addColumn(selectedCell.col + 1)
          }
          break

        case 'clear-contents':
          if (hasSelection()) {
            const { startRow, startCol, endRow, endCol } = getSelectionBoundaries()
            for (let row = startRow; row <= endRow; row++) {
              for (let col = startCol; col <= endCol; col++) {
                gridData[row][col] = ''
              }
            }
          } else if (selectedCell.row !== null && selectedCell.col !== null) {
            gridData[selectedCell.row][selectedCell.col] = ''
          }
          break

        case 'clear-formatting':
          if (hasSelection()) {
            const { startRow, startCol, endRow, endCol } = getSelectionBoundaries()
            for (let row = startRow; row <= endRow; row++) {
              for (let col = startCol; col <= endCol; col++) {
                updateCellFormatting(row, col, {
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
                  wrapText: false,
                })
              }
            }
          } else if (selectedCell.row !== null && selectedCell.col !== null) {
            updateCellFormatting(selectedCell.row, selectedCell.col, {
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
              wrapText: false,
            })
          }
          break

        case 'conditional-formatting':
          if (hasSelection()) {
            openConditionalFormatting(getSelectionBoundaries())
          } else if (selectedCell.row !== null && selectedCell.col !== null) {
            openConditionalFormatting({
              startRow: selectedCell.row,
              startCol: selectedCell.col,
              endRow: selectedCell.row,
              endCol: selectedCell.col,
            })
          }
          break
      }
    }

    const onChangeRuleType = (ruleType) => {
      conditionalFormattingUI.selectedRuleType = ruleType
    }

    const onUpdateCriterion1 = (value) => {
      conditionalFormattingUI.criterion1 = value
    }

    const onUpdateCriterion2 = (value) => {
      conditionalFormattingUI.criterion2 = value
    }

    const onUpdateFormat = (format) => {
      conditionalFormattingUI.selectedFormat = format
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

        if (event.key === 'Escape') {
          if (contextMenuVisible.value) {
            closeContextMenu()
            event.preventDefault()
            return
          }

          if (conditionalFormattingUI.isOpen) {
            closeConditionalFormatting()
            event.preventDefault()
            return
          }

          if (jsonPanelVisible.value) {
            closeJsonPanel()
            event.preventDefault()
            return
          }
        }

        handleKeyDown(event)
      }

      document.addEventListener('keydown', handleGlobalKeyDown)

      document.addEventListener('click', (event) => {
        if (contextMenuVisible.value) {
          closeContextMenu()
        }
      })
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
      applyConditionalFormattingToGrid()
    })

    return {
      rowCount,
      colCount,
      columns,
      rows,
      gridData,

      getCellFormatting,
      updateCellFormatting,
      applyFormatting,
      getCurrentCellFormatting,
      getRowHeight,
      getColumnWidth,

      selectedCell,
      editing,
      editValue,
      isSelectedCell,
      isInSelectedRange,
      selectCell,
      selectEntireRow,
      selectEntireColumn,
      hasSelection,
      getSelectionBoundaries,
      editCell,
      handleEditorKeyDown,
      finishEditing,

      startRangeSelection,
      updateRangeSelection,
      endRangeSelection,

      startResize,

      displayCellValue,
      getColumnLabel,

      exportCSV,
      importCSV,
      resetSpreadsheet,
      addRowAtSelection,
      addColumnAtSelection,

      contextMenuVisible,
      contextMenuPosition,
      showContextMenu,
      closeContextMenu,
      handleContextMenuCommand,
      onCellContextMenu,

      copySelectedCells,
      cutSelectedCells,
      pasteFromClipboard,

      conditionalFormattingUI,
      conditionalRules,
      ruleTypes,
      formatColors,
      openConditionalFormatting,
      closeConditionalFormatting,
      addConditionalRule,
      editConditionalRule,
      updateConditionalRule,
      deleteConditionalRule,
      onChangeRuleType,
      onUpdateCriterion1,
      onUpdateCriterion2,
      onUpdateFormat,

      jsonData,
      jsonError,
      jsonPanelVisible,
      toggleJsonPanel,
      closeJsonPanel,
      updateJsonData,
      onJsonError,
    }
  },
}
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
