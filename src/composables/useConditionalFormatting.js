import { ref, reactive, watch, nextTick } from 'vue'
import { evaluateFormula, evaluateCustomExpression } from '@/utils/formulaParser'

export function useConditionalFormatting(
  rowCount,
  colCount,
  gridData,
  getCellFormatting,
  updateCellFormatting,
  displayCellValue,
) {
  const conditionalRules = ref([])

  const ruleTypes = [
    { id: 'empty', label: 'Is empty' },
    { id: 'not_empty', label: 'Is not empty' },
    { id: 'text_contains', label: 'Text contains' },
    { id: 'text_not_contains', label: 'Text does not contain' },
    { id: 'text_starts_with', label: 'Text starts with' },
    { id: 'text_ends_with', label: 'Text ends with' },
    { id: 'text_exactly', label: 'Text is exactly' },
    { id: 'date_is', label: 'Date is' },
    { id: 'date_before', label: 'Date is before' },
    { id: 'date_after', label: 'Date is after' },
    { id: 'greater_than', label: 'Greater than' },
    { id: 'greater_than_or_equal', label: 'Greater than or equal to' },
    { id: 'less_than', label: 'Less than' },
    { id: 'less_than_or_equal', label: 'Less than or equal to' },
    { id: 'equal_to', label: 'Is equal to' },
    { id: 'not_equal_to', label: 'Is not equal to' },
    { id: 'between', label: 'Is between' },
    { id: 'not_between', label: 'Is not between' },
    { id: 'custom_formula', label: 'Custom formula is' },
    { id: 'custom_expression', label: 'Custom expression' },
  ]

  const formatColors = [
    { name: 'Light Red Fill', backgroundColor: '#f4cccc', textColor: '#000000' },
    { name: 'Light Orange Fill', backgroundColor: '#fce5cd', textColor: '#000000' },
    { name: 'Light Yellow Fill', backgroundColor: '#fff2cc', textColor: '#000000' },
    { name: 'Light Green Fill', backgroundColor: '#d9ead3', textColor: '#000000' },
    { name: 'Light Blue Fill', backgroundColor: '#d0e0e3', textColor: '#000000' },
    { name: 'Light Purple Fill', backgroundColor: '#d9d2e9', textColor: '#000000' },
    { name: 'Dark Red Fill', backgroundColor: '#ea9999', textColor: '#000000' },
    { name: 'Dark Orange Fill', backgroundColor: '#f9cb9c', textColor: '#000000' },
    { name: 'Dark Yellow Fill', backgroundColor: '#ffe599', textColor: '#000000' },
    { name: 'Dark Green Fill', backgroundColor: '#b6d7a8', textColor: '#000000' },
    { name: 'Dark Blue Fill', backgroundColor: '#a2c4c9', textColor: '#000000' },
    { name: 'Dark Purple Fill', backgroundColor: '#b4a7d6', textColor: '#000000' },
  ]

  const conditionalFormattingUI = reactive({
    isOpen: false,
    selectedRange: {
      startRow: null,
      startCol: null,
      endRow: null,
      endCol: null,
    },
    editingRule: null,
    selectedRuleType: 'not_empty',
    criterion1: '',
    criterion2: '',
    selectedFormat: {
      backgroundColor: '#d9ead3',
      textColor: '#000000',
      bold: false,
      italic: false,
      underline: false,
    },
  })

  const cellsWithConditionalFormatting = reactive(new Set())

  const openConditionalFormatting = (range) => {
    conditionalFormattingUI.isOpen = true
    conditionalFormattingUI.selectedRange = { ...range }
    conditionalFormattingUI.editingRule = null
    conditionalFormattingUI.selectedRuleType = 'not_empty'
    conditionalFormattingUI.criterion1 = ''
    conditionalFormattingUI.criterion2 = ''
    conditionalFormattingUI.selectedFormat = {
      backgroundColor: '#d9ead3',
      textColor: '#000000',
      bold: false,
      italic: false,
      underline: false,
    }
  }

  const addConditionalRule = () => {
    const { startRow, startCol, endRow, endCol } = conditionalFormattingUI.selectedRange

    const newRule = {
      id: Date.now(),
      range: {
        startRow,
        startCol,
        endRow,
        endCol,
      },
      type: conditionalFormattingUI.selectedRuleType,
      criterion1: conditionalFormattingUI.criterion1,
      criterion2: conditionalFormattingUI.criterion2,
      format: { ...conditionalFormattingUI.selectedFormat },
    }

    conditionalRules.value.push(newRule)
    conditionalFormattingUI.isOpen = false

    applyConditionalFormattingToGrid()
  }

  const editConditionalRule = (ruleId) => {
    const rule = conditionalRules.value.find((r) => r.id === ruleId)
    if (rule) {
      conditionalFormattingUI.selectedRange = { ...rule.range }
      conditionalFormattingUI.editingRule = rule.id
      conditionalFormattingUI.selectedRuleType = rule.type
      conditionalFormattingUI.criterion1 = rule.criterion1
      conditionalFormattingUI.criterion2 = rule.criterion2
      conditionalFormattingUI.selectedFormat = { ...rule.format }
      conditionalFormattingUI.isOpen = true
    }
  }

  const updateConditionalRule = () => {
    const ruleIndex = conditionalRules.value.findIndex(
      (r) => r.id === conditionalFormattingUI.editingRule,
    )
    if (ruleIndex !== -1) {
      conditionalRules.value[ruleIndex] = {
        id: conditionalFormattingUI.editingRule,
        range: { ...conditionalFormattingUI.selectedRange },
        type: conditionalFormattingUI.selectedRuleType,
        criterion1: conditionalFormattingUI.criterion1,
        criterion2: conditionalFormattingUI.criterion2,
        format: { ...conditionalFormattingUI.selectedFormat },
      }

      conditionalFormattingUI.isOpen = false

      applyConditionalFormattingToGrid()
    }
  }

  const deleteConditionalRule = (ruleId) => {
    const ruleIndex = conditionalRules.value.findIndex((r) => r.id === ruleId)
    if (ruleIndex !== -1) {
      conditionalRules.value.splice(ruleIndex, 1)

      applyConditionalFormattingToGrid()
    }
  }

  const closeConditionalFormatting = () => {
    conditionalFormattingUI.isOpen = false
  }

  const evaluateCondition = (row, col, rule) => {
    const cellValue = displayCellValue ? displayCellValue(row, col) : gridData[row][col]

    if (cellValue === undefined || cellValue === null) {
      if (rule.type === 'empty') return true
      if (rule.type === 'not_empty') return false
      return false
    }

    const value = String(cellValue).trim()
    const numericValue = parseFloat(value)
    const isNumeric = !isNaN(numericValue) && value !== ''

    try {
      switch (rule.type) {
        case 'empty':
          return value === ''

        case 'not_empty':
          return value !== ''

        case 'text_contains':
          return value.includes(rule.criterion1)

        case 'text_not_contains':
          return !value.includes(rule.criterion1)

        case 'text_starts_with':
          return value.startsWith(rule.criterion1)

        case 'text_ends_with':
          return value.endsWith(rule.criterion1)

        case 'text_exactly':
          return value === rule.criterion1

        case 'date_is':
          try {
            const cellDate = new Date(value)
            const criterionDate = new Date(rule.criterion1)
            return cellDate.toDateString() === criterionDate.toDateString()
          } catch (e) {
            return false
          }

        case 'date_before':
          try {
            const cellDate = new Date(value)
            const criterionDate = new Date(rule.criterion1)
            return cellDate < criterionDate
          } catch (e) {
            return false
          }

        case 'date_after':
          try {
            const cellDate = new Date(value)
            const criterionDate = new Date(rule.criterion1)
            return cellDate > criterionDate
          } catch (e) {
            return false
          }

        case 'greater_than':
          return isNumeric && numericValue > parseFloat(rule.criterion1)

        case 'greater_than_or_equal':
          return isNumeric && numericValue >= parseFloat(rule.criterion1)

        case 'less_than':
          return isNumeric && numericValue < parseFloat(rule.criterion1)

        case 'less_than_or_equal':
          return isNumeric && numericValue <= parseFloat(rule.criterion1)

        case 'equal_to':
          return isNumeric && numericValue === parseFloat(rule.criterion1)

        case 'not_equal_to':
          return isNumeric && numericValue !== parseFloat(rule.criterion1)

        case 'between':
          return (
            isNumeric &&
            numericValue >= parseFloat(rule.criterion1) &&
            numericValue <= parseFloat(rule.criterion2)
          )

        case 'not_between':
          return (
            isNumeric &&
            (numericValue < parseFloat(rule.criterion1) ||
              numericValue > parseFloat(rule.criterion2))
          )

        case 'custom_formula':
          return evaluateFormula(rule.criterion1, gridData, rowCount.value, colCount.value)

        case 'custom_expression':
          return evaluateCustomExpression(rule.criterion1, cellValue)

        default:
          return false
      }
    } catch (error) {
      console.error(`Error evaluating condition for cell (${row},${col}):`, error)
      return false
    }
  }

  const applyConditionalFormattingToGrid = () => {
    const formattingChanges = new Map()

    for (const cellKey of cellsWithConditionalFormatting) {
      const [row, col] = cellKey.split('-').map(Number)

      if (row >= rowCount.value || col >= colCount.value) {
        cellsWithConditionalFormatting.delete(cellKey)
        continue
      }

      const currentFormatting = getCellFormatting(row, col)

      const resetFormat = { ...currentFormatting }

      if (resetFormat._conditionalBackground) {
        resetFormat.backgroundColor = 'transparent'
        resetFormat._conditionalBackground = false
      }

      if (resetFormat._conditionalTextColor) {
        resetFormat.textColor = '#000000'
        resetFormat._conditionalTextColor = false
      }

      if (resetFormat._conditionalBold) {
        resetFormat.bold = false
        resetFormat._conditionalBold = false
      }

      if (resetFormat._conditionalItalic) {
        resetFormat.italic = false
        resetFormat._conditionalItalic = false
      }

      if (resetFormat._conditionalUnderline) {
        resetFormat.underline = false
        resetFormat._conditionalUnderline = false
      }

      formattingChanges.set(cellKey, { row, col, formatting: resetFormat })
    }

    cellsWithConditionalFormatting.clear()

    for (const rule of conditionalRules.value) {
      const { startRow, startCol, endRow, endCol } = rule.range

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (row >= rowCount.value || col >= colCount.value) continue

          const cellKey = `${row}-${col}`

          if (evaluateCondition(row, col, rule)) {
            cellsWithConditionalFormatting.add(cellKey)

            let newFormatting

            if (formattingChanges.has(cellKey)) {
              newFormatting = formattingChanges.get(cellKey).formatting
            } else {
              const currentFormatting = getCellFormatting(row, col)
              newFormatting = { ...currentFormatting }
              formattingChanges.set(cellKey, { row, col, formatting: newFormatting })
            }

            if (rule.format.backgroundColor) {
              newFormatting.backgroundColor = rule.format.backgroundColor
              newFormatting._conditionalBackground = true
            }

            if (rule.format.textColor) {
              newFormatting.textColor = rule.format.textColor
              newFormatting._conditionalTextColor = true
            }

            if (rule.format.bold !== undefined) {
              newFormatting.bold = rule.format.bold
              newFormatting._conditionalBold = true
            }

            if (rule.format.italic !== undefined) {
              newFormatting.italic = rule.format.italic
              newFormatting._conditionalItalic = true
            }

            if (rule.format.underline !== undefined) {
              newFormatting.underline = rule.format.underline
              newFormatting._conditionalUnderline = true
            }
          }
        }
      }
    }

    for (const change of formattingChanges.values()) {
      updateCellFormatting(change.row, change.col, change.formatting)
    }
  }

  watch(
    () => [...gridData.map((row) => [...row])],
    () => {
      nextTick(() => {
        applyConditionalFormattingToGrid()
      })
    },
    { deep: true },
  )

  watch(
    conditionalRules,
    () => {
      nextTick(() => {
        applyConditionalFormattingToGrid()
      })
    },
    { deep: true },
  )

  return {
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
  }
}
