<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout';
import { onMounted } from 'vue';
import AppConfigurator from './AppConfigurator.vue';
import { useMainStore } from '@/stores/main.store';
import { imageUrl } from '../utils/custom';

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();
const mainStore = useMainStore();

onMounted(() => {
    // auto toggle darkmode if system is darkmode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode && !isDarkTheme.value) {
        toggleDarkMode();
    }
});
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <img src="@/assets/img/mms.png" alt="MMS Logo" style="height: 2.5rem; margin-right: 0.5rem" />
                <span style="white-space: nowrap; text-transform: capitalize"> Material Manage System </span>

            </router-link>
        </div>
        
        <div class="layout-topbar-actions flex flex-row items-center mr-4">
            <div class="user-info-block flex items-center mr-4">
                <img
                  v-if="mainStore && mainStore._userInfo?.cardcode"
                  :src="imageUrl(mainStore._userInfo.cardcode)"
                  
                  alt="user profile"
                  style="width: 40px; 
                  height: 40px; 
                  border-radius: 50%; 
                  object-fit: cover; 
                  border: 2px solid #ccc; 
                  margin-right: 12px;"
                />
                <i v-else class="pi pi-user" style="font-size: 40px; margin-right: 12px;"></i>
                <div>
                  <div class="user-name">
                    {{ mainStore?._userInfo?.eng_name }} 
                  
                  </div>
                  <div class="user-position">
                    {{ mainStore?._userInfo?.position_name }}
                  </div>
                </div>
            </div>

            
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]" />
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>
            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>
        </div>
        </div>
</template>


<style scoped>
.user-info-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 200px;
  /* ปรับขนาดได้ตามต้องการ */
}

.user-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #435060; 
  line-height: 1.1;
  /* ทำให้ตัวอักษรชิดซ้ายและดูเด่น */
}

.user-position {
  font-size: 0.95rem;
  color: #7c8a9a;
  margin-top: 2px;
  font-style: normal;
  /* สีและขนาดใกล้เคียงในรูป */
}
</style>

