import { defineStore } from 'pinia';
import { ApiService } from '@/service/api.service';
import { MaterialTransaction } from '@/interfaces/transaction.interfaces';
import { get } from 'http';

const api = import.meta.env.VITE_API_URL;

const statusOptions = [
    { label: 'ทั้งหมด', value: 'all' }, // ค่าเริ่มต้น
    { label: 'IN', value: 'IN' },
    { label: 'OUT', value: 'OUT' },
];

const useTransactionMCProdStore = defineStore('transaction_mc_prod', {
    state: () => ({
        statusOptions, // เก็บ options ไว้ใน state
        selectedStatus: 'all',
        Transaction_Prod: [] as MaterialTransaction[],
        Transaction_Mc: [] as MaterialTransaction[],


    }),
    getters: {
        _Transaction_Prod: (state) => state.Transaction_Prod,
        _Transaction_Mc: (state) => state.Transaction_Mc,
    },


    actions: {

        async ItemListTransaction_PROD(SecCD: number): Promise<MaterialTransaction[]> {
            this.Transaction_Prod = await ApiService.get<MaterialTransaction[]>(`${api}/material-transaction/material-transactions-prod?SecCD=${SecCD}`);
            return this.Transaction_Prod;
        },

        async ItemListTransaction_ALL_MC(): Promise<void> {
            this.Transaction_Mc = await ApiService.get<MaterialTransaction[]>(`${api}/material-transaction/material-transactions-mc`);
        },
    }

});

export { useTransactionMCProdStore };
