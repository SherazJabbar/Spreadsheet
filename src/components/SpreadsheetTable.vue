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
            :style="{ width: columnWidth + 'px' }"
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
            :style="{ width: columnWidth + 'px' }"
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
            <div
              v-if="!(editing.row === rowIndex && editing.col === colIndex)"
              class="cell-content"
            >
              {{ displayCellValue(rowIndex, colIndex) }}
            </div>
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
import { ref } from 'vue'

// Define props with types
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
})

const columnWidth = ref(100)

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
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  height: 35px;
  min-height: 35px;
  border: 1px solid #dee2e6;
  text-align: center;
  vertical-align: middle;
  padding: 0;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: white;
}

.cell-content {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: transparent;
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
}

.selected-cell {
  background-color: rgba(13, 110, 253, 0.1) !important;
  outline: 2px solid #0d6efd;
  z-index: 1;
}

.selected-range {
  background-color: rgba(13, 110, 253, 0.05) !important;
}

.cell-editor {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
  border: 2px solid #0d6efd;
  box-sizing: border-box;
  outline: none;
  z-index: 4;
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
