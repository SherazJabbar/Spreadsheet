import { ref, reactive, nextTick } from 'vue'

export function useSelection(rowCount, colCount, gridData) {
  const selectedCell = reactive({ row: 0, col: 0 })
  const selectionRange = reactive({
    startRow: null,
    startCol: null,
    endRow: null,
    endCol: null,
  })
  const rangeSelectionActive = ref(false)
  const editing = reactive({ row: null, col: null })
  const editValue = ref('')

  // Check if we have a range selection
  const hasSelection = () => {
    return selectionRange.startRow !== null && selectionRange.endRow !== null
  }

  // Get the boundaries of the selection (handling cases where user selects from bottom-right to top-left)
  const getSelectionBoundaries = () => {
    if (hasSelection()) {
      return {
        startRow: Math.min(selectionRange.startRow, selectionRange.endRow),
        endRow: Math.max(selectionRange.startRow, selectionRange.endRow),
        startCol: Math.min(selectionRange.startCol, selectionRange.endCol),
        endCol: Math.max(selectionRange.startCol, selectionRange.endCol),
      }
    } else {
      return {
        startRow: selectedCell.row,
        endRow: selectedCell.row,
        startCol: selectedCell.col,
        endCol: selectedCell.col,
      }
    }
  }

  // Check if a cell is the currently selected cell
  const isSelectedCell = (row, col) => {
    return selectedCell.row === row && selectedCell.col === col
  }

  // Check if a cell is in the selected range
  const isInSelectedRange = (row, col) => {
    if (!selectionRange.startRow && !selectionRange.endRow) return false

    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow)
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow)
    const minCol = Math.min(selectionRange.startCol, selectionRange.endCol)
    const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol)

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
  }

  // Select a single cell
  const selectCell = (row, col, event) => {
    if (editing.row !== null && editing.col !== null) {
      finishEditing()
    }

    selectedCell.row = row
    selectedCell.col = col

    if (!event.shiftKey) {
      selectionRange.startRow = null
      selectionRange.startCol = null
      selectionRange.endRow = null
      selectionRange.endCol = null
    } else {
      if (selectionRange.startRow === null) {
        selectionRange.startRow = row
        selectionRange.startCol = col
      }
      selectionRange.endRow = row
      selectionRange.endCol = col
    }
  }

  // Select an entire row
  const selectEntireRow = (rowIndex) => {
    if (editing.row !== null && editing.col !== null) {
      finishEditing()
    }

    selectionRange.startRow = rowIndex
    selectionRange.startCol = 0
    selectionRange.endRow = rowIndex
    selectionRange.endCol = colCount.value - 1

    selectedCell.row = rowIndex
    selectedCell.col = 0
  }

  // Select an entire column
  const selectEntireColumn = (colIndex) => {
    if (editing.row !== null && editing.col !== null) {
      finishEditing()
    }

    selectionRange.startRow = 0
    selectionRange.startCol = colIndex
    selectionRange.endRow = rowCount.value - 1
    selectionRange.endCol = colIndex

    selectedCell.row = 0
    selectedCell.col = colIndex
  }

  // Start range selection (for mouse drag)
  const startRangeSelection = (row, col, event) => {
    if (event.button !== 0) return

    selectionRange.startRow = row
    selectionRange.startCol = col
    selectionRange.endRow = row
    selectionRange.endCol = col

    selectedCell.row = row
    selectedCell.col = col

    rangeSelectionActive.value = true
  }

  // Update range selection when dragging
  const updateRangeSelection = (row, col) => {
    if (rangeSelectionActive.value) {
      selectionRange.endRow = row
      selectionRange.endCol = col
    }
  }

  // End range selection
  const endRangeSelection = () => {
    rangeSelectionActive.value = false
  }

  // Start editing a cell
  const editCell = (row, col) => {
    editing.row = row
    editing.col = col
    editValue.value = gridData[row][col]

    nextTick(() => {
      if (document.activeElement.tagName.toLowerCase() !== 'input') {
        const cellEditor = document.querySelector('.cell-editor')
        if (cellEditor) {
          cellEditor.focus()
          cellEditor.select()
        }
      }
    })
  }

  // Handle key events in the editor
  const handleEditorKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      finishEditing()

      if (selectedCell.row < rowCount.value - 1) {
        selectCell(selectedCell.row + 1, selectedCell.col, { shiftKey: false })
      }
    } else if (event.key === 'Tab') {
      event.preventDefault()
      finishEditing()

      if (selectedCell.col < colCount.value - 1) {
        selectCell(selectedCell.row, selectedCell.col + 1, { shiftKey: false })
      } else if (selectedCell.row < rowCount.value - 1) {
        selectCell(selectedCell.row + 1, 0, { shiftKey: false })
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      editing.row = null
      editing.col = null
    }
  }

  // Finish editing a cell
  const finishEditing = () => {
    if (editing.row !== null && editing.col !== null) {
      gridData[editing.row][editing.col] = editValue.value
      editing.row = null
      editing.col = null
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    // Ignore if we're currently editing
    if (editing.row !== null && editing.col !== null) return

    // Edit on Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      editCell(selectedCell.row, selectedCell.col)
      return
    }

    // Navigation keys
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (selectedCell.row > 0) {
          selectCell(selectedCell.row - 1, selectedCell.col, event)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (selectedCell.row < rowCount.value - 1) {
          selectCell(selectedCell.row + 1, selectedCell.col, event)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (selectedCell.col > 0) {
          selectCell(selectedCell.row, selectedCell.col - 1, event)
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (selectedCell.col < colCount.value - 1) {
          selectCell(selectedCell.row, selectedCell.col + 1, event)
        }
        break
      case 'Tab':
        event.preventDefault()
        if (event.shiftKey) {
          // Move left
          if (selectedCell.col > 0) {
            selectCell(selectedCell.row, selectedCell.col - 1, { shiftKey: false })
          } else if (selectedCell.row > 0) {
            selectCell(selectedCell.row - 1, colCount.value - 1, { shiftKey: false })
          }
        } else {
          // Move right
          if (selectedCell.col < colCount.value - 1) {
            selectCell(selectedCell.row, selectedCell.col + 1, { shiftKey: false })
          } else if (selectedCell.row < rowCount.value - 1) {
            selectCell(selectedCell.row + 1, 0, { shiftKey: false })
          }
        }
        break
    }
  }

  return {
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
  }
}
