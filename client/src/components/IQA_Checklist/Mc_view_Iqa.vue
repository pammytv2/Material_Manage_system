<script setup lang="ts">
import { ref } from 'vue'

const materialList20 = Array.from({ length: 20 }, (_, i) => ({
    itemNo: `EO${String(100 + i)}`,
    description: `Material Description ${i + 1}`,
    unit: 'PCS.',
    receiveQty: 1000 + i * 10,
    waitSplitQty: 1000 + i * 10,
    lotSplitLot: `${i % 3} lot`,
    lotSplitStatus: i % 2 === 0 ? 'Yes' : 'No',
    iqaStatus: i % 2 === 0 ? 'PENDING' : 'PASS',
    iqaRemark: i % 2 === 0 ? '-' : 'OK'
}))

const receiveList = [
    {
        receiveNumber: 'M250345E',
        receiveDate: '20251009',
        vendorDetails: 'Vendor A',
        contact: 'John Doe',
        invoiceNumber: 'INV001',
        materialList: materialList20
    },
    {
        receiveNumber: 'M250346E',
        receiveDate: '20251010',
        vendorDetails: 'Vendor B',
        contact: 'Jane Smith',
        invoiceNumber: 'INV002',
        materialList: [
            {
                itemNo: 'EO047',
                description: 'COPPER WIRE',
                unit: 'M.',
                receiveQty: 1000,
                waitSplitQty: 1000,
                lotSplitLot: '1 lot',
                lotSplitStatus: 'Yes',
                iqaStatus: 'PENDING',
                iqaRemark: '-'
            }
        ]
    }
]

const expandedRows = ref([])
</script>

<template>
    <div class="p-4">
        <div class="card">
             <div class="font-semibold text-xl mb-4">Material IQA  Status</div>
        </div>
        
      
        <DataTable
            :value="receiveList"
            dataKey="receiveNumber"
            v-model:expandedRows="expandedRows"
            rowExpansion
            showGridlines
            class="mb-6"
        >
            <Column expander style="width: 3em" />
            <Column field="receiveNumber" header="Receive Number" />
            <Column field="receiveDate" header="Receive Date" />
            <Column field="vendorDetails" header="Vendor Code" />
            <Column field="contact" header="Vendor Name" />
            <Column field="invoiceNumber" header="Invoice Number" />

            <template #expansion="slotProps">
                <Card class="mb-4">
                    <template #title>
                        <div class="flex flex-wrap gap-4 items-center">
                            <span class="font-bold text-lg">Receive Detail</span>
                            <span>Receive Number: <InputText :value="slotProps.data.receiveNumber" disabled class="w-32" /></span>
                            <span>Receive Date: <InputText :value="slotProps.data.receiveDate" disabled class="w-32" /></span>
                            <span>Vendor: <InputText :value="slotProps.data.vendorDetails" disabled class="w-32" /></span>
                            <span>Contact: <InputText :value="slotProps.data.contact" disabled class="w-32" /></span>
                            <span>Invoice: <InputText :value="slotProps.data.invoiceNumber" disabled class="w-32" /></span>
                        </div>
                    </template>
                    <template #content>
                        <div class="flex justify-between items-center mb-4">
                            <span class="font-bold text-lg">Material List</span>
                            <div class="flex gap-2">
                                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" />
                                <InputText placeholder="Keyword Search" />
                            </div>
                        </div>
                        <DataTable :value="slotProps.data.materialList" showGridlines>
                            <Column field="itemNo" header="Item No" />
                            <Column field="description" header="Description" />
                            <Column field="receiveQty" header="Receive(QTY)" />
                            <Column field="unit" header="Unit" />
                          
                            
                           
                            
                            <Column field="iqaStatus" header="IQA Status">
                                <template #body="props">
                                    <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
                                        {{ props.data.iqaStatus }}
                                    </span>
                                </template>
                            </Column>
                            <Column field="iqaRemark" header="IQA Remark" />
                        </DataTable>
                    </template>
                </Card>
            </template>
        </DataTable>
    
    </div>
</template>