import { reactive } from 'vue'

export function useClipboard(
  gridData,
  rowCount,
  colCount,
  selectedCell,
  getSelectionBoundaries,
  hasSelection,
) {
  const clipboard = reactive({
    data: [],
    hasData: false,
  })

  const copySelectedCells = () => {
    const boundaries = getSelectionBoundaries()
    if (!boundaries) return

    const { startRow, startCol, endRow, endCol } = boundaries

    const data = []
    for (let i = startRow; i <= endRow; i++) {
      const row = []
      for (let j = startCol; j <= endCol; j++) {
        row.push(gridData[i][j])
      }
      data.push(row)
    }

    clipboard.data = data
    clipboard.hasData = true

    const tabDelimited = data.map((row) => row.join('\t')).join('\n')

    try {
      navigator.clipboard.writeText(tabDelimited)
    } catch (e) {
      console.error("Couldn't access clipboard:", e)
      const textarea = document.createElement('textarea')
      textarea.value = tabDelimited
      textarea.style.position = 'fixed'
      textarea.style.opacity = 0
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  const cutSelectedCells = () => {
    copySelectedCells()

    const { startRow, startCol, endRow, endCol } = getSelectionBoundaries()
    for (let i = startRow; i <= endRow; i++) {
      for (let j = startCol; j <= endCol; j++) {
        gridData[i][j] = ''
      }
    }
  }

  const pasteFromClipboard = async () => {
    if (selectedCell.row === null || selectedCell.col === null) return

    let data

    let targetRow, targetCol
    if (hasSelection()) {
      const boundaries = getSelectionBoundaries()
      targetRow = boundaries.startRow
      targetCol = boundaries.startCol
    } else {
      targetRow = selectedCell.row
      targetCol = selectedCell.col
    }

    if (clipboard.hasData) {
      data = clipboard.data
    } else {
      try {
        const text = await navigator.clipboard.readText()
        data = text.split('\n').map((line) => line.split('\t'))
      } catch (e) {
        console.error("Couldn't access clipboard:", e)
        return null
      }
    }

    if (!data || !data.length) return null

    const requiredRows = targetRow + data.length
    const maxColsInData = data.reduce((max, row) => Math.max(max, row.length), 0)
    const requiredCols = targetCol + maxColsInData

    if (requiredRows > rowCount.value) {
      const rowsToAdd = requiredRows - rowCount.value
      for (let i = 0; i < rowsToAdd; i++) {
        const newRow = Array(colCount.value).fill('')
        gridData.push(newRow)
      }
      rowCount.value += rowsToAdd
    }

    if (requiredCols > colCount.value) {
      const colsToAdd = requiredCols - colCount.value
      colCount.value += colsToAdd

      gridData.forEach((row, index) => {
        const newRow = [...row]
        while (newRow.length < colCount.value) {
          newRow.push('')
        }
        gridData[index] = newRow
      })
    }

    for (let i = 0; i < data.length; i++) {
      const row = targetRow + i
      for (let j = 0; j < data[i].length; j++) {
        const col = targetCol + j
        if (row < rowCount.value && col < colCount.value) {
          gridData[row][col] = data[i][j] || ''
        }
      }
    }

    return {
      startRow: targetRow,
      startCol: targetCol,
      endRow: Math.min(targetRow + data.length - 1, rowCount.value - 1),
      endCol: Math.min(targetCol + (data[0] ? data[0].length - 1 : 0), colCount.value - 1),
    }
  }

  return {
    copySelectedCells,
    cutSelectedCells,
    pasteFromClipboard,
  }
}
