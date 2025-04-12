import { ref } from 'vue'

export function useFormulas(rowCount, colCount, gridData) {
  // Convert column label (A, B, AA, etc.) to a zero-based index
  const colLabelToIndex = (label) => {
    let index = 0
    for (let i = 0; i < label.length; i++) {
      index = index * 26 + label.charCodeAt(i) - 64
    }
    return index - 1
  }

  // Convert a zero-based index to a column label (A, B, AA, etc.)
  const getColumnLabel = (index) => {
    let label = ''
    index++

    while (index > 0) {
      const remainder = (index - 1) % 26
      label = String.fromCharCode(65 + remainder) + label
      index = Math.floor((index - 1) / 26)
    }

    return label
  }

  // Get cell reference in A1 notation
  const getCellReference = (row, col) => {
    return getColumnLabel(col) + (row + 1)
  }

  // Parse and evaluate a formula
  const parseFormula = (formula, row, col) => {
    try {
      if (!formula.startsWith('=')) return formula

      const expression = formula.substring(1)

      const cellRefRegex = /([A-Z]+)(\d+)/g
      let evaluatableExpr = expression.replace(cellRefRegex, (match, colStr, rowStr) => {
        const refCol = colLabelToIndex(colStr)
        const refRow = parseInt(rowStr) - 1

        if (refRow >= 0 && refRow < rowCount.value && refCol >= 0 && refCol < colCount.value) {
          const cellValue = gridData[refRow][refCol]

          if (refRow === row && refCol === col) {
            throw new Error('Circular reference')
          }

          if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
            return parseFormula(cellValue, refRow, refCol)
          }

          if (cellValue === '' || cellValue === null || cellValue === undefined) {
            return 0
          }

          return isNaN(Number(cellValue)) ? `"${cellValue}"` : Number(cellValue)
        }

        return 0
      })

      try {
        const result = Function(`"use strict"; return (${evaluatableExpr})`)()
        return result
      } catch (error) {
        console.error('Expression evaluation error:', error, evaluatableExpr)
        return 'Try Again!'
      }
    } catch (error) {
      console.error('Formula error:', error)
      return 'Try Again!'
    }
  }

  // Display the value for a cell, evaluating formulas if needed
  const displayCellValue = (row, col) => {
    const value = gridData[row][col]
    if (typeof value === 'string' && value.startsWith('=')) {
      return parseFormula(value, row, col)
    }
    return value
  }

  return {
    getColumnLabel,
    getCellReference,
    colLabelToIndex,
    parseFormula,
    displayCellValue,
  }
}
