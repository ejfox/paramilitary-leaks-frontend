<template>
  <div class="relative" @click.away="isOpen = false">
    <!-- Selected Items Display -->
    <div
      class="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm min-h-[38px] cursor-pointer flex flex-wrap gap-2 items-center"
      @click="isOpen = !isOpen">
      <div v-if="modelValue.length === 0" class="text-gray-400">
        {{ placeholder }}
      </div>
      <div v-for="item in modelValue" :key="item" class="bg-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
        {{ item }}
        <button @click.stop="remove(item)" class="hover:text-red-400">×</button>
      </div>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen"
      class="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-[300px] flex flex-col">
      <!-- Search Input -->
      <div class="p-2 border-b border-gray-700">
        <input v-model="search" type="text"
          class="w-full bg-gray-900 text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          :placeholder="searchPlaceholder" @keydown.enter.prevent="addFirstMatch">
      </div>

      <!-- Options List -->
      <div class="overflow-y-auto flex-1">
        <div v-for="option in filteredOptions" :key="option"
          class="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-white flex items-center justify-between"
          @click="toggle(option)">
          {{ option }}
          <span v-if="isSelected(option)" class="text-blue-400">✓</span>
        </div>
        <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-sm text-gray-400 italic">
          No matches found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Select items...'
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const search = ref('')

const filteredOptions = computed(() => {
  if (!search.value) return props.options
  const searchLower = search.value.toLowerCase()
  return props.options.filter(opt =>
    opt.toLowerCase().includes(searchLower)
  )
})

function toggle(option) {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(option)
  if (index === -1) {
    newValue.push(option)
  } else {
    newValue.splice(index, 1)
  }
  emit('update:modelValue', newValue)
}

function remove(option) {
  emit('update:modelValue', props.modelValue.filter(item => item !== option))
}

function isSelected(option) {
  return props.modelValue.includes(option)
}

function addFirstMatch() {
  const match = filteredOptions.value[0]
  if (match && !isSelected(match)) {
    toggle(match)
  }
  search.value = ''
}
</script>