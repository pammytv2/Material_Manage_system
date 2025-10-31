<script lang="ts" setup>
import { onMounted } from 'vue'

import { useMainStore } from '@/stores/main.store'
import { useRouter } from 'vue-router'
import { useReceiveStore } from '@/stores/receive'
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';
import { useReceiveStore_manual } from '@/stores/receive_manual'
import { console } from 'inspector';

const mainStore = useMainStore()
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const router = useRouter()
const receiveStore = useReceiveStore()



onMounted(async () => {
  //  ### User Info ###
  await mainStore.getUserData()
  //  {{iqaCheckMaterialStore._itemListTransaction_MC_PROD }}
  await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();

  
  



})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

