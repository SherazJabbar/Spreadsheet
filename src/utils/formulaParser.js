export function colLetterToIndex(colStr) {
  let result = 0
  for (let i = 0; i < colStr.length; i++) {
    result = result * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1)
  }
  return result - 1
}

export function parseCellReference(cellRef) {
  const match = cellRef.match(/([A-Z]+)([0-9]+)/)

  if (!match) {
    throw new Error(`Invalid cell reference: ${cellRef}`)
  }

  const colLetter = match[1]
  const rowNumber = parseInt(match[2], 10)

  return {
    col: colLetterToIndex(colLetter),
    row: rowNumber - 1,
  }
}

export function extractCellReferences(formula) {
  const cellRefPattern = /[A-Z]+[0-9]+/g
  return formula.match(cellRefPattern) || []
}

export function createEvaluationContext(formula, gridData, rowCount, colCount) {
  const cleanFormula = formula.replace(/^=\s*/, '').trim()

  const cellRefs = extractCellReferences(cleanFormula)

  const context = {}

  for (const ref of cellRefs) {
    try {
      const { row, col } = parseCellReference(ref)

      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        let cellValue = gridData[row][col]

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
        context[ref] = ''
      }
    } catch (error) {
      console.error(`Error processing cell reference ${ref}:`, error)
      context[ref] = ''
    }
  }

  let processedFormula = cleanFormula

  const sortedRefs = [...cellRefs].sort((a, b) => b.length - a.length)

  for (const ref of sortedRefs) {
    const value = context[ref]
    const replacement = typeof value === 'string' ? `"${value}"` : value

    const regex = new RegExp(`\\b${ref}\\b`, 'g')
    processedFormula = processedFormula.replace(regex, replacement)
  }

  return {
    context,
    processedFormula,
  }
}

export function evaluateFormula(formula, gridData, rowCount, colCount) {
  try {
    const { context, processedFormula } = createEvaluationContext(
      formula,
      gridData,
      rowCount,
      colCount,
    )

    const comparisonRegex = /^([^<>=!]+?)\s*([<>=!]=?|<>)\s*(.+)$/
    const match = processedFormula.match(comparisonRegex)

    if (match) {
      let leftSide = match[1].trim()
      const operator = match[2].trim()
      let rightSide = match[3].trim()

      let leftValue, rightValue

      try {
        leftValue = new Function(`return ${leftSide}`)()

        rightValue = new Function(`return ${rightSide}`)()

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
            break
        }
      } catch (e) {
        console.error('Error in comparison evaluation:', e)
      }
    }

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

export function evaluateFormulaValue(formula, gridData, rowCount, colCount) {
  try {
    const { processedFormula } = createEvaluationContext(formula, gridData, rowCount, colCount)

    const result = new Function(`
      try {
        return ${processedFormula};
      } catch (e) {
        console.error('Formula evaluation error:', e);
        return '#ERROR!';
      }
    `)()

    return result
  } catch (error) {
    console.error('Formula evaluation failed:', error, formula)
    return '#ERROR!'
  }
}

export function extractJsonPaths(formula) {
  const jsonPathPattern = /\bdata\.[a-zA-Z0-9_.\[\]]+/g
  return formula.match(jsonPathPattern) || []
}

export function evaluateCustomExpression(expression, cellValue) {
  if (cellValue === undefined || cellValue === null || cellValue === '') {
    return false
  }

  try {
    const numericValue = parseFloat(cellValue)
    const isNumeric = !isNaN(numericValue) && cellValue !== ''

    const simpleComparisonRegex = /^\s*(>|<|>=|<=|==|!=)\s*(-?\d+(\.\d+)?)\s*$/
    const simpleMatch = expression.match(simpleComparisonRegex)

    if (simpleMatch && isNumeric) {
      const operator = simpleMatch[1]
      const compareValue = parseFloat(simpleMatch[2])

      switch (operator) {
        case '>':
          return numericValue > compareValue
        case '<':
          return numericValue < compareValue
        case '>=':
          return numericValue >= compareValue
        case '<=':
          return numericValue <= compareValue
        case '==':
          return numericValue === compareValue
        case '!=':
          return numericValue !== compareValue
      }
    }

    const rangeRegex = /^\s*(>|>=)\s*(-?\d+(\.\d+)?)\s*&&\s*(<|<=)\s*(-?\d+(\.\d+)?)\s*$/
    const rangeMatch = expression.match(rangeRegex)

    if (rangeMatch && isNumeric) {
      const lowerOperator = rangeMatch[1]
      const lowerValue = parseFloat(rangeMatch[2])
      const upperOperator = rangeMatch[4]
      const upperValue = parseFloat(rangeMatch[5])

      let lowerCheck =
        lowerOperator === '>' ? numericValue > lowerValue : numericValue >= lowerValue

      let upperCheck =
        upperOperator === '<' ? numericValue < upperValue : numericValue <= upperValue

      return lowerCheck && upperCheck
    }

    const textContainsRegex = /^\s*contains\s*"([^"]*)"\s*$/i
    const textContainsMatch = expression.match(textContainsRegex)

    if (textContainsMatch) {
      const searchText = textContainsMatch[1]
      return String(cellValue).includes(searchText)
    }

    const equalsTextRegex = /^\s*==\s*"([^"]*)"\s*$/
    const equalsTextMatch = expression.match(equalsTextRegex)

    if (equalsTextMatch) {
      const compareText = equalsTextMatch[1]
      return String(cellValue) === compareText
    }

    if (expression.includes('||')) {
      const conditions = expression.split('||').map((cond) => cond.trim())
      return conditions.some((cond) => evaluateCustomExpression(cond, cellValue))
    }

    if (expression.includes('&&')) {
      const conditions = expression.split('&&').map((cond) => cond.trim())
      return conditions.every((cond) => evaluateCustomExpression(cond, cellValue))
    }

    const safeEval = new Function(
      'x',
      `
      try {
        // If expression already contains 'x', use as is, otherwise add 'x' before it
        return Boolean(${expression.includes('x') ? expression : 'x ' + expression});
      } catch (e) {
        console.error('Expression evaluation error:', e);
        return false;
      }
    `,
    )

    return safeEval(isNumeric ? numericValue : cellValue)
  } catch (error) {
    console.error('Error evaluating custom expression:', error)
    return false
  }
}

export function evaluateFormulaWithJson(formula, gridData, rowCount, colCount, getJsonValue) {
  try {
    const cleanFormula = formula.replace(/^=\s*/, '').trim()

    const cellRefs = extractCellReferences(cleanFormula)
    const jsonPaths = extractJsonPaths(cleanFormula)

    const context = {}

    for (const ref of cellRefs) {
      try {
        const { row, col } = parseCellReference(ref)

        if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
          let cellValue = gridData[row][col]

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
          context[ref] = ''
        }
      } catch (error) {
        console.error(`Error processing cell reference ${ref}:`, error)
        context[ref] = ''
      }
    }

    for (const path of jsonPaths) {
      try {
        const actualPath = path.substring(5)
        const value = getJsonValue(actualPath)

        context[path] = value
      } catch (error) {
        console.error(`Error processing JSON path ${path}:`, error)
        context[path] = null
      }
    }

    let processedFormula = cleanFormula

    const sortedRefs = [...cellRefs].sort((a, b) => b.length - a.length)

    for (const ref of sortedRefs) {
      const value = context[ref]
      const replacement = typeof value === 'string' ? `"${value}"` : value

      const regex = new RegExp(`\\b${ref}\\b`, 'g')
      processedFormula = processedFormula.replace(regex, replacement)
    }

    const sortedJsonPaths = [...jsonPaths].sort((a, b) => b.length - a.length)

    for (const path of sortedJsonPaths) {
      const value = context[path]
      const replacement = typeof value === 'string' ? `"${value}"` : value

      const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedPath, 'g')
      processedFormula = processedFormula.replace(
        regex,
        replacement === null ? 'null' : replacement,
      )
    }

    try {
      const result = new Function(`
        try {
          return ${processedFormula};
        } catch (e) {
          console.error('Formula evaluation error:', e);
          return '#ERROR!';
        }
      `)()

      return result
    } catch (error) {
      console.error('Formula evaluation failed:', error, processedFormula)
      return '#ERROR!'
    }
  } catch (error) {
    console.error('Formula processing failed:', error, formula)
    return '#ERROR!'
  }
}
