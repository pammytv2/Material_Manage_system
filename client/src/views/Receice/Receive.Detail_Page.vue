<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, reactive, ref, toRefs, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { IReceiveDetailItem, LotRow, IReceiveItem } from '@/interfaces/receive.interfaces';
import { useRoute } from 'vue-router';


const receiveStore = useReceiveStore();
const router = useRouter();
const toast = useToast();
const loading = ref(false);
const route = useRoute();

// const receiveNumber = route.params.receiveNumber;

// Dialog state
const isDialogOpen = ref(false);
const dialogRowIndex = ref<number | null>(null);
const searchQuery = ref('');
// const checkboxValue = ref(false);
// const loading = ref(false);
const selectedRows = ref<IReceiveDetailItem[]>([]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unit: { value: null, matchMode: FilterMatchMode.EQUALS },
    lotExpireDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS },
    invoice: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    iqaStatus: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const receiveNumber = computed(() => receiveStore.detail?.receiveNumber || route.params.receiveNumber || '');
const receiveDate = computed(() => receiveStore.detail?.receiveDate || route.query.RecReceiveDate || route.params.receiveDate || '');
const invoiceNumber = computed(() => receiveStore.detail?.invoiceNumber || route.query.InvoiceNumber || route.params.invoiceNumber || '');
const specialExpDate = computed(() => receiveStore.detail?.specialExpDate || '');
const vendorName = computed(() => receiveStore.detail?.vendorName || route.query.VendorName || route.params.vendorName || '');
const detailTableRef = ref<HTMLElement | null>(null);
const allLotRows = computed(() => receiveStore.detail?.allLotRows || []);
const lotRows = ref<LotRow[]>([]);
const lotStatusIQA = ref<any[]>([]);

// ดึงข้อมูล tableRows จาก API
const tableRows = computed(() => receiveStore.detail?.tableRows || []);

// สร้าง reactive object เพื่อเก็บข้อมูล balance qty ของแต่ละแถว
const rowBalanceQtys = ref<{ [key: string]: number }>({});

// สร้าง reactive object เพื่อเก็บข้อมูล lot split qty ของแต่ละแถว
const rowLotSplitQtys = ref<{ [key: string]: number }>({});

// ฟังก์ชันสำหรับคำนวณและอัปเดต Lot Split QTY ของแต่ละแถว
async function updateRowLotSplitQtys() {
    const lotSplitQtys: { [key: string]: number } = {};

    for (const row of tableRows.value) {
        const key = `${row.itemNo}_${row.no}`;

        try {
            // ดึงข้อมูล Lot Split ที่มีอยู่
            const existingLotSplits = await receiveStore.fetchLotSplitByRecAndItem({
                receiveno: receiveNumber.value,
                itemNo: row.itemNo || ''
            } as any);

            // นับจำนวน Lot ที่แบ่ง (จำนวน records/items) ไม่ใช่รวม quantity
            const lotCount = existingLotSplits?.length || 0;

            lotSplitQtys[key] = lotCount;
        } catch (error) {
            console.error('Error calculating lot split qty:', error);
            lotSplitQtys[key] = 0;
        }
    }

    rowLotSplitQtys.value = lotSplitQtys;
}

// ฟังก์ชันสำหรับคำนวณและอัปเดต Balance QTY ของแต่ละแถว
async function updateRowBalanceQtys() {
    const balances: { [key: string]: number } = {};

    for (const row of tableRows.value) {
        const key = `${row.itemNo}_${row.no}`;
        balances[key] = await calculateRowBalanceQtyWithLot(row);
    }

    rowBalanceQtys.value = balances;

    // อัปเดต Lot Split QTY พร้อมกัน
    await updateRowLotSplitQtys();
}

// ฟังก์ชันสำหรับดึง Balance QTY ของแถวที่ระบุ

const filteredRows = computed(() => {
    const rows = tableRows.value;
    if (!searchQuery.value) return rows;
    const q = searchQuery.value.toLowerCase();
    return rows.filter(
        (row: any) =>
            row.no?.toString().includes(q) ||
            row.itemNo?.toLowerCase().includes(q) ||
            row.description?.toLowerCase().includes(q) ||
            row.unit?.toLowerCase().includes(q) ||
            row.lotExpireDate?.includes(q) ||
            row.invoice?.toLowerCase().includes(q) ||
            row.iqaStatus?.toLowerCase().includes(q)
    );
});


// สำหรับ scroll กลับไปยังตาราง Detail
onMounted(async () => {
    const receiveNumber = (route.query.receiptNumber as string) || (route.params.receiveNumber as string);
    const InvoiceNumber = (route.query.InvoiceNumber as string) || '';
    const RecReceiveDate = (route.query.RecReceiveDate as string) || '';
    const VendorName = (route.query.VendorName as string) || '';

    loading.value = true;
    const response = await receiveStore.getComponents(receiveNumber);
    // const lotStatusIQAResponse = await receiveStore.fetchLotStatusIQA(defaultIQAStatusID);
    // lotStatusIQA.value = lotStatusIQAResponse;

    // console.log('lotStatusIQAResponse:', lotStatusIQAResponse);
    console.log('lotStatusIQA:', lotStatusIQA.value);
    console.log('receiveNumber:', receiveNumber);
    console.log('lotStatusIQA length:', lotStatusIQA.value.length);

    console.log('InvoiceNumber:', InvoiceNumber);
    console.log('RecReceiveDate:', RecReceiveDate);
    console.log('VendorName:', VendorName);
    console.log('getComponents response:', response);

    // นำข้อมูล response (array) ไปใส่ใน tableRows เพื่อแสดงใน DataTable
    if (Array.isArray(response)) {
        receiveStore.detail = {
            ...receiveStore.detail,
            tableRows: response.map((row, idx) => ({
                no: idx + 1,
                itemNo: row.ITEMNO ?? '',
                description: row.ITEMDESC ?? '',
                unit: row.UNIT ?? '',
                receiveQty: row.RQRECEIVED ?? '',
                lotExpireDate: row.LotExpireDate ?? '',
                invoice: row.Invoice ?? '',
                iqaStatus: row.IQAStatus ?? '',
                takeOutQty: row.takeOutQty ?? '',
                returnQty: row.returnQty ?? '',
                balanceQty: row.balanceQty ?? '',
                lotSplitStatusIdx: row.lotSplitStatusIdx ?? '',
                lotSplit: row.LotSplit ?? '',
                ExpDate: row.ExpDate ?? '',
                IQA: row.IQA ?? ''
            }))
        };

        // คำนวณ Balance QTY สำหรับแต่ละแถว
        await updateRowBalanceQtys();
    }
    loading.value = false;
    console.log('getComponents called with:', 'receiveNumber:', receiveNumber);
});

const goBack = () => {
    router.back();
};

function getReturnQty(receiveQty: number | string, returnQty: number | string) {
    const r = parseFloat(receiveQty as string) || 0;
    const t = parseFloat(returnQty as string) || 0;
    return Math.max(t + r, 0);
} //ไม่ต้องมีก็ได้

function calculateBalanceQty() {
    if (dialogRowIndex.value === null) return 0;

    const receiveQty = parseFloat(tableRows.value[dialogRowIndex.value]?.receiveQty || '0') || 0;
    const totalTakeOutQty = lotRows.value.reduce((sum, row) => {
        return sum + (parseFloat(String(row.takeOutQty || '0')) || 0);
    }, 0);

    // ห้ามใส่เกิน receiveQty
    if (totalTakeOutQty > receiveQty) {
        return 0;
    }

    return Math.max(receiveQty - totalTakeOutQty, 0);
}



// ฟังก์ชันใหม่สำหรับคำนวณ Balance QTY แบบ async ที่ดึงข้อมูล Lot Split มาคำนวณ
async function calculateRowBalanceQtyWithLot(data: any) {
    try {
        const receiveQty = parseFloat(data.receiveQty || '0') || 0;
        const returnQty = parseFloat(data.returnQty || '0') || 0;

        // ดึงข้อมูล Lot Split ที่มีอยู่
        const existingLotSplits = await receiveStore.fetchLotSplitByRecAndItem({
            receiveno: receiveNumber.value,
            itemNo: data.itemNo || ''
        } as any);

        // คำนวณจำนวนที่แบ่งไปแล้ว
        const totalLotSplitQty =
            existingLotSplits?.reduce((sum: number, lot: any) => {
                return sum + (parseFloat(lot.lot_qty || '0') || 0);
            }, 0) || 0;

        // Balance = Receive - Return - Total Lot Split Qty
        return Math.max(receiveQty - returnQty - totalLotSplitQty, 0);
    } catch (error) {
        console.error('Error calculating balance with lot splits:', error);
        // ถ้าเกิด error ให้คำนวณแบบปกติ
        const receiveQty = parseFloat(data.receiveQty || '0') || 0;
        const returnQty = parseFloat(data.returnQty || '0') || 0;
        return Math.max(receiveQty - returnQty, 0);
    }
}


function getIQAStatusText(iqa: number | string | null | undefined) {
    if (iqa === 0 || iqa === '0') return 'No IQA Required';
    if (iqa === 1 || iqa === '1') return 'IQA Required';
    if (iqa === 2 || iqa === '2' || iqa === null || iqa === undefined || iqa === '') return 'Not Specified';
    return 'Not Specified';
}

function getIQARequiredClass(text: string) {
    switch (text) {
        case 'IQA Required':
            return 'bg-red-100 text-red-700 font-semibold transition-colors duration-200 px-2 py-1 rounded';
        case 'No IQA Required':
            return 'bg-green-100 text-green-700 font-semibold transition-colors duration-200 px-2 py-1 rounded';
        case 'Not Specified':
            return 'bg-amber-100 text-amber-700 font-semibold transition-colors duration-200 px-2 py-1 rounded border border-amber-300';
        default:
            return 'bg-white text-gray-900 transition-colors duration-200 px-2 py-1 rounded border';
    }
}

function getLotSplitStatusText(lotSplit: number | string) {
    if (lotSplit === 0 || lotSplit === '0') return 'No Lot Required';
    if (lotSplit === 1 || lotSplit === '1') return 'Lot Required';
    return 'Not Specified';
}
function getLotSplitStatusClass(status: string) {
    switch (status) {
        case 'Lot Required':
            return 'bg-red-100 text-red-700 font-semibold transition-colors duration-200';
        case 'No Lot Required':
            return 'bg-green-100 text-green-700 font-semibold transition-colors duration-200';
        case 'Not Specified':
            return 'bg-gray-100 text-gray-700 font-semibold transition-colors duration-200';
        default:
            return 'bg-white text-gray-900 transition-colors duration-200';
    }
}

// Lot rows state for dialog (แยกแต่ละแถว)





function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS },
        unit: { value: null, matchMode: FilterMatchMode.EQUALS },
        lotExpireDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS },
        invoice: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        iqaStatus: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}
</script>

<template>
    <div class="card mb-6">
        <Button icon="pi pi-arrow-left" @click="goBack" severity="secondary" outlined />
        <div class="flex items-center gap-4 mb-4">
            <div class="text-2xl font-bold">Receive Material Detail</div>
        </div>
        <!-- card Detail -->
        <div class="flex space-x-4 flex-col sm:flex-row justify-center items-stretch gap-8 mt-2">
            <div class="grid grid-cols-2 gap-4">
                <div class="ml-1">
                    <span class="inline-block text-muted-color font-medium mr-2">Receive Number:</span>
                    <span class="inline-block font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">{{ receiveNumber }}</span>
                </div>
                <div>
                    <span class="inline-block text-muted-color font-medium mr-2">Receive Date:</span>
                    <span class="inline-block font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">{{ receiveDate }}</span>
                </div>

                <div class="ml-1">
                    <span class="inline-block text-muted-color font-medium mb-2 mr-2">Invoice Number:</span>
                    <span class="inline-block font-semibold mb-2 bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">{{ invoiceNumber }}</span>
                </div>
                <div class="ml-1">
                    <span class="inline-block text-muted-color font-medium mb-2 mr-2">Special Exp:</span>
                    <span class="inline-block font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">{{ specialExpDate }}</span>
                </div>
            </div>

            <div class="grid justify-items-end sm:justify-items-start sm:flex-1 sm:flex sm:justify-end gap-4">
                <div class="flex justify-center flex-1 sm:justify-start mt-2">
                    <div class="mb-1">
                        <span class="inline-block text-muted-color font-medium mb-1 mr-2">Vendor Details:</span>
                        <span class="inline-block font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">{{ vendorName }}</span>
                    </div>

                    <div class="ml-4">
                        <span class="inline-block text-muted-color font-medium mb-1 mr-2">Contact:</span>
                        <span class="inline-block font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded cursor-pointer select-text">-</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card mb-6">
        <div class="font-semibold text-xl mb-2">Receive Material List</div>

        <DataTable
            ref="detailTableRef"
            :value="filteredRows"
            v-model:filters="filters"
            v-model:selection="selectedRows"
            paginator
            :rows="10"
            dataKey="no"
            filterDisplay="menu"
            :loading="loading"
            loadingIcon="pi pi-spin pi-spinner"
            loadingTemplate="กำลังโหลดข้อมูล..."
            showGridlines
            rowHover
            :globalFilterFields="['no', 'itemNo', 'description', 'unit', 'lotExpireDate', 'invoice', 'iqaStatus']"
            class="mb-6"
        >
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>

            <Column field="itemNo" header="Item No" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by item no" />
                </template>
            </Column>

            <Column field="description" header="Description" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by description" />
                </template>
            </Column>



            <Column field="receiveQty" header="Receive(QTY)" sortable>
                <template #body="{ data }">
                    {{ getReturnQty(data.receiveQty, data.returnQty) }}
                </template>
            </Column>
                        <Column field="unit" header="Unit" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by unit" />
                </template>
            </Column>

            <Column field="lotSplitStatusIdx" header="Lot Split Status" sortable>
                <template #body="{ data }">
                    <span :class="getLotSplitStatusClass(getLotSplitStatusText(data.lotSplit))">
                        {{ getLotSplitStatusText(data.lotSplit) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="['Lot Required', 'No Lot Required', 'Not Specified']" placeholder="Select Status">
                        <template #value="{ value }">
                            <span :class="getLotSplitStatusClass(value)">{{ value }}</span>
                        </template>
                        <template #option="{ option }">
                            <span :class="getLotSplitStatusClass(option)">{{ option }}</span>
                        </template>
                    </Dropdown>
                </template>
            </Column>

            <Column field="iqaRequirement" header="IQA Requirement" sortable>
                <template #body="{ data }">
                    <span :class="getIQARequiredClass(getIQAStatusText(data.IQA))">
                        {{ getIQAStatusText(data.IQA) }}
                    </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>
