export function useExportImport(rowCount, colCount, gridData, getColumnLabel, displayCellValue) {
  // Export grid data to CSV
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

  // Import CSV file
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

        // Process the CSV data here
        // (This part is not fully implemented in the original code)

        event.target.value = ''
      } catch (error) {
        console.error('Error importing CSV:', error)
      }
    }

    reader.readAsText(file)
  }

  return {
    exportCSV,
    importCSV,
  }
}
