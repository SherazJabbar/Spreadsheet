/**
 * Spreadsheet Formula Parser Module
 *
 * A robust, production-ready formula parser for spreadsheet applications
 * Handles cell references, operators, and basic functions
 */

/**
 * Convert column letter to index (0-based)
 * @param {string} colStr The column letter (A, B, AA, etc.)
 * @returns {number} The 0-based column index
 */
export function colLetterToIndex(colStr) {
  let result = 0
  for (let i = 0; i < colStr.length; i++) {
    result = result * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1)
  }
  return result - 1
}

/**
 * Parse a cell reference (e.g., A1) to row and column indices
 * @param {string} cellRef The cell reference (e.g., A1, BC23)
 * @returns {Object} An object with row and col properties (0-based indices)
 */
export function parseCellReference(cellRef) {
  const match = cellRef.match(/([A-Z]+)([0-9]+)/)
  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`)
  }

  const colLetter = match[1]
  const rowNumber = parseInt(match[2], 10)

  return {
    col: colLetterToIndex(colLetter),
    row: rowNumber - 1, // Convert to 0-based index
  }
}

/**
 * Extract all cell references from a formula
 * @param {string} formula The formula to parse
 * @returns {string[]} Array of cell references found in the formula
 */
export function extractCellReferences(formula) {
  // Match cell references like A1, B2, AA12, etc.
  const cellRefPattern = /[A-Z]+[0-9]+/g
  return formula.match(cellRefPattern) || []
}

/**
 * Create a safe evaluation context for a formula
 * @param {string} formula The formula to evaluate
 * @param {Array} gridData The grid data containing cell values
 * @param {number} rowCount The total number of rows
 * @param {number} colCount The total number of columns
 * @returns {Object} An object containing the evaluation context and processed formula
 */
export function createEvaluationContext(formula, gridData, rowCount, colCount) {
  // Remove the leading equals sign and trim whitespace
  const cleanFormula = formula.replace(/^=\s*/, '').trim()

  // Extract all cell references
  const cellRefs = extractCellReferences(cleanFormula)

  // Create evaluation context with cell values
  const context = {}

  // Process each cell reference
  for (const ref of cellRefs) {
    try {
      const { row, col } = parseCellReference(ref)

      // Check if cell is within grid bounds
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        let cellValue = gridData[row][col]

        // Try to convert to number if possible
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          const numValue = parseFloat(cellValue)
          if (!isNaN(numValue)) {
            cellValue = numValue
          }
        } else {
          cellValue = ''
        }

        context[ref] = cellValue
      } else {
        // Out of bounds reference
        context[ref] = ''
      }
    } catch (error) {
      console.error(`Error processing cell reference ${ref}:`, error)
      context[ref] = ''
    }
  }

  // Replace cell references with their values in the formula
  let processedFormula = cleanFormula

  // Sort cell references by length (descending) to prevent partial replacements
  // For example, A11 should be replaced before A1
  const sortedRefs = [...cellRefs].sort((a, b) => b.length - a.length)

  for (const ref of sortedRefs) {
    const value = context[ref]
    const replacement = typeof value === 'string' ? `"${value}"` : value

    // Use regex with word boundaries to ensure we don't replace parts of other references
    const regex = new RegExp(`\\b${ref}\\b`, 'g')
    processedFormula = processedFormula.replace(regex, replacement)
  }

  return {
    context,
    processedFormula,
  }
}

/**
 * Safely evaluate a spreadsheet formula
 * @param {string} formula The formula to evaluate
 * @param {Array} gridData The grid data containing cell values
 * @param {number} rowCount The total number of rows
 * @param {number} colCount The total number of columns
 * @returns {boolean} The result of the formula evaluation as a boolean
 */
export function evaluateFormula(formula, gridData, rowCount, colCount) {
  try {
    // Create evaluation context
    const { context, processedFormula } = createEvaluationContext(
      formula,
      gridData,
      rowCount,
      colCount,
    )

    // Special case handling for common comparison patterns
    const comparisonRegex = /^([^<>=!]+?)\s*([<>=!]=?|<>)\s*(.+)$/
    const match = processedFormula.match(comparisonRegex)

    if (match) {
      // Extract left side, operator, and right side
      let leftSide = match[1].trim()
      const operator = match[2].trim()
      let rightSide = match[3].trim()

      // Evaluate both sides
      let leftValue, rightValue

      try {
        // Evaluate left side
        leftValue = new Function(`return ${leftSide}`)()

        // Evaluate right side
        rightValue = new Function(`return ${rightSide}`)()

        // Compare based on operator
        switch (operator) {
          case '=':
          case '==':
            return leftValue == rightValue
          case '!=':
          case '<>':
            return leftValue != rightValue
          case '>':
            return leftValue > rightValue
          case '>=':
            return leftValue >= rightValue
          case '<':
            return leftValue < rightValue
          case '<=':
            return leftValue <= rightValue
          default:
            // Fallback to general evaluation
            break
        }
      } catch (e) {
        console.error('Error in comparison evaluation:', e)
      }
    }

    // General formula evaluation
    // Add defensive try-catch wrapper for safety
    const safeEval = new Function(`
        try {
          return Boolean(${processedFormula});
        } catch (e) {
          console.error('Formula evaluation error:', e);
          return false;
        }
      `)

    return safeEval()
  } catch (error) {
    console.error('Formula evaluation failed:', error, formula)
    return false
  }
}
