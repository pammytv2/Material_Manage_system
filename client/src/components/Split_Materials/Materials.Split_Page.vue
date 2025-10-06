<script lang="ts" setup>
import { NodeService } from '@/service/NodeService';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';

const loading = ref(false);
const ReceptNumber = ref('');
const router = useRouter();
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

    router.push({
        path: `/materials-split-detail/${receiveNumber}`,
        query: { StatusRecIC, InvoiceNumber, RecReceiveDate, VendorName }
    });

    console.log('Row clicked:', receipt);

    console.log('Row clicked1:', receiveNumber);

    // receiveStore.getComponents(receiveNumber, StatusRecIC);
    console.log('StatusRecIC:', StatusRecIC);

    console.log('receiveStore:', receiveStore);
}
const allReceiveList = computed(() => receiveStore.materialSplitItems);

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
    // เพิ่ม MaterialDivisionStatus ให้แต่ละ row
    return list.map(row => ({
        ...row,
        MaterialDivisionStatus: getMaterialDivisionStatus(row)
    }));
});

async function onDateSearch() {
    localStorage.setItem('receiveStartDate', startDate.value);
    localStorage.setItem('receiveEndDate', endDate.value);
    const start = startDate.value.replace(/-/g, '');
    const end = endDate.value.replace(/-/g, '');
    loading.value = true;
    await receiveStore.fetchMaterialSplit(start, end);

    loading.value = false;
}
const receiveItems = computed(() =>
    receiveStore.item_split.map(row => ({
        ...row,
        MaterialDivisionStatus: getMaterialDivisionStatus(row)
    }))
);
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

function getMaterialDivisionStatus(row: any) {
    if (row.total_split_qty === 0) return 'none';
    if (row.total_split_qty === row.total_received_qty) return 'complete';
    if (row.total_split_qty > 0 && row.total_split_qty < row.total_received_qty) return 'partial';
    return 'none';
}

function formatDate(dateString: string) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
}

onMounted(async () => {
    try {
        loading.value = true;
        await receiveStore.fetchReceiveItems(ReceptNumber.value);
        console.log('Fetched items for ReceptNumber:', ReceptNumber.value);
    } catch (error) {
        console.error('Error in onMounted:', error);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material</div>
        <form class="mb-4 flex flex-col gap-4">
            <div class="flex flex-col md:flex-row md:items-end gap-4">
                <div class="flex gap-4">
                    <input id="startDate" v-model="startDate" type="date" class="p-2 border rounded md:w-40" />
                    <input id="endDate" v-model="endDate" type="date" class="p-2 border rounded md:w-40" />
                    <button
                        type="button"
                        class="px-4 py-2 bg-green-500 text-white rounded h-fit md:mb-0 mt-0"
                        @click="
                            async () => {
                                await onDateSearch();
                            }
                        "
                    >
                        Search
                    </button>
                </div>
            </div>
        </form>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material List</div>
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
            <template #loading>
                <div class="flex justify-center items-center py-8">
                    <i class="pi pi-spin pi-spinner text-2xl mr-2" />
                    กำลังโหลดข้อมูล...
                </div>
            </template>

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
            <Column field="MaterialDivisionStatus" header="Material Division Status" sortable>
        <template #body="{ data }">
            <span v-if="data.MaterialDivisionStatus === 'complete'" class="text-green-600 font-semibold">แบ่งครบแล้ว</span>
            <span v-else-if="data.MaterialDivisionStatus === 'partial'" class="text-yellow-600 font-semibold">แบ่งบางส่วน</span>
            <span v-else class="text-red-600 font-semibold">ยังไม่แบ่ง</span>
        </template>
        <template #filter="{ filterModel }">
            <Dropdown
                v-model="filterModel.value"
                :options="[
                    { label: 'แบ่งครบแล้ว', value: 'complete' },
                    { label: 'แบ่งบางส่วน', value: 'partial' },
                    { label: 'ยังไม่แบ่ง', value: 'none' }
                ]"
                placeholder="เลือกสถานะการแบ่ง"
                class="p-column-filter"
                optionLabel="label"
                optionValue="value"
                showClear
            />
        </template>
    </Column>
            <Column field="CountOrder" header="Item Count" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by count order" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
