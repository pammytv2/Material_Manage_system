<script lang="ts" setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, onMounted, ref, watch } from 'vue';
import Chart from 'primevue/chart';
import Fluid from 'primevue/fluid';

const { layoutConfig, isDarkTheme } = useLayout();

// Create computed properties for the missing values
const getPrimary = computed(() => layoutConfig.primary);
const getSurface = computed(() => layoutConfig.surface);

// Define proper types for the chart data and options
const lineData = ref<any>({});

const barData = ref<any>({});

const barOptions = ref<any>({});

onMounted(() => {
    setColorOptions();
});

function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);

    barData.value = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
            {
                label: 'My First dataset',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                data: [65, 59, 80, 81, 56, 55, 40]
            },
            {
                label: 'My Second dataset',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                borderColor: documentStyle.getPropertyValue('--p-primary-200'),
                data: [28, 48, 40, 19, 86, 27, 90]
            }
        ]
    };

    lineData.value = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
            {
                label: 'First Dataset',
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                tension: 0.4
            },
            {
                label: 'Second Dataset',
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                borderColor: documentStyle.getPropertyValue('--p-primary-200'),
                tension: 0.4
            }
        ]
    };
}

watch(
    [getPrimary, getSurface, isDarkTheme],
    () => {
        setColorOptions();
    },
    { immediate: true }
);
</script>

<template>
    <div>
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Bar</div>
                <Chart type="bar" :data="barData" :options="barOptions"></Chart>
            </div>
        </div>
    </div>
</template>
