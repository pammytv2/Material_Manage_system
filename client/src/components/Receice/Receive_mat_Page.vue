<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const loading = ref(false);
const syncProgress = ref(0); // <-- add for progress bar
const router = useRouter();
const dateError = ref('');
const receiveStore = useReceiveStore();
// const loading = receiveStore.loading;
const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReceptNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    ReciveDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    CountOrder: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});

const showDetailDialog = ref(false); // Dialog visibility
const selectedReceipt = ref<any>(null);
// Store selected receipt

// เพิ่ม state สำหรับ Dialog รายละเอียด
const showDetailPageDialog = ref(false);
const detailLoading = ref(false);
const detailRows = ref<any[]>([]);
const detailInfo = ref<any>({});
const viewItemInv = ref<any[]>([]);
const responseData = ref<any[]>([]);

// Add pagination variables for DataTable
const rowsPerPage = ref(10);
const page = ref(0);

async function handleRowClick(receipt: any) {
    const receiveNumber = receipt.ReceptNumber;
    const StatusRecIC = receipt.StatusRecIC;
    // const InvoiceNumber = receipt.InvoiceNumber;
    // const RecReceiveDate = receipt.ReciveDate;
    // const VendorName = receipt.VendorName;

    loading.value = true;
    try {
        // รอ sync ข้อมูลเข้า DB ให้เสร็จก่อน
        await receiveStore.fetchSyncReceiveDetail(receiveNumber, StatusRecIC);
        const start = startDate.value.replace(/-/g, '');
        const end = endDate.value.replace(/-/g, '');
        await receiveStore.syncItems(start, end);
        console.log('After sync, store items1:', receiveStore.items);

        const updated = receiveStore.items.find((i) => i.ReceptNumber === receipt.ReceptNumber);
        if (updated) selectedReceipt.value = updated;

        // เก็บวันที่ไว้ใน localStorage ก่อนเปลี่ยนหน้า
        localStorage.setItem('receiveStartDate', startDate.value);
        localStorage.setItem('receiveEndDate', endDate.value);

        // ค่อยเปลี่ยนหน้า หรือทำอย่างอื่นต่อ
        // const item = receiveStore.items.find((i) => i.ReceptNumber === receiveNumber);
        // if (item) item.total_detail = 1; // หรือค่าที่ถูกต้องหลังรับของ

        // selectedReceipt.value = receipt;
        await openDetailPageDialog();
        showDetailDialog.value = true;
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการ sync ข้อมูล กรุณาตรวจสอบข้อมูลหรือแจ้งผู้ดูแลระบบ');
    } finally {
        loading.value = false;
    }
}

// ฟังก์ชันดึงข้อมูล detail และเปิด Dialog
async function openDetailPageDialog() {
    page.value = 0; // reset to first page
    if (!selectedReceipt.value) return;
    detailLoading.value = true;
    // ดึงข้อมูล detail จาก store
    const receiveNumber = selectedReceipt.value.ReceptNumber;
    const InvoiceNumber = selectedReceipt.value.InvoiceNumber;
    const response = await receiveStore.getComponents(receiveNumber);
    const view_item_inv = await receiveStore.fetchReceiveItems_Split(InvoiceNumber);

    responseData.value = response;
    viewItemInv.value = view_item_inv ?? [];

    // สร้างข้อมูลสำหรับแสดง
    detailInfo.value = {
        receiveNumber: receiveNumber,
        receiveDate: selectedReceipt.value.ReciveDate,
        invoiceNumber: selectedReceipt.value.InvoiceNumber,
        vendorName: selectedReceipt.value.VendorName,
        vdcode: selectedReceipt.value.VendorCode,
        specialExpDate: selectedReceipt.value.SpecialExpDate || ''
    };
    detailRows.value = Array.isArray(response)
        ? response.map((row: any, idx: number) => ({
              no: idx + 1,
              itemNo: row.ITEMNO ?? '',
              description: row.ITEMDESC ?? '',
              unit: row.UNIT ?? '',
              receiveQty: row.RQRECEIVED ?? '',
              lotExpireDate: row.LotExpireDate ?? '',
              invoice: row.InvoiceNumber ?? '',
              vdcode: row.VendorCode ?? '',
              vdname: row.VendorName ?? '',
              iqaStatus: row.IQAStatus ?? '',
              takeOutQty: row.takeOutQty ?? '',
              returnQty: row.returnQty ?? '',
              balanceQty: row.balanceQty ?? '',
              lotSplitStatusIdx: row.lotSplitStatusIdx ?? '',
              lotSplit: row.LotSplit ?? '',
              ExpDate: row.ExpDate ?? '',
              IQA: row.IQA ?? ''
          }))
        : [];
    detailLoading.value = false;
    showDetailPageDialog.value = true;

    console.log('list', detailRows.value);
    console.log('info', detailInfo.value);
    console.log('response', responseData.value);
    console.log('viewItemInv', viewItemInv.value);
    detailLoading.value = false;
    showDetailPageDialog.value = true;
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

    localStorage.setItem('receiveStartDate', startDate.value);
    localStorage.setItem('receiveEndDate', endDate.value);
    const start = startDate.value.replace(/-/g, '');
    const end = endDate.value.replace(/-/g, '');
    loading.value = true;
    await receiveStore.syncItems(start, end);
    console.log('After sync, store items2:', receiveStore.items);
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
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ReceptNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        ReciveDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
        InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        CountOrder: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}

function formatDate(dateString: string) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
}

// Add page change handler for DataTable pagination
function onPageChange(event: any) {
    page.value = event.page;
    rowsPerPage.value = event.rows;
}
const pagedViewItemInv = computed(() => {
    const start = page.value * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return viewItemInv.value.slice(start, end);
});
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
    class="px-4 py-2 rounded h-fit md:mb-0 mt-6
        text-white
        transition
        duration-200
        ease-in-out
        bg-green-500
        hover:bg-green-600
        disabled:bg-gray-400
        disabled:cursor-not-allowed"
    :disabled="filteredReceiveList.filter((item) => item.total_detail === 0).length === 0 || loading"
    @click="async () => { await syncMaterials(); }"
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
            @rowClick="
                (e) => {
                    selectedReceipt = e.data;
                    showDetailDialog = true;
                }
            "
            :globalFilterFields="['ReceptNumber', 'ReciveDate', 'InvoiceNumber', 'VendorCode', 'VendorName', 'CountItem', 'CountOrder']"
            class="mb-6"
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
                <!-- data.total_detail -->
                <template #body="{ data }">
                    {{ data.total_detail }}/
                    {{
                        data.ReceptNumber?.startsWith('RT') || data.ReceptNumber?.startsWith('M')
                            ? data.CountOrder
                            : data.total_item
                    }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by material count" />
                </template>
            </Column>
        </DataTable>

        <!-- Dialog for Receive Detail -->
        <Dialog v-model:visible="showDetailDialog" modal header="Receive Detail" :style="{ width: '500px', height: '240px' }" :loading="loading">
            <template v-if="selectedReceipt">
                <div class="space-y-2">
                    <div><strong>Receive Number:</strong> {{ selectedReceipt.ReceptNumber }}</div>

                    <div><strong>Invoice Number:</strong> {{ selectedReceipt.InvoiceNumber }}</div>
                    <div><strong>Receive Date:</strong> {{ formatDate(selectedReceipt.ReciveDate) }}</div>
                    <div><strong>Vendor Name:</strong> {{ selectedReceipt.VendorName }}</div>
                    <div><strong>Vendor Code:</strong> {{ selectedReceipt.VendorCode }}</div>
                </div>
            </template>
            <template #footer>
                <Button label="View" @click="openDetailPageDialog" :disabled="loading || selectedReceipt?.total_detail === 0" />
                <Button label="Sync" :loading="loading" :disabled="loading" @click="handleRowClick(selectedReceipt)" />
                <Button label="Close" @click="showDetailDialog = false" :disabled="loading" />
            </template>
        </Dialog>

        <!-- Dialog แสดงรายละเอียด (เหมือน Receive.Detail_Page) -->
        <Dialog v-model:visible="showDetailPageDialog" modal header="Receive Material " :style="{ width: '1100px', maxWidth: '98vw' }">
            <template v-if="detailInfo">
                <div class="mb-4">
                    <div class="flex flex-wrap gap-4">
                        <div>
                            <span class="font-medium">Receive Number:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ detailInfo.receiveNumber }}</span>
                        </div>
                        <div>
                            <span class="font-medium">Receive Date:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ detailInfo.receiveDate }}</span>
                        </div>
                        <div>
                            <span class="font-medium">Invoice Number:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ detailInfo.invoiceNumber }}</span>
                        </div>
                        <div>
                            <span class="font-medium">Vendor Name:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ detailInfo.vendorName }}</span>
                        </div>
                        <div>
                            <span class="font-medium">Vendor Code:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ detailInfo.vdcode }}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-5 flex flex-col md:flex-row gap-8">
                    <!-- Left: ACCPAC -->
                    <div class="flex-1">
                        <h3 class="font-bold text-lg mb-2">Receive Material Detail List (ACCPAC)</h3>
                        <DataTable :value="pagedViewItemInv" :loading="detailLoading" showGridlines>
                            <Column field="ITEMNO" header="Item No" sortable style="width: 120px" />
                            <Column field="ITEMDESC" header="Description" sortable style="width: 300px" />
                            <Column field="RQRECEIVED" header="Receive(QTY)" sortable style="width: 100px">
                                <template #body="{ data }">
                                    {{ Number(data.RQRECEIVED).toLocaleString() }}
                                </template>
                            </Column>
                            <Column field="UNIT" header="Unit" sortable style="width: 100px" />
                        </DataTable>
                    </div>
                    <!-- Right: MMS  -->
                    <div class="flex-1">
                        <h3 class="font-bold text-lg mb-2">Receive Material Detail (MMS)</h3>
                        <!-- paginator-->
                        <DataTable :value="detailRows" :loading="detailLoading" showGridlines class="mb-4" paginator :rows="rowsPerPage" :totalRecords="detailRows.length" :first="page * rowsPerPage" @page="onPageChange">
                            <Column field="itemNo" header="Item No" sortable style="width: 120px" />
                            <Column field="description" header="Description" sortable style="width: 300px" />
                            <Column field="receiveQty" header="Receive(QTY)" sortable style="width: 100px">
                                <template #body="{ data }">
                                    {{ Number(data.receiveQty).toLocaleString() }}
                                </template>
                            </Column>
                            <Column field="unit" header="Unit" sortable style="width: 100px" />
                        </DataTable>
                    </div>
                </div>
            </template>
            <template #footer>
                <Button
                    label="Close"
                    @click="
                        () => {
                            showDetailPageDialog = false;
                            showDetailDialog = false;
                        }
                    "
                />
            </template>
        </Dialog>

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
