import { reactive } from 'vue'

export function useColumnResize(colCount) {
  const columnWidths = reactive(Array(colCount.value).fill(100))

  const resizing = reactive({
    active: false,
    columnIndex: null,
    startX: 0,
  })

  const startResize = (event, colIndex) => {
    resizing.active = true
    resizing.columnIndex = colIndex
    resizing.startX = event.clientX

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }

  const handleResize = (event) => {
    if (!resizing.active) return

    const delta = event.clientX - resizing.startX
    const newWidth = Math.max(50, columnWidths[resizing.columnIndex] + delta)

    columnWidths[resizing.columnIndex] = newWidth

    resizing.startX = event.clientX

    const cells = document.querySelectorAll(
      `td:nth-child(${resizing.columnIndex + 2}), th:nth-child(${resizing.columnIndex + 2})`,
    )
    cells.forEach((cell) => {
      cell.style.width = `${newWidth}px`
      cell.style.minWidth = `${newWidth}px`
    })
  }

  const stopResize = () => {
    resizing.active = false

    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
  }

  const addColumnWidth = () => {
    columnWidths.push(100)
  }

  return {
    columnWidths,
    startResize,
    addColumnWidth,
  }
}
