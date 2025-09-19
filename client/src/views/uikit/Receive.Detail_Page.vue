<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, reactive, ref, toRefs, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { IReceiveDetailItem, LotRow, LotRowEx } from '@/interfaces/receive.interfaces';
import { useRoute } from 'vue-router';

const receiveStore = useReceiveStore();
const router = useRouter();
const toast = useToast();
const confirmPopup = useConfirm();
const loading = ref(false);
const route = useRoute();

// const receiveNumber = route.params.receiveNumber;
const expireDate = ref('');

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
const lotSplitStatusList = reactive([{ value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }]);
const allLotRows = computed(() => receiveStore.detail?.allLotRows || []);
const lotRows = ref<LotRowEx[]>([]);
const lotStatusIQA = ref<any[]>([]);

// ดึงข้อมูล tableRows จาก API
const tableRows = computed(() => receiveStore.detail?.tableRows || []);

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
    const defaultIQAStatusID = 1;

    const receiveNumber = (route.query.receiptNumber as string) || (route.params.receiveNumber as string);
    const StatusRecIC = Number(route.query.StatusRecIC);
    const InvoiceNumber = (route.query.InvoiceNumber as string) || '';
    const RecReceiveDate = (route.query.RecReceiveDate as string) || '';
    const VendorName = (route.query.VendorName as string) || '';

    loading.value = true;
    const response = await receiveStore.getComponents(receiveNumber, StatusRecIC);
    const lotStatusIQAResponse = await receiveStore.fetchLotStatusIQA(defaultIQAStatusID);
    lotStatusIQA.value = lotStatusIQAResponse;

    console.log('lotStatusIQAResponse:', lotStatusIQAResponse);
    console.log('lotStatusIQA:', lotStatusIQA.value);
    console.log('receiveNumber:', receiveNumber);
    console.log('lotStatusIQA length:', lotStatusIQA.value.length);
    console.log('StatusRecIC:', StatusRecIC);
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

                // เพิ่ม field อื่นๆ ตามหัวข้อที่ต้องการ
            }))
        };
    }
    loading.value = false;
    console.log('getComponents called with:', 'receiveNumber:', receiveNumber, 'StatusRecIC:', StatusRecIC);
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
        return sum + (parseFloat(row.takeOutQty || '0') || 0);
    }, 0);

    // ห้ามใส่เกิน receiveQty
    if (totalTakeOutQty > receiveQty) {
        return 0;
    }

    return Math.max(receiveQty - totalTakeOutQty, 0);
}

function getIQAStatusText(iqa: number | string | null | undefined) {
    if (iqa === 0 || iqa === '0') return 'No IQA Required';
    if (iqa === 1 || iqa === '1') return 'IQA Required';
    if (iqa === 2 || iqa === '2' || iqa === null || iqa === undefined || iqa === '') return 'Not Specified';
    return 'Not Specified';
}
function canEditIQA(iqa: number | string | null | undefined) {
    // สามารถแก้ไขได้เมื่อค่าเป็น Not Specified (2, '2', null, undefined, หรือ '')
    return iqa === 2 || iqa === '2' || iqa === null || iqa === undefined || iqa === '';
}
function updateIQAValue(data: any, val: string) {
    if (canEditIQA(data.IQA)) {
        switch (val) {
            case 'IQA Required':
                data.IQA = 1;
                break;
            case 'No IQA Required':
                data.IQA = 0;
                break;
            case 'Not Specified':
                data.IQA = 2;
                break;
            default:
                data.IQA = 2;
        }

        // แสดงข้อความแจ้งเตือนเมื่อผู้ใช้เปลี่ยนค่า
        toast.add({
            severity: 'info',
            summary: 'Updated',
            detail: `IQA Requirement changed to: ${val}`,
            life: 2000
        });
    }
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

function getIQAStatusClass(status: number | string) {
    // รับค่า lotStatusIQAResponse จาก API
    // สมมติ lotStatusIQA เป็น array ของ object เช่น [{ IQAStatusName: 'PENDING', ... }]
    // ถ้า status เป็นตัวเลข ให้หาใน lotStatusIQA ว่าตรงกับ IQAStatusID ไหน
    let statusName = String(status);
    if (typeof status === 'number' && lotStatusIQA.value.length) {
        const found = lotStatusIQA.value.find((s) => s.IQAStatusID === status);
        statusName = found ? found.IQAStatusName : statusName;
    }
    switch (statusName?.toUpperCase()) {
        case 'UNCHECKED':
            return 'bg-gray-100 text-gray-700 font-semibold px-2 py-1 rounded';
        case 'UNDER_REVIEW':
            return 'bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded';
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded';
        case 'APPROVED':
            return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
        case 'REJECTED':
            return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
        case 'CANCELLED':
            return 'bg-orange-200 text-orange-700 font-semibold px-2 py-1 rounded';
        case 'RESUBMITTED':
            return 'bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded';
        default:
            return 'bg-white text-gray-900 px-2 py-1 rounded';
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

function expireDateEnd(date: string) {
    if (!date) return '';
    const today = new Date();
    const expire = new Date(date);
    const diffTime = expire.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // คำนวณจำนวนวัน
    if (diffDays < 0) {
        return 'bg-red-200 text-red-700 font-semibold px-2 py-1 rounded'; // หมดอายุ
    } else if (diffDays <= 15) {
        return 'bg-yellow-200 text-yellow-700 font-semibold px-2 py-1 rounded'; // ใกล้หมดอายุ
    }
    return '';
}
// ข้อมูล lotRows จาก API (เช่น receiveStore.detail.lotRows)

function openEditDialog(rowIndex: number) {
    dialogRowIndex.value = rowIndex;
    // clone ข้อมูลมาแก้ไขจาก API
    lotRows.value = allLotRows.value[rowIndex]?.map((row: LotRowEx) => ({ ...row })) || [];
    isDialogOpen.value = true;
}

function closeEditDialog(save = false) {
    if (save && dialogRowIndex.value !== null) {
        // เซฟกลับไปที่ allLotRows
        allLotRows[dialogRowIndex.value] = lotRows.value.map((row) => ({ ...row }));
    }
    isDialogOpen.value = false;
    dialogRowIndex.value = null;
    lotRows.value = [];
    // scroll กลับไปยังตาราง Detail
    nextTick(() => {
        if (detailTableRef.value) {
            detailTableRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function addRow() {
    // ดึง unit จากแถวที่เลือกใน dialog
    let unit = '';
    if (dialogRowIndex.value !== null) {
        unit = tableRows.value[dialogRowIndex.value]?.unit || '';
    }
    lotRows.value.push({ no: '', lotNo: '', qty: '', unit, expireDate: '' });
}

function removeRow(index: number) {
    if (lotRows.value.length > 1) {
        lotRows.value.splice(index, 1);
    }
}

function confirm(event) {
    confirmPopup.require({
        target: event.target,
        message: 'Are you sure you want to proceed?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Save'
        },
        accept: () => {
            toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
            closeEditDialog(true);
        },
        reject: () => {
            toast.add({ severity: 'warn', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
            closeEditDialog(true);
        }
    });
}

function Success() {
    // เมื่อกด Submit ให้เปลี่ยน IQA Status เฉพาะแถวที่เลือก
    (async () => {
        const lotStatusIQAResponse = await receiveStore.fetchLotStatusIQA(2);
        // อัปเดต IQA Status เฉพาะแถวที่เลือก
        selectedRows.value.forEach((row) => {
            row.iqaStatus = lotStatusIQAResponse[0]?.IQAStatusName || 'PENDING';
        });
        console.log('lotStatusIQAResponse_Success:', lotStatusIQAResponse);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Submitted to IQA', life: 3000 });
    })();
}

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

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column field="no" header="No" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by no" />
                </template>
            </Column>

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

            <Column field="unit" header="Unit" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by unit" />
                </template>
            </Column>

            

            <Column field="receiveQty" header="Receive QTY" sortable>
                <template #body="{ data }">
                    {{ getReturnQty(data.receiveQty, data.returnQty) }}
                </template>
            </Column>

            <Column field="returnQty" header="Return QTY" sortable>
                <template #body>0</template>
            </Column>

           
            <Column field="lotExpireDate" header="Expire Date" sortable :style="{ minWidth: '200px' }">
                <template #body="{ data }">
                    <div v-if="data.ExpDate === 0" class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 font-semibold rounded px-2 py-1">No Expiration</div>
                    <div v-else :class="[expireDateEnd(data.lotExpireDate), 'w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'rounded']">
                        <Calendar v-model="data.lotExpireDate" dateFormat="yy-mm-dd" :showIcon="true" :showButtonBar="true" class="w-full" :baseZIndex="1000" />
                    </div>
                </template>
                000000
                <template #filter="{ filterModel }">
                    <Calendar v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="Select Date" :showButtonBar="true" class="w-full" />
                </template>
            </Column>
            <Column field="lotSplitStatusIdx" header="Lot Split Status" sortable>
                <template #body="{ data }">
                    <Dropdown
                        :modelValue="getLotSplitStatusText(data.lotSplit)"
                        @update:modelValue="(val) => (data.lotSplit = val === 'Lot Required' ? 1 : val === 'No Lot Required' ? 0 : '')"
                        :options="['Lot Required', 'No Lot Required', 'Not Specified']"
                        :disabled="data.lotSplit !== 2"
                        :pt="{
                            root: { class: 'w-full' },
                            input: {
                                class: 'w-full ' + getLotSplitStatusClass(getLotSplitStatusText(data.lotSplit)) + (data.lotSplit !== 2 ? ' opacity-50 cursor-not-allowed' : '')
                            }
                        }"
                    >
                        <template #value="{ value }">
                            <span :class="getLotSplitStatusClass(value)">
                                {{ value }}
                            </span>
                        </template>
                        <template #option="{ option }">
                            <span :class="getLotSplitStatusClass(option)">
                                {{ option }}
                            </span>
                        </template>
                    </Dropdown>
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

            <Column field="iqaStatus" header="IQA Status" sortable>
                <template #body="{ data }">
                    <span :class="getIQAStatusClass(data.iqaStatus || 'PENDING')">
                        {{ data.iqaStatus || 'PENDING' }}
                    </span>
                </template>
            </Column>

            <Column field="iqaRequirement" header="IQA Requirement" sortable>
                <template #body="{ data }">
                    <Dropdown
                        :modelValue="getIQAStatusText(data.IQA)"
                        @update:modelValue="(val) => updateIQAValue(data, val)"
                        :options="['IQA Required', 'No IQA Required', 'Not Specified']"
                        :disabled="!canEditIQA(data.IQA)"
                        :pt="{
                            root: { class: 'w-full' },
                            input: {
                                class: 'w-full ' + getIQARequiredClass(getIQAStatusText(data.IQA)) + (!canEditIQA(data.IQA) ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer')
                            }
                        }"
                    >
                        <template #value="{ value }">
                            <span :class="getIQARequiredClass(value)">
                                {{ value }}
                            </span>
                        </template>
                        <template #option="{ option }">
                            <span :class="getIQARequiredClass(option)">
                                {{ option }}
                            </span>
                        </template>
                    </Dropdown>
                </template>
                <template #filter="{ filterModel }">
                    <Dropdown v-model="filterModel.value" :options="['IQA Required', 'No IQA Required', 'Not Specified']" placeholder="Select Requirement">
                        <template #value="{ value }">
                            <span :class="getIQARequiredClass(value)">{{ value }}</span>
                        </template>
                        <template #option="{ option }">
                            <span :class="getIQARequiredClass(option)">{{ option }}</span>
                        </template>
                    </Dropdown>
                </template>
            </Column>

            <Column header="Action">
                <template #body="{ data, index }">
                    <Button icon="pi pi-pencil" @click="openEditDialog(index)" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-end">
            <ConfirmPopup></ConfirmPopup>
            <Button ref="popup" @click="Success()" icon="pi pi-check" label="Submit to IQA" class="mr-2" :disabled="!selectedRows.length"></Button>
        </div>

        <div v-if="isDialogOpen" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-muted-color font-medium">Item No:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded select-text">
                                {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.itemNo : '' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-muted-color font-medium">Description:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded select-text">
                                {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.description : '' }}
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-muted-color font-medium">Receive QTY:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded select-text">
                                {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.receiveQty : '' }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-muted-color font-medium">Unit:</span>
                            <span class="font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded select-text">
                                {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.unit : '' }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-lg font-semibold mb-4">Lot Information</div>
                <div class="overflow-x-auto mb-4">
                    <table class="min-w-full border border-gray-300">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="border px-2 py-1">No</th>
                                <th class="border px-2 py-1">Lot No</th>      
                                <th class="border px-2 py-1">UNIT</th>
                                <th class="border px-2 py-1">TAKE OUT QTY</th>
                                <th class="border px-2 py-1">EXPIRE DATE</th>
                                <th class="border px-2 py-1">have a problem?</th>
                                <th class="border px-2 py-1">REMARK</th>
                                <th class="border px-2 py-1">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="(row, idx) in lotRows" :key="idx">
                                <td class="border px-2 py-1">
                                    {{ idx + 1 }}
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="text" class="border rounded px-2 py-1 w-24" placeholder="Lot No" v-model="row.lotNo" />
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="text" class="border rounded px-2 py-1 w-16" placeholder="Unit" v-model="row.unit" />
                                </td>
                                <td class="border px-2 py-1">
                                    <input
                                        type="number"
                                        min="0"
                                        :max="dialogRowIndex !== null && tableRows.value && tableRows.value[dialogRowIndex] ? tableRows.value[dialogRowIndex].receiveQty : ''"
                                        class="border rounded px-2 py-1 w-16"
                                        placeholder="TAKE OUT QTY"
                                        v-model="row.takeOutQty"
                                        step="any"
                                        @input="
                                            if (dialogRowIndex !== null && parseFloat(row.takeOutQty || '') > (parseFloat(tableRows.value[dialogRowIndex].receiveQty || '') || 0)) {
                                                row.takeOutQty = (parseFloat(tableRows.value[dialogRowIndex].receiveQty || '') || 0).toString();
                                                toast.add({ severity: 'warn', summary: 'Warning', detail: 'Take Out Qty ห้ามเกิน Receive Qty', life: 2000 });
                                            }
                                        "
                                    />
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="date" class="border rounded px-2 py-1 w-36" v-model="row.expireDate" :class="expireDateEnd(row.expireDate)" />
                                </td>
                                <td class="border px-2 py-1">
                                    <Checkbox :id="'checkOption' + idx" name="option" :value="true" v-model="row.problem" />
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="text" class="border rounded px-2 py-1 w-36" v-model="row.remark" />
                                </td>
                                <td class="border px-2 py-1 text-center">
                                    <Button label="Delete" icon="pi pi-trash" severity="danger" style="width: auto" @click="removeRow(idx)" />
                                </td>
                            </tr>
                        </tbody>

                       <tfoot>
    <tr>
        <td colspan="8" class="text-left font-semibold py-2 pl-4">
            Balance QTY: {{ calculateBalanceQty() }} / {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.receiveQty : '' }}
        </td>
    </tr>
</tfoot>
                    </table>
                </div>
                <div class="flex justify-end gap-2">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded" @click="addRow">+ Add Row</button>
                    <button class="px-4 py-2 bg-red-500 text-white rounded" @click="closeEditDialog()">Cancel</button>
                    <ConfirmPopup></ConfirmPopup>
                    <Button ref="popup" @click="confirm($event)" icon="pi pi-check" label="Save" class="mr-2"></Button>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"></div>
                </div>
            </div>
        </div>
    </div> 
</template>
