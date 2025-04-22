<template>
  <div class="table-container">
    <table class="spreadsheet-table">
      <thead>
        <tr>
          <th class="cell corner-cell"></th>
          <th
            v-for="(_, colIndex) in columns"
            :key="'col-' + colIndex"
            class="cell column-header"
            @click="selectEntireColumn(colIndex)"
            :style="{ width: getColumnWidth(colIndex) + 'px' }"
          >
            {{ getColumnLabel(colIndex) }}
            <div class="resize-handle" @mousedown="startResize($event, colIndex)"></div>
          </th>
          <th class="spacer-column"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(_, rowIndex) in rows" :key="'row-' + rowIndex">
          <th class="cell row-header" scope="row" @click="selectEntireRow(rowIndex)">
            {{ rowIndex + 1 }}
          </th>
          <td
            v-for="(_, colIndex) in columns"
            :key="'cell-' + rowIndex + '-' + colIndex"
            class="cell"
            :style="getCellStyles(rowIndex, colIndex)"
            :class="{
              'selected-cell': isSelectedCell(rowIndex, colIndex),
              'selected-range':
                isInSelectedRange(rowIndex, colIndex) && !isSelectedCell(rowIndex, colIndex),
            }"
            @click="selectCell(rowIndex, colIndex, $event)"
            @dblclick="editCell(rowIndex, colIndex)"
            @mousedown="startRangeSelection(rowIndex, colIndex, $event)"
            @mouseover="updateRangeSelection(rowIndex, colIndex)"
            @mouseup="endRangeSelection()"
          >
            <!-- Background layer for formatting -->
            <div 
              class="cell-background" 
              :style="{ backgroundColor: getCellFormatting(rowIndex, colIndex).backgroundColor || 'transparent' }"
            ></div>
            
            <!-- Selection highlight layer -->
            <div class="selection-highlight"></div>
            
            <!-- Cell content -->
            <div
              v-if="!(editing.row === rowIndex && editing.col === colIndex)"
              class="cell-content"
              :style="getCellContentStyles(rowIndex, colIndex)"
            >
              <span>{{ formatDisplayValue(rowIndex, colIndex) }}</span>
            </div>
            
            <!-- Editor -->
            <input
              v-if="editing.row === rowIndex && editing.col === colIndex"
              type="text"
              class="cell-editor"
              :value="editValue"
              @input="$emit('update:edit-value', $event.target.value)"
              @keydown="handleEditorKeyDown"
              @blur="finishEditing"
              ref="cellEditor"
            />
          </td>
          <!-- Add an empty spacer cell for better horizontal scrolling -->
          <td class="spacer-column"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>

const props = defineProps({
  columns: {
    type: Object,
    required: true,
  },
  rows: {
    type: Object,
    required: true,
  },
  displayCellValue: {
    type: Function,
    required: true,
  },
  isSelectedCell: {
    type: Function,
    required: true,
  },
  isInSelectedRange: {
    type: Function,
    required: true,
  },
  getColumnLabel: {
    type: Function,
    required: true,
  },
  selectCell: {
    type: Function,
    required: true,
  },
  selectEntireRow: {
    type: Function,
    required: true,
  },
  selectEntireColumn: {
    type: Function,
    required: true,
  },
  editCell: {
    type: Function,
    required: true,
  },
  handleEditorKeyDown: {
    type: Function,
    required: true,
  },
  finishEditing: {
    type: Function,
    required: true,
  },
  startRangeSelection: {
    type: Function,
    required: true,
  },
  updateRangeSelection: {
    type: Function,
    required: true,
  },
  endRangeSelection: {
    type: Function,
    required: true,
  },
  startResize: {
    type: Function,
    required: true,
  },
  editing: {
    type: Object,
    required: true,
  },
  editValue: {
    required: true,
  },
  getCellFormatting: {
    type: Function,
    required: true,
  },
  getRowHeight: {
    type: Function,
    required: true,
    default: () => 35,
  },
  getColumnWidth: {
    type: Function,
    required: true,
    default: () => 100,
  },
})

const getCellStyles = (rowIndex, colIndex) => {
  const formatting = props.getCellFormatting(rowIndex, colIndex)
  const height = props.getRowHeight(rowIndex)
  const width = props.getColumnWidth(colIndex)

  return {
    width: width + 'px',
    height: height + 'px',
    minHeight: height + 'px', 
    maxHeight: height + 'px', 
    // backgroundColor removed from here
    borderTop: formatting.borderTop  || '1px solid #dee2e6',
    borderRight: formatting.borderRight || '1px solid #dee2e6',
    borderBottom: formatting.borderBottom || '1px solid #dee2e6',
    borderLeft: formatting.borderLeft || '1px solid #dee2e6',
    overflow: formatting.wrapText ? 'auto' : 'hidden',
    whiteSpace: formatting.wrapText ? 'normal' : 'nowrap',
    verticalAlign: formatting.verticalAlign || 'middle',
    position: 'relative',
    padding: 0,
  }
}

const getCellContentStyles = (rowIndex, colIndex) => {
  const formatting = props.getCellFormatting(rowIndex, colIndex)

  return {
    fontWeight: formatting.bold ? 'bold' : 'normal',
    fontStyle: formatting.italic ? 'italic' : 'normal',
    textDecoration: formatting.underline ? 'underline' : 'none',
    color: formatting.textColor || '#000000',
    fontSize: formatting.fontSize || '14px',
    fontFamily: formatting.fontFamily || 'Arial, sans-serif',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems:
      formatting.verticalAlign === 'top'
        ? 'flex-start'
        : formatting.verticalAlign === 'bottom'
          ? 'flex-end'
          : 'center',
    justifyContent:
      formatting.align === 'left'
        ? 'flex-start'
        : formatting.align === 'right'
          ? 'flex-end'
          : 'center',
    textAlign: formatting.align || 'center',
    padding: '0 4px',
    boxSizing: 'border-box',
    transform: `rotate(${formatting.textRotation || 0}deg)`,
    transformOrigin: 'center center',
    whiteSpace: formatting.wrapText ? 'normal' : 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
}

const formatDisplayValue = (rowIndex, colIndex) => {
  const rawValue = props.displayCellValue(rowIndex, colIndex)
  const formatting = props.getCellFormatting(rowIndex, colIndex)

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return ''
  }

  const numericValue = Number(rawValue)
  if (isNaN(numericValue)) {
    return rawValue 
  }

  const decimalPlaces = formatting.decimalPlaces !== undefined ? formatting.decimalPlaces : 2

  try {
    switch (formatting.numberFormat) {
      case 'auto':
    
        if (formatting.decimalPlaces !== undefined && formatting.decimalPlaces !== 2) {
          return numericValue.toFixed(decimalPlaces)
        }
        return rawValue
        
      case 'plaintext':
        return rawValue.toString()

      case 'number':
        return formatNumber(
          numericValue,
          decimalPlaces,
          formatting.useThousandsSeparator,
        )

      case 'percent':
        return formatPercent(numericValue, decimalPlaces)

      case 'scientific':
        return numericValue.toExponential(decimalPlaces)

      case 'accounting':
        return formatAccounting(numericValue, decimalPlaces, formatting.currencySymbol)

      case 'financial':
        return formatFinancial(numericValue, decimalPlaces)

      case 'currency':
        return formatCurrency(numericValue, decimalPlaces, formatting.currencySymbol)

      case 'custom':
        if (formatting.customFormat === '.00+') {
          return numericValue.toFixed(decimalPlaces)
        } else if (formatting.customFormat === '+.00') {
          return (numericValue >= 0 ? '+' : '') + numericValue.toFixed(decimalPlaces)
        }
        return numericValue.toFixed(decimalPlaces)

      default:
        return rawValue // Default to raw value instead of fixed decimal places
    }
  } catch (error) {
    console.error('Error formatting cell value:', error)
    return rawValue
  }
}

const formatNumber = (value, decimalPlaces = 2, useThousandsSeparator = true) => {
  if (useThousandsSeparator) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
  } else {
    return value.toFixed(decimalPlaces)
  }
}

const formatPercent = (value, decimalPlaces = 2) => {
  return (value * 100).toFixed(decimalPlaces) + '%'
}

const formatAccounting = (value, decimalPlaces = 2, currencySymbol = '$') => {
  if (value < 0) {
    return `(${currencySymbol} ${Math.abs(value).toFixed(decimalPlaces)})`
  }
  return `${currencySymbol} ${value.toFixed(decimalPlaces)}`
}

const formatFinancial = (value, decimalPlaces = 2) => {
  if (value < 0) {
    return `(${Math.abs(value).toFixed(decimalPlaces)})`
  }
  return value.toFixed(decimalPlaces)
}

const formatCurrency = (value, decimalPlaces = 2, currencySymbol = '$') => {
  if (value < 0) {
    return `-${currencySymbol}${Math.abs(value).toFixed(decimalPlaces)}`
  }
  return `${currencySymbol}${value.toFixed(decimalPlaces)}`
}



defineEmits(['update:edit-value'])
</script>

<style scoped>
.table-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.spreadsheet-table {
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 100%;
  border: 1px solid #dee2e6;
  background-color: white;
}

.cell {
  border: 1px solid #dee2e6;
  vertical-align: middle;
  padding: 0;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: transparent; 
}

.cell-background {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.selection-highlight {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.selected-cell .selection-highlight {
  background-color: rgba(13, 110, 253, 0.1) !important;
}

.selected-range .selection-highlight {
  background-color: rgba(13, 110, 253, 0.05) !important;
}

.cell-content {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 2;
  pointer-events: none; 
}

.corner-cell {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  width: 50px;
  min-width: 50px;
  background-color: #f8f9fa !important;
}

.row-header {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 50px;
  min-width: 50px;
  background-color: #f8f9fa !important;
  font-weight: normal;
  color: #6c757d;
  user-select: none;
  cursor: pointer;
  text-align: center;
}

.column-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f8f9fa !important;
  font-weight: normal;
  color: #6c757d;
  user-select: none;
  cursor: pointer;
  text-align: center;
}

.selected-cell {
  z-index: 1;
}

.cell-editor {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding: 0 4px;
  border: 2px solid #0d6efd;
  box-sizing: border-box;
  outline: none;
  z-index: 10; 
  text-align: center;
  background-color: white;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
}

.resize-handle:hover {
  background-color: #0d6efd;
}

.spacer-column {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  border-right: none;
  border-left: none;
}
</style>