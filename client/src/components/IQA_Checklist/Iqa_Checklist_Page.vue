<script lang="ts" setup>
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useManageMaterialStore } from '@/stores/manage_material';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import { FilterMatchMode } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { getIqaApprovalClass, getIqaResultClass, getIqaResultClassD, getIQAStatusTextD } from '@/stores/recive_material';
const confirm = useConfirm();
const toast = useToast();
const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);
const detailRows = ref<any[]>([]);
const showDetailPageDialog = ref(false);
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const manageMaterialStore = useManageMaterialStore();
const lotSplitData = ref<any[]>([]);
const lotSplitLoading = ref(false);
const { getIQAStatusText, getIQARequiredClass } = manageMaterialStore;

async function onIqaStatusChangeDropdown(lot: any) {
    if (!lot.selectedIqaStatus) return;
    if (lot.selectedIqaStatus === 'REVISE' && !lot.remark_iqa) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark เมื่อเลือก REVISE', life: 2000 });
        return;
    }
    loading.value = true;
    try {
        await iqaCheckMaterialStore.submitIqaCheck({
            invoiceNumber: selectedReceipt.value.InvoiceNumber,
            ReceiveNo: selectedReceipt.value.ReceiveNo,
            lotNo: lot.lot_no,
            status: lot.selectedIqaStatus,
            remark_iqa: lot.remark_iqa || ''
        });
        lot.IQA_Status = lot.selectedIqaStatus;
        toast.add({ severity: 'success', summary: 'Success', detail: 'Status saved successfully', life: 2000 });

        await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
            lot.selectedIqaStatus = lot.status || null;
        });
        await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 2000 });
    } finally {
        loading.value = false;
    }
}
const filteredReceiveList = computed(() => iqaCheckMaterialStore.filteredReceiveList);

onMounted(async () => {
    await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    console.log('IQA Items:', iqaCheckMaterialStore.IqaCheckMaterialItems);
    await iqaCheckMaterialStore.status_iqa_check();
    console.log('IQA Status Items2:', iqaCheckMaterialStore._iqaStatus);
});

// const isAllLotsSelected = computed(() => {
//     const allLots = Object.values(groupedLots.value).flat();
//     if (allLots.length === 0) return false;
//     return allLots.every(
//         (lot) => lot.selectedIqaStatus === 'PASS' || lot.selectedIqaStatus === 'FAIL'
//     );
// });
// async function submitIqaCheckAll() {
//     confirm.require({
//         message: 'Are you sure you want to submit IQA Check for all lots?',
//         header: 'Confirm Submission',
//         icon: 'pi pi-exclamation-triangle',
//         accept: async () => {
//             try {
//                 for (const lots of Object.values(groupedLots.value)) {
//                     for (const lot of lots) {
//                         if (lot.selectedIqaStatus) {
//                             await iqaCheckMaterialStore.submitIqaCheck({
//                                 invoiceNumber: selectedReceipt.value.InvoiceNumber,
//                                 ReceiveNo: selectedReceipt.value.ReceiveNo,
//                                 lotNo: lot.lot_no,
//                                 status: lot.selectedIqaStatus
//                             });
//                         }
//                         toast.add({ severity: 'success', summary: 'Success', detail: 'ตรวจสอบสำเร็จ', life: 3000 });
//                     }
//                 }
//                 showDetailDialog.value = false;
//             } catch (error) {
//                 toast.add({ severity: 'error', summary: 'Error', detail: 'เกิดข้อผิดพลาดการยืนยันตรวจ', life: 3000 });
//             }
//         }
//     });
// }
async function IqaComplete() {
    confirm.require({
        message: 'Are you sure you want to submit IQA Check for all lots?',
        header: 'Confirm Submission',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            loading.value = true;
            try {
                for (const lots of Object.values(groupedLots.value)) {
                    for (const lot of lots) {
                        if (lot.selectedIqaStatus) {
                            await iqaCheckMaterialStore.completeIqaCheck({
                                invoiceNumber: selectedReceipt.value.InvoiceNumber,
                                ReceiveNo: selectedReceipt.value.ReceiveNo,
                                lotNo: lot.lot_no,
                               
                            });
                        }
                    }
                }
                // รีเฟรชข้อมูล Lot และ Receive Material List
                await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
                await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
                toast.add({ severity: 'success', summary: 'Success', detail: 'ตรวจสอบสำเร็จ', life: 3000 });
                showDetailDialog.value = false;
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'เกิดข้อผิดพลาดการยืนยันตรวจ', life: 3000 });
            } finally {
                loading.value = false;
            }
        }
    });
}
const groupedLots = computed(() => {
    const groups: Record<string, any[]> = {};
    iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
        const key = lot.ITEMNO || lot.itemno || lot.item_no || 'UNKNOWN';
        if (!groups[key]) groups[key] = [];
        groups[key].push(lot);
    });
    return groups;
});

const filters = ref<{
    global: filterMeta;
    receiveNumber: filterMeta;
    receiveDate: filterMeta;
    invoiceNumber: filterMeta;
    vendorCode: filterMeta;
    vendorName: filterMeta;
    Status: filterMeta;
    CountOrder: filterMeta;
}>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    Status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CountOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
async function onRowClick(e: any) {
    if (!e.data) return;
    selectedReceipt.value = e.data;
    lotSplitLoading.value = true;
    try {
        await iqaCheckMaterialStore.itemLotSplit(e.data.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
            lot.selectedIqaStatus = lot.status || null;
        });
        console.log('Lot Split Data:', iqaCheckMaterialStore._itemLotSplits);
    } finally {
        lotSplitLoading.value = false;
        showDetailDialog.value = true;
    }
}
function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        CountOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
        <div class="flex items-center gap-2 mb-2">
            <span class="font-medium">Status:</span>
            <Dropdown v-model="iqaCheckMaterialStore.selectedStatus" :options="iqaCheckMaterialStore.statusOptions" optionValue="value" optionLabel="label" placeholder="Status" class="w-60" />
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material List</div>
        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceiveNo"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="onRowClick"
            :globalFilter="searchQuery" 
            :globalFilterFields="['ReceiveNo', 'InvoiceNumber', 'Status', 'VendorCode', 'VendorName', 'CountOrder']"
          
            class="mb-6"
        >
            <template #header>
                <div class="flex justify-end gap-2">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                         <InputText v-model="searchQuery" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>

            <template #empty>No data found.</template>
            <Column field="ReceiveNo" header="Receive Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by receive number" />
                </template>
            </Column>

            <Column field="InvoiceNumber" header="Invoice Number" sortable>
                <template #body="{ data }">
                    <span>{{ data.InvoiceNumber || 'N/A' }}</span>
                </template>
            </Column>

            <Column field="VendorCode" header="Vendor Code" sortable />
            <Column field="VendorName" header="Vendor Name" sortable />
            <Column field="Status" header="Status" sortable>
                <template #body="{ data }">
                    <span :class="getIqaApprovalClass(data.IQA_Status)">
                        {{ data.IQA_Status }}
                    </span>
                </template>
            </Column>
            <Column field="CountOrder" header="Count Order" sortable>
                <template #body="{ data }">
                    <span>{{ data.lotcount }}</span>
                </template>
            </Column>

            <Dialog v-model:visible="showDetailDialog" header="IQA Material Detail" :style="{ width: '1100px', maxWidth: '98vw' }" modal>
                <template #default>
                    <div class="mb-4">
                        <div class="flex flex-wrap gap-4">
                            <!-- {{iqaCheckMaterialStore._itemLotSplits }} -->
                            <div>
                                <span class="font-medium">Receive Number:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.ReceiveNo }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Invoice Number:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.InvoiceNumber }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Vendor Name:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.VendorName || 'N/A' }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Vendor Code:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.VendorCode || 'N/A' }}</span>
                            </div>
                        </div>
                        <div class="mt-5">
                            <template v-for="(lots, itemNo) in groupedLots" :key="itemNo">
                                <div class="text-base font-bold mb-2" style="font-family: 'Segoe UI', 'Arial', sans-serif">
                                    [{{ itemNo }}]
                                    <span v-if="lots[0]?.ITEMDesc">{{ lots[0].ITEMDesc }}</span>
                                    <span v-else-if="lots[0]?.MaterialName">{{ lots[0].MaterialName }}</span>
                                </div>
                                <DataTable :value="lots" :loading="lotSplitLoading" showGridlines class="mb-6">
                                    <Column field="lot_no" header="Lot No" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.lot_no }}
                                        </template>
                                    </Column>
                                    <Column field="MaterialCode" header="Lot Quantity" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.lot_qty.toLocaleString() }}
                                        </template>
                                    </Column>
                                    <Column field="MaterialName" header="IQA Check" sortable class="w-60">
                                        <template #body="{ data }">
                                            <Dropdown v-model="data.selectedIqaStatus" :options="iqaCheckMaterialStore.iqaCheckOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-50">
                                                <template #option="slotProps">
                                                    <span :class="getIqaResultClass(getIQAStatusText(slotProps.option.value))">
                                                        {{ getIQAStatusText(slotProps.option.value) }}
                                                    </span>
                                                </template>
                                                <template #value="slotProps">
                                                    <span :class="getIqaResultClass(getIQAStatusText(slotProps.value))">
                                                        {{ getIQAStatusText(slotProps.value) }}
                                                    </span>
                                                </template>
                                            </Dropdown>
                                        </template>
                                    </Column>
                                    <Column field="remark" header="remark" sortable class="w-60">
                                        <template #body="{ data }">
                                            <input type="text" v-model="data.remark_iqa" class="w-full p-inputtext p-component p-filled" placeholder="Enter remark" />
                                        </template>
                                    </Column>
                                    <Column field="Status" header="Status" sortable class="w-80">
                                        <template #body="{ data }">
                                            <span :class="getIqaResultClassD(data.StatusDescription ?? '')">
                                                {{ getIQAStatusTextD(data.StatusDescription ?? '') }}
                                            </span>
                                            <!-- {{ data.StatusDescription }} -->
                                        </template>
                                    </Column>
                                    <Column field="Action" header="Action" sortable class="w-60">
                                        <template #body="{ data }">
                                          <Button
    label="Save"
    icon="pi pi-check"
    class="p-button-success"
    @click="onIqaStatusChangeDropdown(data)"
    :disabled="!data.selectedIqaStatus || loading || (data.selectedIqaStatus === 'REVISE' && !data.remark_iqa)"
/>
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <!-- <Button label="IQA Submit" @click="IqaComplete" :disabled="loading" /> -->
                    <ConfirmDialog />
                    <Button label="Close" @click="showDetailDialog = false" :disabled="loading" />
                </template>
            </Dialog>
        </DataTable>
    </div>
</template>
