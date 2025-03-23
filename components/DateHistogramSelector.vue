<template>
  <div class="date-histogram-selector w-full">
    <!-- Minimal header with message count -->
    <div class="flex justify-between items-center mb-1 px-1 text-xs text-gray-400">
      <div>{{ messageCount }} messages {{ startDate ? 'from ' + formatDisplayDate(startDate) + (endDate && endDate !== startDate ? ' to ' + formatDisplayDate(endDate) : '') : 'all time' }}</div>
      <button @click="reset" class="hover:text-white text-blue-400" v-if="startDate || endDate">Reset</button>
    </div>
    
    <!-- Main visualization area -->
    <div 
      ref="histogramRef" 
      class="histogram-container w-full h-14 bg-gray-900/50 relative border-t border-b border-blue-900/30 cursor-pointer select-none"
      @mousemove="onMouseMove"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
    >
      <!-- Histogram bars will be rendered here by D3 -->
      
      <!-- Selected range overlay -->
      <div 
        v-if="selectionStart !== null && selectionEnd !== null" 
        class="absolute top-0 bottom-0 pointer-events-none bg-blue-500/20 border-l border-r border-blue-500/40"
        :style="{
          left: `${selectionStartPx}px`,
          width: `${selectionEndPx - selectionStartPx}px`
        }"
      ></div>
      
      <!-- Current hover position indicator -->
      <div 
        v-if="hoverDate" 
        class="absolute top-0 bottom-0 pointer-events-none border-l border-white/40 z-10"
        :style="{left: `${hoverPosition}px`}"
      ></div>
      
      <!-- Hover tooltip -->
      <div 
        v-if="hoverDate && hoverCount" 
        class="absolute top-0 text-[10px] text-white bg-gray-800 px-1 py-0.5 -mt-6 transform -translate-x-1/2 pointer-events-none z-10"
        :style="{left: `${hoverPosition}px`}"
      >
        {{ formatDisplayDate(hoverDate) }} · {{ hoverCount }}
      </div>
      
      <!-- Date markers at bottom -->
      <div class="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-gray-500 select-none">
        <span>{{ formatDisplayDate(minDate) }}</span>
        <span>{{ formatDisplayDate(maxDate) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import * as d3 from 'd3';
import { format } from 'date-fns';

const props = defineProps({
  // Data should be an array of objects with date and count properties
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  // Current selected date range (if any) - for v-model support
  modelValue: {
    type: Object,
    default: () => ({ startDate: null, endDate: null })
  },
  // For backward compatibility
  selectedStartDate: {
    type: String,
    default: null
  },
  selectedEndDate: {
    type: String,
    default: null
  },
  // Add sender as a prop to track changes
  sender: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'update:range']);

// Local state
const histogramRef = ref(null);
const isSelecting = ref(false);
const selectionStart = ref(null);
const selectionEnd = ref(null);
const hoverDate = ref(null);
const hoverCount = ref(null);
const hoverPosition = ref(0);
const startDate = ref(props.modelValue?.startDate || props.selectedStartDate);
const endDate = ref(props.modelValue?.endDate || props.selectedEndDate);
const dateScale = ref(null);
const countsByDate = ref({});
const previousSender = ref(props.sender);

// Computed properties
const selectionStartPx = computed(() => {
  if (selectionStart.value === null || !dateScale.value) return 0;
  return dateScale.value(new Date(selectionStart.value));
});

const selectionEndPx = computed(() => {
  if (selectionEnd.value === null || !dateScale.value) return 0;
  return dateScale.value(new Date(selectionEnd.value));
});

const messageCount = computed(() => {
  // If no data, return 0
  if (!props.data || !props.data.length) {
    return '0';
  }
  
  // If selection is active, count messages in range
  if (startDate.value && endDate.value) {
    let count = 0;
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    
    for (const dateStr in countsByDate.value) {
      const date = new Date(dateStr);
      if (date >= start && date <= end) {
        count += countsByDate.value[dateStr];
      }
    }
    return count.toLocaleString();
  }
  
  // Otherwise return total
  return props.data.reduce((sum, item) => sum + item.count, 0).toLocaleString();
});

const minDate = computed(() => {
  if (!props.data || !props.data.length) return '';
  // Return the first date from the data (which includes all dates even when filtered)
  return props.data[0].date;
});

const maxDate = computed(() => {
  if (!props.data || !props.data.length) return '';
  // Return the last date from the data (which includes all dates even when filtered)
  return props.data[props.data.length - 1].date;
});

// Format date for display
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

// Format date for data operations (YYYY-MM-DD)
function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

// Handle mouse interaction
function onMouseMove(event) {
  if (!dateScale.value) return;
  
  try {
    const rect = histogramRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Calculate date at this position
    const date = dateScale.value.invert(x);
    const dateStr = formatDateISO(date);
    
    // Find closest data point 
    const bisect = d3.bisector(d => new Date(d.date)).left;
    const index = bisect(props.data, date);
    
    // Check if we have valid data to show
    if (index >= props.data.length) {
      // Use the last point if we're beyond the range
      hoverDate.value = props.data[props.data.length - 1].date;
      hoverCount.value = props.data[props.data.length - 1].count;
    } else {
      const closestPoint = props.data[Math.min(index, props.data.length - 1)];
      
      if (!closestPoint) {
        console.error('Could not find closest point in data');
        return;
      }
      
      hoverDate.value = closestPoint.date;
      hoverCount.value = closestPoint.count;
    }
    
    hoverPosition.value = x;
    
    // Update selection if we're in the middle of dragging
    if (isSelecting.value && selectionStart.value) {
      if (new Date(dateStr) < new Date(selectionStart.value)) {
        selectionStart.value = dateStr;
      } else {
        selectionEnd.value = dateStr;
      }
    }
  } catch (err) {
    console.error('Error in histogram mouse move:', err);
  }
}

function onMouseDown(event) {
  if (!dateScale.value) return;
  
  isSelecting.value = true;
  
  const rect = histogramRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  
  // Calculate date at this position
  const date = dateScale.value.invert(x);
  const dateStr = formatDateISO(date);
  
  selectionStart.value = dateStr;
  selectionEnd.value = dateStr;
}

function onMouseUp() {
  if (isSelecting.value) {
    isSelecting.value = false;
    
    // Only update if we have a valid selection
    if (selectionStart.value && selectionEnd.value) {
      // Make sure start is before end
      const start = new Date(selectionStart.value);
      const end = new Date(selectionEnd.value);
      
      if (start > end) {
        [selectionStart.value, selectionEnd.value] = [selectionEnd.value, selectionStart.value];
      }
      
      startDate.value = selectionStart.value;
      endDate.value = selectionEnd.value;
      
      // Emit both v-model and legacy events
      const dateRange = { 
        startDate: selectionStart.value, 
        endDate: selectionEnd.value 
      };
      
      emit('update:modelValue', dateRange);
      emit('update:range', dateRange);
    }
  }
}

function onMouseLeave() {
  if (isSelecting.value) {
    onMouseUp(); // Finalize selection
  }
  hoverDate.value = null;
  hoverCount.value = null;
}

function reset() {
  startDate.value = null;
  endDate.value = null;
  selectionStart.value = null;
  selectionEnd.value = null;
  
  // Emit both events with null dates
  const nullRange = { startDate: null, endDate: null };
  emit('update:modelValue', nullRange);
  emit('update:range', nullRange);
}

// Create the histogram visualization
function createHistogram() {
  if (!histogramRef.value) return;
  
  // Clear previous content
  d3.select(histogramRef.value).selectAll('svg').remove();
  
  if (!props.data || !props.data.length) {
    console.log('No data available for histogram');
    return;
  }
  
  console.log(`Creating histogram with ${props.data.length} data points`);
  
  // Process data for the histogram
  const processedData = props.data.map(d => ({
    date: new Date(d.date),
    count: d.count
  }));

  // Create a map for easier access
  countsByDate.value = {};
  props.data.forEach(d => {
    countsByDate.value[d.date] = d.count;
  });
  
  const container = histogramRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight - 12; // Leave space for date markers
  
  // Create svg element
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('position', 'absolute')
    .style('top', 0)
    .style('left', 0);
  
  // Set up scales
  dateScale.value = d3.scaleTime()
    .domain([
      d3.min(processedData, d => d.date),
      d3.max(processedData, d => d.date)
    ])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.count)])
    .range([height, 2]); // Leave a small gap at the top
  
  // Draw bars
  svg.selectAll('rect')
    .data(processedData)
    .enter()
    .append('rect')
    .attr('x', d => dateScale.value(d.date))
    .attr('y', d => yScale(d.count))
    .attr('width', Math.max(2, width / processedData.length)) // Ensure bars are at least 2px wide
    .attr('height', d => height - yScale(d.count))
    .attr('fill', d => {
      // Cyberpunk gradient effect - brighter for higher values
      const intensity = d.count / d3.max(processedData, d => d.count);
      // For zero counts (when filtering), use a very subtle color to maintain the visual range
      if (d.count === 0) {
        return 'rgba(17, 24, 39, 0.2)'; // Very subtle background for zero counts
      }
      return intensity > 0.8 
        ? 'rgba(56, 189, 248, 0.9)' // Bright blue for high points
        : intensity > 0.5 
          ? 'rgba(29, 78, 216, 0.7)' // Medium blue
          : 'rgba(17, 24, 39, 0.6)'; // Dark for low points
    });
  
  // Update selection if we have one
  if (startDate.value && endDate.value) {
    selectionStart.value = startDate.value;
    selectionEnd.value = endDate.value;
  }
}

// Watch for data changes
watch(() => props.data, (newData) => {
  console.log(`DateHistogramSelector data changed: ${newData.length} items`);
  // Delay slightly to allow for render cycle
  nextTick(() => {
    createHistogram();
  });
}, { deep: true, immediate: true });

// Watch for modelValue changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    startDate.value = newVal.startDate;
    endDate.value = newVal.endDate;
    selectionStart.value = newVal.startDate;
    selectionEnd.value = newVal.endDate;
  }
}, { deep: true });

// Watch for sender changes (legacy props)
watch(() => props.selectedStartDate, (newVal) => {
  if (newVal !== startDate.value) {
    startDate.value = newVal;
    selectionStart.value = newVal;
  }
});

watch(() => props.selectedEndDate, (newVal) => {
  if (newVal !== endDate.value) {
    endDate.value = newVal;
    selectionEnd.value = newVal;
  }
});

// Watch for sender changes - if the sender changes, we should rebuild the chart
watch(() => props.sender, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    previousSender.value = oldVal;
    console.log(`DateHistogramSelector sender changed from "${oldVal}" to "${newVal}"`);
    // Force histogram recreation
    nextTick(() => {
      createHistogram();
    });
  }
});

// Lifecycle hooks
onMounted(() => {
  createHistogram();
  window.addEventListener('resize', createHistogram);
});

onUnmounted(() => {
  window.removeEventListener('resize', createHistogram);
});
</script>

<style scoped>
.date-histogram-selector {
  /* Cyberpunk-inspired styling */
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.4) 0%, rgba(17, 24, 39, 0.2) 100%);
  border-radius: 3px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.histogram-container {
  border-radius: 2px;
  transition: all 0.2s ease;
}

.histogram-container:hover {
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}
</style> 