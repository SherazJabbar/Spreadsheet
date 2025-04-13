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

  const hasSelection = () => {
    return selectionRange.startRow !== null && selectionRange.endRow !== null
  }

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

  const isSelectedCell = (row, col) => {
    return selectedCell.row === row && selectedCell.col === col
  }

  const isInSelectedRange = (row, col) => {
    if (!selectionRange.startRow && !selectionRange.endRow) return false

    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow)
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow)
    const minCol = Math.min(selectionRange.startCol, selectionRange.endCol)
    const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol)

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
  }

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

  const updateRangeSelection = (row, col) => {
    if (rangeSelectionActive.value) {
      selectionRange.endRow = row
      selectionRange.endCol = col
    }
  }

  const endRangeSelection = () => {
    rangeSelectionActive.value = false
  }

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

  const finishEditing = () => {
    if (editing.row !== null && editing.col !== null) {
      gridData[editing.row][editing.col] = editValue.value
      editing.row = null
      editing.col = null
    }
  }

  const handleKeyDown = (event) => {
    if (editing.row !== null && editing.col !== null) return

    if (event.key === 'Enter' && !event.shiftKey) {
      editCell(selectedCell.row, selectedCell.col)
      return
    }

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
          if (selectedCell.col > 0) {
            selectCell(selectedCell.row, selectedCell.col - 1, { shiftKey: false })
          } else if (selectedCell.row > 0) {
            selectCell(selectedCell.row - 1, colCount.value - 1, { shiftKey: false })
          }
        } else {
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
