<template>
    <div 
      v-if="isVisible" 
      class="context-menu" 
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="handleCommand('cut')">
        <i class="bi bi-scissors me-2"></i> Cut
      </div>
      <div class="context-menu-item" @click="handleCommand('copy')">
        <i class="bi bi-clipboard me-2"></i> Copy
      </div>
      <div class="context-menu-item" @click="handleCommand('paste')">
        <i class="bi bi-clipboard-plus me-2"></i> Paste
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCommand('insert-row-above')">
        <i class="bi bi-node-plus me-2"></i> Insert row above
      </div>
      <div class="context-menu-item" @click="handleCommand('insert-row-below')">
        <i class="bi bi-node-plus-fill me-2"></i> Insert row below
      </div>
      <div class="context-menu-item" @click="handleCommand('insert-column-left')">
        <i class="bi bi-node-plus me-2"></i> Insert column left
      </div>
      <div class="context-menu-item" @click="handleCommand('insert-column-right')">
        <i class="bi bi-node-plus-fill me-2"></i> Insert column right
      </div>
      <!-- <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCommand('delete-row')">
        <i class="bi bi-trash me-2"></i> Delete row
      </div>
      <div class="context-menu-item" @click="handleCommand('delete-column')">
        <i class="bi bi-trash me-2"></i> Delete column
      </div> -->
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCommand('clear-contents')">
        <i class="bi bi-eraser me-2"></i> Clear contents
      </div>
      <div class="context-menu-item" @click="handleCommand('clear-formatting')">
        <i class="bi bi-file me-2"></i> Clear formatting
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleCommand('conditional-formatting')">
        <i class="bi bi-palette me-2"></i> Conditional formatting
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    isVisible: {
      type: Boolean,
      required: true
    },
    position: {
      type: Object,
      required: true
    }
  });
  
  const emit = defineEmits(['command', 'close']);
  
 
  const handleCommand = (command) => {
    emit('command', command);
    emit('close');
  };
  </script>
  
  <style scoped>
  .context-menu {
    position: absolute;
    min-width: 200px;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 4px 0;
  }
  
  .context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
  }
  
  .context-menu-item:hover {
    background-color: #f8f9fa;
  }
  
  .context-menu-divider {
    height: 1px;
    background-color: #dee2e6;
    margin: 4px 0;
  }
  </style>