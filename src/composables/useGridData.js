import { ref, reactive, computed } from 'vue'

export function useGridData() {
  const rowCount = ref(20)
  const colCount = ref(10)

  const columns = computed(() => Array(colCount.value).fill(null))
  const rows = computed(() => Array(rowCount.value).fill(null))

  const defaultRowHeight = 35
  const defaultColumnWidth = 100

  const rowHeights = reactive(Array(rowCount.value).fill(defaultRowHeight))
  const columnWidths = reactive(Array(colCount.value).fill(defaultColumnWidth))

  const createDefaultCellFormatting = () => ({
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
  })

  const gridData = reactive(
    Array(rowCount.value)
      .fill()
      .map(() => Array(colCount.value).fill('')),
  )

  const cellFormatting = reactive(
    Array(rowCount.value)
      .fill()
      .map(() =>
        Array(colCount.value)
          .fill()
          .map(() => createDefaultCellFormatting()),
      ),
  )

  const getCellFormatting = (row, col) => {
    if (row >= 0 && row < rowCount.value && col >= 0 && col < colCount.value) {
      return cellFormatting[row][col]
    }
    return createDefaultCellFormatting()
  }

  const updateCellFormatting = (row, col, formatting) => {
    if (row >= 0 && row < rowCount.value && col >= 0 && col < colCount.value) {
      if (formatting.decimalPlaces !== undefined) {
        cellFormatting[row][col].decimalPlaces = formatting.decimalPlaces
      }

      if (formatting.numberFormat === 'custom' && formatting.customFormat) {
        cellFormatting[row][col].numberFormat = 'custom'
        cellFormatting[row][col].customFormat = formatting.customFormat
      }

      if (formatting.fontSize && formatting.fontSize !== cellFormatting[row][col].fontSize) {
        adjustRowHeight(row, formatting.fontSize)
      }

      Object.assign(cellFormatting[row][col], formatting)
    }
  }

  const applyFormattingToRange = (startRow, startCol, endRow, endCol, formatting) => {
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)

    const formattingCopy = { ...formatting }

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        updateCellFormatting(i, j, formattingCopy)
      }
    }
  }

  const getRowHeight = (row) => {
    if (row >= 0 && row < rowCount.value) {
      return rowHeights[row]
    }
    return defaultRowHeight
  }

  const setRowHeight = (row, height) => {
    if (row >= 0 && row < rowCount.value) {
      rowHeights[row] = height
    }
  }

  const getColumnWidth = (col) => {
    if (col >= 0 && col < colCount.value) {
      return columnWidths[col]
    }
    return defaultColumnWidth
  }

  const setColumnWidth = (col, width) => {
    if (col >= 0 && col < colCount.value) {
      columnWidths[col] = width
    }
  }

  const adjustRowHeight = (row, fontSize) => {
    const size = parseInt(fontSize)

    const baseHeight = 25
    const padding = 10

    const newHeight = baseHeight + size + padding

    if (newHeight > rowHeights[row]) {
      setRowHeight(row, newHeight)
    }
  }

  const addRow = (insertIndex) => {
    rowCount.value++

    const newRow = Array(colCount.value).fill('')

    gridData.splice(insertIndex, 0, newRow)

    const newFormatting = Array(colCount.value)
      .fill()
      .map(() => createDefaultCellFormatting())

    cellFormatting.splice(insertIndex, 0, newFormatting)

    rowHeights.splice(insertIndex, 0, defaultRowHeight)

    while (gridData.length > rowCount.value) {
      gridData.pop()
      cellFormatting.pop()
      rowHeights.pop()
    }
  }

  const addColumn = (insertIndex) => {
    colCount.value++

    for (let i = 0; i < rowCount.value; i++) {
      if (!gridData[i]) {
        gridData[i] = Array(colCount.value).fill('')
        cellFormatting[i] = Array(colCount.value)
          .fill()
          .map(() => createDefaultCellFormatting())
      } else {
        gridData[i].splice(insertIndex, 0, '')

        cellFormatting[i].splice(insertIndex, 0, createDefaultCellFormatting())

        while (gridData[i].length < colCount.value) {
          gridData[i].push('')
          cellFormatting[i].push(createDefaultCellFormatting())
        }

        while (gridData[i].length > colCount.value) {
          gridData[i].pop()
          cellFormatting[i].pop()
        }
      }
    }

    columnWidths.splice(insertIndex, 0, defaultColumnWidth)

    while (columnWidths.length > colCount.value) {
      columnWidths.pop()
    }
  }

  const resetSpreadsheet = () => {
    for (let i = 0; i < rowCount.value; i++) {
      for (let j = 0; j < colCount.value; j++) {
        gridData[i][j] = ''
        cellFormatting[i][j] = createDefaultCellFormatting()
      }
    }

    gridData[0][0] = '10'
    gridData[0][1] = '20'
    gridData[0][2] = '=A1+B1'
    gridData[0][3] = '10'

    gridData[1][0] = '5'
    gridData[1][1] = '3'
    gridData[1][2] = '=A2*B2'

    cellFormatting[0][2].italic = true
    cellFormatting[0][2].textColor = '#0000ff'
    cellFormatting[1][2].italic = true
    cellFormatting[1][2].textColor = '#0000ff'

    for (let i = 0; i < rowCount.value; i++) {
      rowHeights[i] = defaultRowHeight
    }

    for (let j = 0; j < colCount.value; j++) {
      columnWidths[j] = defaultColumnWidth
    }
  }

  const increaseDecimals = (row, col) => {
    if (row >= 0 && row < rowCount.value && col >= 0 && col < colCount.value) {
      const currentDecimals = cellFormatting[row][col].decimalPlaces
      cellFormatting[row][col].decimalPlaces = Math.min(10, currentDecimals + 1)
    }
  }

  const decreaseDecimals = (row, col) => {
    if (row >= 0 && row < rowCount.value && col >= 0 && col < colCount.value) {
      const currentDecimals = cellFormatting[row][col].decimalPlaces
      cellFormatting[row][col].decimalPlaces = Math.max(0, currentDecimals - 1)
    }
  }

  return {
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
    increaseDecimals,
    decreaseDecimals,
    addRow,
    addColumn,
    resetSpreadsheet,
  }
}
