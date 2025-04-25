<template>
    <div class="json-data-panel" v-if="isVisible">
      <div class="panel-header">
        <h5 class="panel-title">JSON Data</h5>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>
      
      <div class="panel-body">
        <div class="form-group mb-3">
          <label class="form-label">Paste your JSON data below</label>
          <textarea 
            class="form-control json-textarea" 
            v-model="jsonText"
            placeholder="Paste JSON data here..."
            @input="validateJson"
          ></textarea>
          
          <div v-if="jsonError" class="alert alert-danger mt-2">
            {{ jsonError }}
          </div>
          <div v-else-if="jsonText && !jsonError" class="alert alert-success mt-2">
            Valid JSON ✓
          </div>
          
          <div class="text-muted small mt-2">
            <p>This JSON data will be accessible in formulas using dot notation:</p>
            <code>=data.customers[0].name</code>
          </div>
        </div>
        
        <div class="panel-actions">
          <button class="btn btn-primary" @click="applyJson" :disabled="!!jsonError">
            Apply JSON Data
          </button>
        </div>
        
        <div class="json-preview mt-4" v-if="hasJsonData">
          <h6>Current JSON Data Preview:</h6>
          <div class="json-tree">
            <pre>{{ jsonPreview }}</pre>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  
  const props = defineProps({
    isVisible: {
      type: Boolean,
      required: true
    },
    currentJson: {
      type: Object,
      default: () => ({})
    },
    error: {
      type: String,
      default: null
    }
  });
  
  const emit = defineEmits(['close', 'update-json', 'json-error']);
  
  const jsonText = ref('');
  const jsonError = ref(null);
  
  const jsonPreview = computed(() => {
    try {
      return JSON.stringify(props.currentJson, null, 2);
    } catch (e) {
      return '{}';
    }
  });
  
  const hasJsonData = computed(() => {
    return Object.keys(props.currentJson).length > 0;
  });
  
  watch(() => props.isVisible, (visible) => {
    if (visible && props.currentJson) {
      try {
        jsonText.value = JSON.stringify(props.currentJson, null, 2);
        jsonError.value = null;
      } catch (e) {
        jsonText.value = '';
      }
    }
  }, { immediate: true });
  
  watch(() => props.error, (newError) => {
    jsonError.value = newError;
  });
  
  const validateJson = () => {
    if (!jsonText.value.trim()) {
      jsonError.value = null;
      return;
    }
    
    try {
      JSON.parse(jsonText.value);
      jsonError.value = null;
    } catch (error) {
      jsonError.value = `Invalid JSON: ${error.message}`;
      emit('json-error', jsonError.value);
    }
  };
  
  const applyJson = () => {
    if (jsonError.value) return;
    
    try {
      const parsedJson = JSON.parse(jsonText.value);
      emit('update-json', parsedJson);
      emit('close');
    } catch (error) {
      jsonError.value = `Failed to apply JSON: ${error.message}`;
      emit('json-error', jsonError.value);
    }
  };
  </script>
  
  <style scoped>
  .json-data-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background-color: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1050;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .panel-header {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .panel-title {
    margin: 0;
    font-weight: 500;
  }
  
  .panel-body {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
  }
  
  .json-textarea {
    height: 200px;
    font-family: monospace;
    font-size: 14px;
  }
  
  .panel-actions {
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: flex-end;
  }
  
  .json-tree {
    background-color: #f8f9fa;
    border-radius: 4px;
    padding: 1rem;
    overflow: auto;
    max-height: 300px;
  }
  
  .json-tree pre {
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
  }
  </style>