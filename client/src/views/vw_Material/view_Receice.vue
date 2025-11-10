<template>
  <div>
    <Receice />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Receice from '@/components/Receice/Receive_mat_Page.vue';
// import Receive_Detail from '@/components/Receice/Receive.Detail_Page.vue';
// import Receiv_Manual from '@/components/Receice_Manual/Receive.Manual_Page.vue';
// import Materials_Split from '@/components/Split_Materials/Materials.Split_Page.vue';
// import Materials_Split_Detail from '@/components/Split_Materials/Materials.Split_Detail_Page.vue';
// import Manual_Receive_List from '@/components/Receice_Manual/Manual.Receive.List_Page.vue';
// import Manage_Material from '@/components/Manage_Material/Manage.Material_Page.vue';



export default defineComponent({
  name: 'ViewReceice',
  components: {
    Receice, 
  },
  setup() {
    // component logic here
    return {};
  }
});
</script>