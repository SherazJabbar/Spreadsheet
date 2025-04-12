import { ref, reactive, computed } from 'vue'

export function useGridData() {
  const rowCount = ref(20)
  const colCount = ref(10)

  const columns = computed(() => Array(colCount.value).fill(null))
  const rows = computed(() => Array(rowCount.value).fill(null))

  // Initialize grid data with empty cells
  const gridData = reactive(
    Array(rowCount.value)
      .fill()
      .map(() => Array(colCount.value).fill('')),
  )

  // Function to add a new row
  const addRow = (insertIndex) => {
    rowCount.value++

    const newRow = Array(colCount.value).fill('')
    gridData.splice(insertIndex, 0, newRow)

    // Ensure gridData matches rowCount
    while (gridData.length > rowCount.value) {
      gridData.pop()
    }
  }

  // Function to add a new column
  const addColumn = (insertIndex) => {
    colCount.value++

    for (let i = 0; i < rowCount.value; i++) {
      if (!gridData[i]) {
        gridData[i] = Array(colCount.value).fill('')
      } else {
        gridData[i].splice(insertIndex, 0, '')

        // Ensure row length matches colCount
        while (gridData[i].length < colCount.value) {
          gridData[i].push('')
        }
        while (gridData[i].length > colCount.value) {
          gridData[i].pop()
        }
      }
    }
  }

  // Function to reset spreadsheet with example data
  const resetSpreadsheet = () => {
    for (let i = 0; i < rowCount.value; i++) {
      for (let j = 0; j < colCount.value; j++) {
        gridData[i][j] = ''
      }
    }

    // Add example data
    gridData[0][0] = '10'
    gridData[0][1] = '20'
    gridData[0][2] = '=A1+B1'
    gridData[0][3] = '10'

    gridData[1][0] = '5'
    gridData[1][1] = '3'
    gridData[1][2] = '=A2*B2'
  }

  return {
    rowCount,
    colCount,
    columns,
    rows,
    gridData,
    addRow,
    addColumn,
    resetSpreadsheet,
  }
}
