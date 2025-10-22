import {defineStore} from "pinia";
import {ApiService} from "@/service/api.service";
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { s } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

const api = import.meta.env.VITE_API_URL;

const default_state: ReceiveStoreState = {
    items: [],
    materialSplitItems: [], // เพิ่มสำหรับเก็บข้อมูล material-split แยกต่างหาก
    item_split: [],
    loading: false,
    error: null,
    detail: null
};

const statusOptions = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'รอการตรวจสอบ', value: 'pending' },
    { label: 'ผ่าน', value: 'pass' },
    { label: 'ไม่ผ่าน', value: 'fail' }
];

const useIqaCheckMaterialStore = defineStore('iqa_check_material', {
    state: () => ({
    statusOptions,      // เก็บ options ไว้ใน state
    selectedStatus: 'all'
  }),
    getters: {
      selectedStatusLabel: (state) => {
      const found = state.statusOptions.find(opt => opt.value === state.selectedStatus)
      return found ? found.label : ''
    }
       
    },
    actions: {
        setStatus(status){
            this.selectedStatus = status;
        }
       
        

        
    }
});

export {useIqaCheckMaterialStore,};