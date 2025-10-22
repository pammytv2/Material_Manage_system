<script setup>
import { useCounterStore } from '@/stores/myStore'

const counter = useCounterStore()
</script>

<template>
  <div>{{ counter.count }}</div>
  <div>{{ counter.doubleCount }}</div>
  <div>{{ counter.nameWithCount }}</div>
  <button @click="counter.increment">เพิ่ม</button>
</template>