<script lang="ts" setup>
import { NodeService } from '@/service/NodeService';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';

const loading = ref(false);
const syncProgress = ref(0); // <-- add for progress bar
const router = useRouter();
const dateError = ref('');
const receiveStore = useReceiveStore();
// const loading = receiveStore.loading;
const filters = ref<{
    global: filterMeta;
    receiveNumber: filterMeta;
    receiveDate: filterMeta;
    invoiceNumber: filterMeta;
    vendorCode: filterMeta;
    vendorName: filterMeta;
    countOrder: filterMeta;
}>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    countOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

async function handleRowClick(receipt: any) {
    const receiveNumber = receipt.ReceptNumber;
    const StatusRecIC = receipt.StatusRecIC;
    const InvoiceNumber = receipt.InvoiceNumber;
    const RecReceiveDate = receipt.ReciveDate;
    const VendorName = receipt.VendorName;

    loading.value = true;
    try {
        // รอ sync ข้อมูลเข้า DB ให้เสร็จก่อน
        await receiveStore.fetchSyncReceiveDetail(receiveNumber, StatusRecIC);

        // เก็บวันที่ไว้ใน localStorage ก่อนเปลี่ยนหน้า
        localStorage.setItem('receiveStartDate', startDate.value);
        localStorage.setItem('receiveEndDate', endDate.value);

        // ค่อยเปลี่ยนหน้า หรือทำอย่างอื่นต่อ
        const item = receiveStore.items.find((i) => i.ReceptNumber === receiveNumber);
        if (item) item.total_detail = 1; // หรือค่าที่ถูกต้องหลังรับของ
        router.push({
            path: `/uikit/Receive_Detail/${receiveNumber}`,
            query: { StatusRecIC, InvoiceNumber, RecReceiveDate, VendorName }
        });
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการ sync ข้อมูล กรุณาตรวจสอบข้อมูลหรือแจ้งผู้ดูแลระบบ');
    } finally {
        loading.value = false;
    }
}
const allReceiveList = computed(() => receiveStore.items);

const searchQuery = ref('');

function getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const startDate = ref(localStorage.getItem('receiveStartDate') || '');
const endDate = ref(localStorage.getItem('receiveEndDate') || getTodayStr());

// กรองข้อมูลตาม searchQuery
const filteredReceiveList = computed(() => {
    let list = allReceiveList.value;
    // filter by searchQuery
    if (searchQuery.value) {
        const q = searchQuery.value.trim().toLowerCase();
        list = list.filter((item) => {
            const receive = (item.ReceptNumber || '').toLowerCase();
            const invoice = (item.InvoiceNumber || '').toLowerCase();
            // ค้นหาทั้งแบบ contains และ startsWith
            return receive.includes(q) || invoice.includes(q) || receive.startsWith(q) || invoice.startsWith(q);
        });
    }
    // filter by date range
    if (startDate.value) {
        list = list.filter((item) => item.ReciveDate >= startDate.value.replace(/-/g, ''));
    }
    if (endDate.value) {
        list = list.filter((item) => item.ReciveDate <= endDate.value.replace(/-/g, ''));
    }
    return list;
});

async function onDateSearch() {
    dateError.value = '';
    if (startDate.value && endDate.value && startDate.value > endDate.value) {
        dateError.value = 'Start Date ต้องน้อยกว่า End Date';
        return;
    }
    if (!startDate.value || !endDate.value) {
        dateError.value = 'กรุณาเลือกวันที่ให้ครบถ้วน';
        return;
    }
    if (startDate.value > getTodayStr() || endDate.value > getTodayStr()) {
        dateError.value = 'วันที่ไม่สามารถเป็นอนาคตได้';
        return;
    }
    
    localStorage.setItem('receiveStartDate', startDate.value);
    localStorage.setItem('receiveEndDate', endDate.value);
    const start = startDate.value.replace(/-/g, '');
    const end = endDate.value.replace(/-/g, '');
    loading.value = true;
    await receiveStore.syncItems(start, end);
    loading.value = false;
}

function rowClass(data: any) {
    return data.total_detail === 0 ? 'highlight-gray-row' : '';
}

async function syncMaterials() {
    loading.value = true;
    syncProgress.value = 0;
    const filtered = filteredReceiveList.value.filter((item) => item.total_detail === 0);
    const total = filtered.length;
    let count = 0;
    for (const item of filtered) {
        const receiveNo = item.ReceptNumber?.toString();
        const StatusRecIC = item.StatusRecIC?.toString();
        try {
            await receiveStore.fetchSyncReceiveDetail(receiveNo, StatusRecIC);
        } catch (err) {
            alert(`Sync ล้มเหลวสำหรับ ${receiveNo} (${StatusRecIC})`);
            // หรือใช้ toast/notification แทน alert
        }
        count++;
        syncProgress.value = Math.round((count / total) * 100);
    }
    const start = startDate.value.replace(/-/g, '');
    const end = endDate.value.replace(/-/g, '');
    await receiveStore.syncItems(start, end);

    loading.value = false;
    syncProgress.value = 0;
}

function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        countOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

function formatDate(dateString: string) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material</div>
        <form class="mb-4 flex flex-col gap-4">
            <div class="flex flex-col md:flex-row md:items-end gap-4">
                <div class="flex gap-4">
                    <div class="flex flex-col">
                        <label for="startDate" class="mb-1 text-sm text-gray-600">Start Date</label>
                        <input id="startDate" v-model="startDate" type="date" class="p-2 border rounded md:w-40" />
                        <span v-if="dateError" class="text-red-500 text-xs mt-1">{{ dateError }}</span>
                    </div>
                    <div class="flex flex-col">
                        <label for="endDate" class="mb-1 text-sm text-gray-600">End Date</label>
                        <input id="endDate" v-model="endDate" type="date" class="p-2 border rounded md:w-40" />
                    </div>
                    <button
                        type="button"
                        class="px-4 py-2 bg-green-500 text-white rounded h-fit md:mb-0 mt-6"
                        :disabled="!startDate || !endDate"
                        @click="
                            async () => {
                                await onDateSearch();
                            }
                        "
                    >
                        Sync Date
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 bg-green-500 text-white rounded h-fit md:mb-0 mt-6"
                        :disabled="filteredReceiveList.filter((item) => item.total_detail === 0).length === 0"
                        @click="
                            async () => {
                                await syncMaterials();
                            }
                        "
                    >
                        Sync Materials ALL
                    </button>
                </div>
            </div>
        </form>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material List</div>
        <div class="flex-1 flex justify-end p-3">
            <Button
                icon="pi pi-plus"
                label="Manual Receive"
                class="p-button-success mr-2"
                @click="
                    () => {
                        router.push('/manual-receive-list');
                    }
                "
            />
        </div>

        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceptNumber"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="(e) => handleRowClick(e.data)"
            :globalFilterFields="['ReceptNumber', 'ReciveDate', 'InvoiceNumber', 'VendorCode', 'VendorName', 'CountItem', 'CountOrder']"
            class="mb-6"
            :loading="loading"
            :rowClass="rowClass"
        >
            <template #header>
                <div class="flex justify-between">
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
            <Column field="ReceptNumber" header="Receive Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by receive number" />
                </template>
            </Column>

            <Column field="ReciveDate" header="Receive Date" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.ReciveDate) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-mm-dd" />
                </template>
            </Column>

            <Column field="InvoiceNumber" header="Invoice Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by invoice" />
                </template>
            </Column>

            <Column field="VendorCode" header="Vendor Code" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor code" />
                </template>
            </Column>

            <Column field="VendorName" header="Vendor Name" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor name" />
                </template>
            </Column>
            <Column field="CountOrder" header="Material Count" sortable>
                <template #body="{ data }"> {{ data.total_detail }}/{{ data.CountOrder }} </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by material count" />
                </template>
            </Column>
        </DataTable>
        <!-- Loading overlay for normal loading -->
        <div v-if="loading && syncProgress === 0" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" style="backdrop-filter: blur(2px); z-index: 1000">
            <div class="flex flex-col items-center">
                <i class="pi pi-spin pi-spinner text-4xl text-white mb-4" />
                <span class="text-white text-xl">กำลังโหลดข้อมูล...</span>
            </div>
        </div>
        <!-- Loading bar overlay for syncMaterials -->
        <div v-if="syncProgress > 0" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" style="backdrop-filter: blur(2px); z-index: 1001">
            <div class="flex flex-col items-center w-80">
                <span class="text-white text-xl mb-4">Sync Materials กำลังดำเนินการ...</span>
                <div class="w-full bg-gray-700 rounded h-6 overflow-hidden mb-2">
                    <div class="bg-green-500 h-6 transition-all duration-300" :style="{ width: syncProgress + '%' }"></div>
                </div>
                <span class="text-white">{{ syncProgress }}%</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.highlight-gray-row) {
    background-color: #d1d5db !important; /* เทาเข้ม */
}

:deep(.highlight-gray-row:hover) {
    background-color: #f3f4f6 !important; /* เทาอ่อน */
}

:deep(.highlight-gray-row td) {
    background-color: #d1d5db !important;
}

:deep(.highlight-gray-row:hover td) {
    background-color: #f3f4f6 !important;
}
</style>
