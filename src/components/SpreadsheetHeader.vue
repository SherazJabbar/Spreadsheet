<template>
  <div class="spreadsheet-header">
    <h5 class="spreadsheet-title mb-3">Task: Spreadsheet</h5>

    <div class="toolbar mb-3">
      <button class="btn btn-light btn-sm" @click="$emit('export-csv')">
        <i class="bi bi-download"></i> Export CSV
      </button>
      <label class="btn btn-light btn-sm mx-2">
        <i class="bi bi-upload"></i> Import CSV
        <input
          type="file"
          style="display: none"
          @change="$emit('import-csv', $event)"
          accept=".csv"
        />
      </label>
      <button class="btn btn-light btn-sm me-2" @click="$emit('reset')">
        <i class="bi bi-arrow-counterclockwise"></i> Reset
      </button>
      <button class="btn btn-light btn-sm me-2" @click="$emit('add-row')">
        <i class="bi bi-plus"></i> Add Row
      </button>
      <button class="btn btn-light btn-sm" @click="$emit('add-column')">
        <i class="bi bi-plus"></i> Add Column
      </button>
    </div>

    <div class="help-text small text-muted mb-2">
      <div class="mb-1">
        <strong>Formula Tip:</strong> Try entering a formula like =A1+B1 in a cell
      </div>
      <div>
        <strong>Keyboard Shortcuts:</strong>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>C</kbd> Copy</span>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>V</kbd> Paste</span>
        <span class="shortcut"><kbd>Ctrl</kbd> + <kbd>X</kbd> Cut</span>
        <span class="shortcut"><kbd>Enter</kbd> Edit Cell</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['export-csv', 'import-csv', 'reset', 'add-row', 'add-column'])
</script>

<style scoped>
.spreadsheet-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.spreadsheet-title {
  font-weight: 500;
  color: #212529;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
}

.btn-light {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #212529;
}

.btn-light:hover {
  background-color: #e9ecef;
}

.help-text {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.5;
}

kbd {
  display: inline-block;
  padding: 0.1rem 0.25rem;
  font-size: 11px;
  line-height: 1;
  color: #212529;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

.shortcut {
  margin-right: 0.75rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-sm {
    width: 100%;
    margin-right: 0 !important;
    margin-left: 0 !important;
    margin-bottom: 0.25rem;
  }
}
</style>
