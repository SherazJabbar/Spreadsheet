# Vue 3 Spreadsheet Application

A simple yet powerful spreadsheet application built with Vue 3 using the Composition API.

## Features

- Cell editing with formula support
- Cell range selection
- Copy, cut, and paste functionality
- Column resizing
- CSV export and import
- Row and column operations

## Project Setup

```bash
# Install dependencies
npm install

# Serve with hot reload at localhost:8080
npm run serve

# Build for production
npm run build
```

## Using the Spreadsheet

### Basic Usage

- Click on a cell to select it
- Double-click on a cell to edit it
- Press Enter to confirm edits
- Click and drag to select a range of cells
- Click on a row number to select the entire row
- Click on a column letter to select the entire column

### Keyboard Navigation

- Arrow keys: Navigate between cells
- Tab/Shift+Tab: Navigate right/left
- Enter: Edit the current cell or move down after editing
- Esc: Cancel editing

### Formulas

The spreadsheet supports basic formula evaluation. To use formulas:

1. Start with an equals sign (`=`)
2. Reference cells by their address (e.g., `A1`, `B2`)
3. Use standard operators (`+`, `-`, `*`, `/`)

Example: `=A1+B1` will add the values in cells A1 and B1.

### Keyboard Shortcuts

- `Ctrl+C`: Copy selected cells
- `Ctrl+X`: Cut selected cells
- `Ctrl+V`: Paste cells from clipboard

## Project Structure

```
spreadsheet-app/
├── src/
│   ├── assets/
│   │   └── styles.css        # Global styles
│   ├── components/
│   │   └── Spreadsheet/      # Spreadsheet components
│   │       ├── index.vue     # Main spreadsheet component
│   │       ├── SpreadsheetHeader.vue
│   │       └── SpreadsheetTable.vue
│   ├── composables/          # Reusable composable functions
│   │   ├── useClipboard.js
│   │   ├── useColumnResize.js
│   │   ├── useExportImport.js
│   │   ├── useFormulas.js
│   │   ├── useGridData.js
│   │   └── useSelection.js
│   ├── App.vue               # Root component
│   └── main.js               # Application entry point
└── public/
    └── index.html            # HTML template
```
# Spreadsheet
