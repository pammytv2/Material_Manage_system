<script lang="ts" setup>
import { onMounted } from 'vue'

import { useMainStore } from '@/stores/main.store'

const mainStore = useMainStore()

onMounted(async () => {
  //  ### User Info ###
  await mainStore.getUserData()
  // await mainStore.getUserAuth()
  // await mainStore.checkAdminStatus()
  // await mainStore.getUserApproverPosition()
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

