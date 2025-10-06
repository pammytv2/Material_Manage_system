<script lang="ts" setup>
import { onMounted } from 'vue'

import { useMainStore } from '@/stores/main.store'
import { useRouter } from 'vue-router'
import { useReceiveStore } from '@/stores/receive'
import { useReceiveStore_manual } from '@/stores/receive_manual'

const mainStore = useMainStore()
const router = useRouter()
const receiveStore = useReceiveStore()



onMounted(async () => {
  //  ### User Info ###
  await mainStore.getUserData()



})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

