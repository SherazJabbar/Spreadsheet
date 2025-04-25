<template>
  <div class="conditional-format-panel" v-if="isOpen">
    <div class="panel-header">
      <h5 class="panel-title">Conditional format rules</h5>
      <button class="btn-close" @click="onClose"></button>
    </div>

    <div class="panel-body">
      <div class="form-group mb-3">
        <label class="form-label">Apply to range</label>
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            :value="formatRangeText"
            readonly
            @click="onRangeInputClick"
          />
          <button class="btn btn-outline-secondary" @click="onRangeInputClick">
            <i class="bi bi-grid-3x3"></i>
          </button>
        </div>
      </div>

      <div class="format-rules mb-3">
        <label class="form-label">Format rules</label>

        <div class="mb-3">
          <label class="form-label small text-muted">Format cells if...</label>
          <select
            class="form-select"
            :value="selectedRuleType"
            @change="$emit('change-rule-type', $event.target.value)"
          >
            <option v-for="ruleType in ruleTypes" :key="ruleType.id" :value="ruleType.id">
              {{ ruleType.label }}
            </option>
          </select>
        </div>

        <div class="mb-3 rule-criteria">
          <div v-if="!showDoubleCriterion && showCriterionInput" class="single-criteria">
            <input
              type="text"
              class="form-control"
              :value="criterion1"
              @input="$emit('update-criterion1', $event.target.value)"
              :placeholder="getCriterionPlaceholder()"
            />
          </div>

          <div v-if="showDoubleCriterion" class="double-criteria d-flex gap-2 align-items-center">
            <input
              type="text"
              class="form-control"
              :value="criterion1"
              @input="$emit('update-criterion1', $event.target.value)"
              placeholder="Minimum value"
            />
            <span>and</span>
            <input
              type="text"
              class="form-control"
              :value="criterion2"
              @input="$emit('update-criterion2', $event.target.value)"
              placeholder="Maximum value"
            />
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small text-muted">Formatting style</label>

          <div
            class="format-preview mb-2 p-2 border rounded d-flex justify-content-center align-items-center"
            :style="{
              backgroundColor: selectedFormat.backgroundColor,
              color: selectedFormat.textColor,
              fontWeight: selectedFormat.bold ? 'bold' : 'normal',
              fontStyle: selectedFormat.italic ? 'italic' : 'normal',
              textDecoration: selectedFormat.underline ? 'underline' : 'none',
            }"
          >
            Format preview
          </div>

          <div class="formatting-options d-flex flex-wrap gap-2">
            <div class="dropdown">
              <button
                class="btn btn-sm btn-light dropdown-toggle color-button"
                type="button"
                data-bs-toggle="dropdown"
                :style="{ borderBottom: '3px solid ' + selectedFormat.backgroundColor }"
              >
                <i class="bi bi-paint-bucket"></i>
              </button>
              <div class="dropdown-menu p-2 color-picker">
                <div class="color-grid">
                  <div
                    v-for="color in formatColors"
                    :key="color.backgroundColor"
                    class="color-option"
                    :style="{ backgroundColor: color.backgroundColor }"
                    @click="setBackgroundColor(color.backgroundColor)"
                    :title="color.name"
                  ></div>
                </div>
              </div>
            </div>

            <div class="dropdown">
              <button
                class="btn btn-sm btn-light dropdown-toggle color-button"
                type="button"
                data-bs-toggle="dropdown"
                :style="{ borderBottom: '3px solid ' + selectedFormat.textColor }"
              >
                <i class="bi bi-type"></i>
              </button>
              <div class="dropdown-menu p-2 color-picker">
                <div class="color-grid">
                  <div
                    v-for="(color, index) in textColors"
                    :key="index"
                    class="color-option"
                    :style="{ backgroundColor: color }"
                    @click="setTextColor(color)"
                  ></div>
                </div>
              </div>
            </div>

            <button
              class="btn btn-sm"
              :class="{ 'btn-primary': selectedFormat.bold, 'btn-light': !selectedFormat.bold }"
              @click="toggleFormat('bold')"
            >
              <i class="bi bi-type-bold"></i>
            </button>

            <button
              class="btn btn-sm"
              :class="{ 'btn-primary': selectedFormat.italic, 'btn-light': !selectedFormat.italic }"
              @click="toggleFormat('italic')"
            >
              <i class="bi bi-type-italic"></i>
            </button>

            <button
              class="btn btn-sm"
              :class="{
                'btn-primary': selectedFormat.underline,
                'btn-light': !selectedFormat.underline,
              }"
              @click="toggleFormat('underline')"
            >
              <i class="bi bi-type-underline"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="panel-actions d-flex justify-content-end gap-2">
        <button class="btn btn-light" @click="onClose">Cancel</button>
        <button class="btn btn-primary" @click="onDone">Done</button>
      </div>

      <div class="existing-rules mt-4" v-if="conditionalRules.length > 0">
        <h6>Existing rules for this range</h6>
        <div class="rule-list">
          <div
            v-for="rule in filteredRules"
            :key="rule.id"
            class="rule-item d-flex justify-content-between align-items-center p-2 mb-1 border rounded"
          >
            <div class="rule-info">
              <div class="rule-range small text-muted">{{ formatRuleRange(rule.range) }}</div>
              <div class="rule-condition">{{ formatRuleCondition(rule) }}</div>
            </div>
            <div class="rule-actions">
              <button class="btn btn-sm btn-light me-1" @click="onEditRule(rule.id)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-light" @click="onDeleteRule(rule.id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  selectedRange: {
    type: Object,
    required: true,
  },
  editingRuleId: {
    type: Number,
    default: null,
  },
  ruleTypes: {
    type: Array,
    required: true,
  },
  formatColors: {
    type: Array,
    required: true,
  },
  conditionalRules: {
    type: Array,
    required: true,
  },
  selectedRuleType: {
    type: String,
    required: true,
  },
  criterion1: {
    type: String,
    required: true,
  },
  criterion2: {
    type: String,
    required: true,
  },
  selectedFormat: {
    type: Object,
    required: true,
  },
  getColumnLabel: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'close',
  'add-rule',
  'update-rule',
  'delete-rule',
  'edit-rule',
  'change-rule-type',
  'update-criterion1',
  'update-criterion2',
  'update-format',
])

const textColors = ref([
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#808080', // Gray
  '#800000', // Dark Red
  '#008000', // Dark Green
  '#000080', // Dark Blue
])

const formatRangeText = computed(() => {
  const { startRow, startCol, endRow, endCol } = props.selectedRange
  if (startRow === null || startCol === null) return ''

  const startColLabel = props.getColumnLabel(startCol)
  const endColLabel = props.getColumnLabel(endCol)

  return `${startColLabel}${startRow + 1}:${endColLabel}${endRow + 1}`
})

const showDoubleCriterion = computed(() => {
  return ['between', 'not_between'].includes(props.selectedRuleType)
})

const showCriterionInput = computed(() => {
  return !['empty', 'not_empty'].includes(props.selectedRuleType)
})

const filteredRules = computed(() => {
  return props.conditionalRules.filter((rule) => {
    const { startRow, startCol, endRow, endCol } = props.selectedRange
    const ruleRange = rule.range

    return !(
      ruleRange.endRow < startRow ||
      ruleRange.startRow > endRow ||
      ruleRange.endCol < startCol ||
      ruleRange.startCol > endCol
    )
  })
})


const formatRuleRange = (range) => {
  const { startRow, startCol, endRow, endCol } = range
  const startColLabel = props.getColumnLabel(startCol)
  const endColLabel = props.getColumnLabel(endCol)

  return `${startColLabel}${startRow + 1}:${endColLabel}${endRow + 1}`
}


 const formatRuleCondition = (rule) => {
  const ruleType = props.ruleTypes.find(type => type.id === rule.type)
  const typeLabel = ruleType ? ruleType.label : rule.type
  
  if (['empty', 'not_empty'].includes(rule.type)) {
    return typeLabel
  } else if (['between', 'not_between'].includes(rule.type)) {
    return `${typeLabel} ${rule.criterion1} and ${rule.criterion2}`
  } else if (rule.type === 'custom_expression') {
    return `${typeLabel}: ${rule.criterion1}`
  } else {
    return `${typeLabel} ${rule.criterion1}`
  }
}


 const getCriterionPlaceholder = () => {
  switch (props.selectedRuleType) {
    case 'text_contains':
    case 'text_not_contains':
    case 'text_starts_with':
    case 'text_ends_with':
    case 'text_exactly':
      return 'Text value'
    case 'date_is':
    case 'date_before':
    case 'date_after':
      return 'Date value (MM/DD/YYYY)'
    case 'greater_than':
    case 'greater_than_or_equal':
    case 'less_than':
    case 'less_than_or_equal':
    case 'equal_to':
    case 'not_equal_to':
      return 'Numeric value'
    case 'custom_formula':
      return 'Formula (e.g. =A1>10)'
    case 'custom_expression':
      return 'Expression (e.g. > 5 && < 10)'
    default:
      return ''
  }
}

const onClose = () => {
  emit('close')
}

const onDone = () => {
  if (props.editingRuleId) {
    emit('update-rule')
  } else {
    emit('add-rule')
  }
}

const onRangeInputClick = () => {
  console.log('Range input clicked')
}

const setBackgroundColor = (color) => {
  emit('update-format', { ...props.selectedFormat, backgroundColor: color })
}

const setTextColor = (color) => {
  emit('update-format', { ...props.selectedFormat, textColor: color })
}

const toggleFormat = (formatType) => {
  const updatedFormat = { ...props.selectedFormat }
  updatedFormat[formatType] = !updatedFormat[formatType]
  emit('update-format', updatedFormat)
}

const onEditRule = (ruleId) => {
  emit('edit-rule', ruleId)
}

const onDeleteRule = (ruleId) => {
  emit('delete-rule', ruleId)
}
</script>

<style scoped>
.conditional-format-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
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

.panel-actions {
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.format-preview {
  height: 40px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.color-option {
  width: 24px;
  height: 24px;
  border: 1px solid #dee2e6;
  border-radius: 2px;
  cursor: pointer;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: #0d6efd;
}

.color-button {
  position: relative;
  padding-bottom: 0.75rem;
}

.rule-item {
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}

.rule-item:hover {
  background-color: #f1f3f5;
}

.rule-actions {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.rule-item:hover .rule-actions {
  opacity: 1;
}

/* Ensure Bootstrap dropdown menus display correctly */
.dropdown-menu.show {
  display: block !important;
}

.dropdown {
  position: relative !important;
}
</style>
