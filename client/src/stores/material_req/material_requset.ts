import {defineStore} from 'pinia';
import { ApiService } from '@/service/api.service';
import { MaterialRequest } from '@/interfaces/material_request';
import { group } from 'console';
import { useMainStore } from '@/stores/main.store';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';

const mainStore = useMainStore();

const api = import.meta.env.VITE_API_URL;

const useMaterialRequestStore = defineStore('material_request', {
    state: () => ({
        materialRequests: [] as MaterialRequest[],
        materialDetails: [] as MaterialRequest[],
        materialGroupmat: [] as MaterialRequest[],
        materialType2Name: [] as MaterialRequest[],
    }),

    getters: {
        _materialRequests: (state) => state.materialRequests,
        __materialDetails: (state) => state.materialDetails,
        _materialGroupmat: (state) => state.materialGroupmat,
        _materialType2Name: (state) => state.materialType2Name,
        

         
         
    },

    actions: {

        async ItemListMaterialRequest(Sectgroup: number, GROUPMAT: string, Type2Name: string): Promise<MaterialRequest[]> {
            this.materialRequests = await ApiService.get<MaterialRequest[]>(`${api}/material-request/material-requests?Sectgroup=${Sectgroup}&GROUPMAT=${GROUPMAT}&Type2Name=${Type2Name}`);
            return this.materialRequests;
        },
        async getItemDetails(Type2Name: string, Sectgroup: number): Promise<MaterialRequest[]> {
            this.materialDetails = await ApiService.get<MaterialRequest[]>(`${api}/material-request/item-details?Type2Name=${Type2Name}&Sectgroup=${Sectgroup}`);
            return this.materialDetails;
        },
        async getGroupmat(Sectgroup: number): Promise<MaterialRequest[]> {
            this.materialGroupmat = await ApiService.get<MaterialRequest[]>(`${api}/material-request/groupmat?Sectgroup=${Sectgroup}`);
            return this.materialGroupmat;
        },
        async getType2Name(Sectgroup: number, GROUPMAT: string): Promise<MaterialRequest[]> {
            this.materialType2Name = await ApiService.get<MaterialRequest[]>(`${api}/material-request/type2name?Sectgroup=${Sectgroup}&GROUPMAT=${GROUPMAT}`);
            return this.materialType2Name;
        }
        
    },

});

export { useMaterialRequestStore };

