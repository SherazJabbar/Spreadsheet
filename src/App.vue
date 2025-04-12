<template>
  <div class="app-container">
    <Spreadsheet />
  </div>
</template>

<script setup>
import Spreadsheet from './views/Spreadsheet.vue'
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  width: 100%;
  height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Override Bootstrap defaults for better table appearance */
.table {
  margin-bottom: 0;
}

.table td,
.table th {
  padding: 0.25rem;
  vertical-align: middle;
}

.form-control:focus {
  box-shadow: none;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
