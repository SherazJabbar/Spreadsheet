import { ref } from 'vue'

export function useExportImport(rowCount, colCount, gridData, getColumnLabel, displayCellValue) {
  const exportCSV = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14)
    const filename = `spreadsheet_export_${timestamp}.csv`

    const headers = []
    for (let j = 0; j < colCount.value; j++) {
      headers.push(getColumnLabel(j))
    }

    const csvRows = [headers]

    for (let i = 0; i < rowCount.value; i++) {
      const row = []

      for (let j = 0; j < colCount.value; j++) {
        let cellValue = gridData[i][j]
        if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
          cellValue = displayCellValue(i, j)
        }

        if (cellValue === '' || cellValue === null || cellValue === undefined) {
          row.push('')
        } else if (
          typeof cellValue === 'string' &&
          (cellValue.includes(',') || cellValue.includes('"'))
        ) {
          row.push(`"${cellValue.replace(/"/g, '""')}"`)
        } else {
          row.push(cellValue)
        }
      }

      csvRows.push(row)
    }

    let csvContent = ''
    csvRows.forEach((row, rowIndex) => {
      const rowWithNumber = rowIndex === 0 ? [''] : [rowIndex]
      csvContent += [...rowWithNumber, ...row].join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const importCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvData = e.target.result
        const rows = csvData.split(/\r?\n/)

        if (rows.length <= 1) {
          console.error('CSV file appears to be empty or invalid')
          return
        }

        const csvHeader = rows[0].split(',')
        const hasHeaderRow = csvHeader.length > 0 && csvHeader[0] === ''

        const startRow = hasHeaderRow ? 1 : 0

        for (let i = 0; i < rowCount.value; i++) {
          for (let j = 0; j < colCount.value; j++) {
            gridData[i][j] = ''
          }
        }

        const csvRowCount = rows.length - startRow
        const csvColCount =
          Math.max(...rows.slice(startRow).map((row) => row.split(',').length)) - 1

        if (csvRowCount > rowCount.value) {
          const rowsToAdd = csvRowCount - rowCount.value
          for (let i = 0; i < rowsToAdd; i++) {
            const newRow = Array(colCount.value).fill('')
            gridData.push(newRow)
          }
          rowCount.value = csvRowCount
        }

        if (csvColCount > colCount.value) {
          const colsToAdd = csvColCount - colCount.value
          colCount.value = csvColCount

          for (let i = 0; i < rowCount.value; i++) {
            while (gridData[i].length < colCount.value) {
              gridData[i].push('')
            }
          }
        }

        for (let i = startRow; i < rows.length; i++) {
          if (!rows[i].trim()) continue

          const csvRow = rows[i].split(',')
          const gridRowIndex = i - startRow

          for (let j = 1; j < csvRow.length; j++) {
            if (gridRowIndex < rowCount.value && j - 1 < colCount.value) {
              let cellValue = csvRow[j]

              if (cellValue.startsWith('"') && cellValue.endsWith('"')) {
                cellValue = cellValue.substring(1, cellValue.length - 1).replace(/""/g, '"')
              }

              gridData[gridRowIndex][j - 1] = cellValue
            }
          }
        }

        event.target.value = ''

        console.log('CSV import completed successfully')
      } catch (error) {
        console.error('Error importing CSV:', error)
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  return {
    exportCSV,
    importCSV,
  }
}
