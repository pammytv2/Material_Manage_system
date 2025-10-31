<template>
  <Breadcrumb :model="items">
    <template #item="{ item }">
      <router-link :to="item.to" class="flex items-center hover:underline">
        <i v-if="item.icon" :class="item.icon + ' mr-1'" />
        {{ item.label }}
      </router-link>
    </template>
    <template #separator>
      <span class="mx-2 text-gray-400">
        <i class="pi pi-chevron-right" />
      </span>
    </template>
  </Breadcrumb>
</template>

<script setup lang="ts">
import Breadcrumb from 'primevue/breadcrumb';
defineProps<{ items: { label: string, to: string, icon?: string }[] }>()
</script>

<style scoped>

</style>