<script setup lang="ts">
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, reactive, ref, toRefs, nextTick, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { useMaterialSplit } from '@/stores/split_material';
import { IReceiveDetailItem, LotRow, IReceiveItem } from '@/interfaces/receive.interfaces';
import { getIQAStatusText, getIQARequiredClass, getLotSplitStatusText, getLotSplitStatusClass } from '@/stores/recive_material';
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';

// Add missing PrimeVue imports
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { s, c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const router = useRouter();
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
console.log('iqaCheckMaterialStore:', iqaCheckMaterialStore);
const route = useRoute();
const detailTableScrollRef = ref<HTMLElement | null>(null);
const confirmPopup = useConfirm();
const toast = useToast();


// Use the composable to get all necessary variables and functions
const {
    receiveStore, 
    loading,
    isDialogOpen,
    dialogRowIndex,
    selectedRows,
    receiveNumber,
    receiveDate,
    invoiceNumber,
    
    specialExpDate,
    vendorName,
    detailTableRef,
    lotRows,
    lotStatusIQA,
    tableRows,
    filteredRows,
    allLotRows,
    canAddRow,
    calculateBalanceQty,
    updateRowLotSplitQtys,
    addRow,
    handleUpdateLotSplit,
    getRowLotSplitQty,
    updateRowBalanceQtys,
    getRowBalanceQty,
    color_BalanceQty,
    getIQAStatusClass,
    expireDateEnd,
    saveLotSplit,
    getReturnQty,
   
} = useMaterialSplit();

// Add isLotSplitRequired function for template usage
function isLotSplitRequired() {
    if (dialogRowIndex.value !== null && tableRows.value && tableRows.value[dialogRowIndex.value]) {
        const lotSplit = tableRows.value[dialogRowIndex.value].lotSplit;
        return lotSplit === 1 || lotSplit === '1';
    }
    return false;
}

// Add isExpireDateRequired function for template usage
function isExpireDateRequired() {
    if (dialogRowIndex.value !== null && tableRows.value && tableRows.value[dialogRowIndex.value]) {
        const expDate = tableRows.value[dialogRowIndex.value].ExpDate;
        return expDate === 1 || expDate === '1';
    }
    return false;
}

const searchQuery = ref('');

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

// ฟังก์ชันสำหรับดึง Lot Split QTY ของแถวที่ระบุ

// สำหรับ scroll กลับไปยังตาราง Detail
onMounted(async () => {
    const receiveNumber = (route.query.receiptNumber as string) || (route.params.receiveNumber as string);
    const InvoiceNumber = (route.query.InvoiceNumber as string) || '';
    const RecReceiveDate = (route.query.RecReceiveDate as string) || '';
    const VendorName = (route.query.VendorName as string) || '';

    loading.value = true;
    const response = await receiveStore.Components_Split(InvoiceNumber);
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
                PORHSEQ: row.PORHSEQ ?? '',
                lotSplitStatusIdx: row.lotSplitStatusIdx ?? '',
                lotSplit: row.LotSplit ?? 0,
                ExpDate: row.ExpDate ?? '',
                IQA: row.IQA ?? '',
                status: row.status ?? 'PENDING',
                Description: row.Description ?? '',
                remark_iqa: row.remark_iqa ?? ''
            }))
        };

        // คำนวณ Balance QTY สำหรับแต่ละแถว
        await updateRowBalanceQtys();
    }
    loading.value = false;
    console.log('getComponents called with:', 'receiveNumber:', receiveNumber);
});

const goBack = () => {
    router.push({ path: '/materials-split', query: { page: route.query.page } });
};
async function openEditDialog(rowIndex: number) {
    dialogRowIndex.value = rowIndex;
    const currentRow = tableRows.value[rowIndex];

    try {
        loading.value = true;

        const existingLotSplits = await receiveStore.fetchLotSplitByRecAndItem({
            receiveno: receiveNumber.value,
            itemNo: currentRow?.itemNo || ''
        } as any);

        console.log('Existing Lot Splits:', existingLotSplits);

        if (existingLotSplits && existingLotSplits.length > 0) {
            lotRows.value = existingLotSplits.map((row: any) => ({
                id: row.id,
                no: '',
                lotNo: row.lot_no || '',
                qty: parseFloat(row.lot_qty || '0') || 0,
                unit: row.lot_unit || currentRow?.unit || '',
                expireDate: row.exp_date ? new Date(row.exp_date).toISOString().split('T')[0] : '',
                takeOutQty: parseFloat(row.lot_qty || '0') || 0,
                problem: !!row.isProblem,
                InvoiceNumber: row.InvoiceNumber || '',
                remark: row.remark || ''
            }));
        } else {
            // Check if lot splitting is required
            const isLotSplitRequired = currentRow?.lotSplit === 1 || currentRow?.lotSplit === '1';
            const receiveQty = parseFloat(currentRow?.receiveQty || '0') || 0;
            
            lotRows.value = [
                {
                    id: null,
                    no: '',
                    lotNo: isLotSplitRequired ? '' : 'N/A', // เพิ่มตรงนี้
                    qty: 0,
                    unit: currentRow?.unit || '',
                    expireDate: '',
                    // If lot split required, start with 0, if not required, pre-fill with full receive quantity
                    takeOutQty: isLotSplitRequired ? 0 : receiveQty,
                    problem: false,
                    remark: ''
                }
            ];
        }
    } catch (error) {
        console.error('Error fetching lot split data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load existing lot split data',
            life: 3000
        });

        const currentRow = tableRows.value[rowIndex];
        const isLotSplitRequired = currentRow?.lotSplit === 1 || currentRow?.lotSplit === '1';
        const receiveQty = parseFloat(currentRow?.receiveQty || '0') || 0;

        lotRows.value = [
            {
                id: null,
                no: '',
                lotNo: isLotSplitRequired ? '' : 'N/A', // เพิ่มตรงนี้
                qty: 0,
                unit: currentRow?.unit || '',
                expireDate: '',
                // If lot split required, start with 0, if not required, pre-fill with full receive quantity
                takeOutQty: isLotSplitRequired ? 0 : receiveQty,
                problem: false,
                remark: ''
            }
        ];
    } finally {
        loading.value = false;
        isDialogOpen.value = true;
    }

}

async function closeEditDialog(save = false) {
    if (save && dialogRowIndex.value !== null) {
        // เซฟกลับไปที่ allLotRows
        allLotRows[dialogRowIndex.value] = lotRows.value.map((row) => ({ ...row }));

        // อัปเดต Balance QTY ใหม่หลังจากบันทึก Lot Split
        await updateRowBalanceQtys();
    }
    isDialogOpen.value = false;
    dialogRowIndex.value = null;
    lotRows.value = [];
    // scroll กลับไปยังตาราง Detail
    nextTick(() => {
    if (detailTableScrollRef.value) {
        detailTableScrollRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
}


async function removeRow(index: number) {
    const lotRow = lotRows.value[index];

    // ถ้า row มี id แสดงว่าเป็นข้อมูลที่มีอยู่ในฐานข้อมูล ต้องลบจริง
    if (lotRow.id) {
        try {
            loading.value = true;

            // เรียก API delete
           
            const deleteResult = await receiveStore.Delete_LotSplit({
                invoiceNumber: invoiceNumber.value,
                itemNo: dialogRowIndex.value !== null ? tableRows.value[dialogRowIndex.value]?.itemNo || '' : '',
                lotNo: lotRow.lotNo
            } as any);

            console.log('deleteResult:', deleteResult);

            // ถือว่าสำเร็จถ้าไม่มี error throw (ไม่ต้องเช็ค deleteResult)
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Lot split deleted successfully',
                life: 3000
            });

            // ลบ row จาก array
            lotRows.value.splice(index, 1);

            // อัปเดต Balance QTY ใหม่
            if (dialogRowIndex.value !== null) {
                await updateRowBalanceQtys();
            }
        } catch (error) {
            console.error('Error deleting lot split:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to delete lot split: ${String(error)}`,
                life: 3000
            });
        } finally {
            loading.value = false;
        }
    } else {
        // ถ้าไม่มี id แสดงว่าเป็นข้อมูลใหม่ที่ยังไม่ได้บันทึก แค่ลบจาก array
        if (lotRows.value.length > 1) {
            lotRows.value.splice(index, 1);
        }
    }
}





function confirmDelete(index: number, event?: Event) {
    const lotRow = lotRows.value[index];

    confirmPopup.require({
        target: event?.target as HTMLElement,
        message: lotRow.id ? `Are you sure you want to delete Lot ${lotRow.lotNo}? This will permanently remove it from the database.` : 'Are you sure you want to remove this row?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: async () => {
            await removeRow(index);
        }
    });
}

function confirm(event: Event) {
    console.log('🔍 confirm function called');
    confirmPopup.require({
        target: event.target as HTMLElement,
        message: 'Are you sure you want to save the lot split data?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Save'
        },
        accept: async () => {
            console.log('✅ User accepted, calling saveLotSplit');
            await saveLotSplit();
        },
        reject: () => {
            console.log('❌ User rejected');
            toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Operation cancelled', life: 3000 });
        }
    });
}
function canSubmitToIQA(row: any) {
    // ถ้าต้องแบ่ง lot (lotSplit = 1) ต้องแบ่งครบ (balanceQty = 0)
    if (row.lotSplit === 1 || row.lotSplit === '1') {
        return getRowBalanceQty(row) === 0;
    }
    // ถ้าไม่ต้องแบ่ง lot แต่ต้องส่ง IQA (IQA = 1 หรือ '1')
    if (row.IQA === 1 || row.IQA === '1') {
        return true;
    }
    return false;
}
function canSubmitSelected() {
    // ส่งได้เฉพาะแถวที่ผ่านเงื่อนไขทุกแถว
    return selectedRows.value.length > 0 && selectedRows.value.every(canSubmitToIQA);
}
function Success(event?: Event) {
    const validRows = selectedRows.value.filter(row => {
        const lots = allLotRows[row.no - 1] || [];
        return lots.every(lot => !lot.problem);
    });
    const hasProblemLot = selectedRows.value.some(row => {
        const lots = allLotRows[row.no - 1] || [];
        return lots.some(lot => lot.problem);
    });
    if (hasProblemLot) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'ไม่สามารถส่ง IQA ได้ เนื่องจากมี Lot ที่มีปัญหา',
            life: 3000
        });
        return;
    }

    const canSend = validRows.every(canSubmitToIQA);
    if (!canSend || validRows.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'เลือกได้เฉพาะรายการที่แบ่ง lot ครบ หรือไม่ต้องแบ่งแต่ต้องส่ง IQA และ lot ต้องไม่มีปัญหา',
            life: 3000
        });
        return;
    }
    confirmPopup.require({
        target: event?.target as HTMLElement,
        message: 'Are you sure you want to submit selected items to IQA?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Submit',
            severity: 'success'
        },
        accept: async () => {
            try {
                for (const row of validRows) { 
                    await iqaCheckMaterialStore.sumIqaItems(invoiceNumber.value, row.itemNo);
                }
                toast.add({ severity: 'success', summary: 'Success', detail: 'ส่ง IQA สำเร็จ', life: 3000 });

                // รีเฟรชข้อมูลหลังส่ง IQA สำเร็จ
                loading.value = true;
                const response = await receiveStore.Components_Split(invoiceNumber.value);
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
                            PORHSEQ: row.PORHSEQ ?? '',
                            lotSplitStatusIdx: row.lotSplitStatusIdx ?? '',
                            lotSplit: row.LotSplit ?? 0,
                            ExpDate: row.ExpDate ?? '',
                            IQA: row.IQA ?? '',
                            status: row.status ?? 'PENDING',
                            Description: row.Description ?? '',
                            remark_iqa: row.remark_iqa ?? ''
                        }))
                    };
                    await updateRowBalanceQtys();
                }
                loading.value = false;
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'ส่ง IQA ไม่สำเร็จ', life: 3000 });
            }
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Operation cancelled', life: 3000 });
        }
    });
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

// Add helper methods for better template organization
function validateTakeOutQty(row: any, idx: number) {
    if (dialogRowIndex.value !== null && isLotSplitRequired()) {
        const currentValue = parseFloat(String(row.takeOutQty || '0')) || 0;
        row.takeOutQty = currentValue;

        const totalTakeOutQty = lotRows.value.reduce((sum, r) => {
            return sum + (parseFloat(String(r.takeOutQty || '0')) || 0);
        }, 0);
        
        const receiveQty = parseFloat(String(tableRows.value[dialogRowIndex.value].receiveQty || '0')) || 0;

        if (totalTakeOutQty > receiveQty) {
            const otherRowsSum = totalTakeOutQty - currentValue;
            const maxAllowed = Math.max(receiveQty - otherRowsSum, 0);
            row.takeOutQty = Number(maxAllowed.toFixed(2));
            toast.add({ 
                severity: 'warn', 
                summary: 'Warning', 
                detail: 'Total Take Out Qty cannot exceed Receive Qty', 
                life: 2000 
            });
        }
    }
}

function canEditExpireDate(row: any): boolean {
    return isExpireDateRequired() && 
           row.lotNo && row.lotNo.trim() !== '' && 
           row.takeOutQty && row.takeOutQty > 0;
}

function getExpireDateClass(row: any){
    const classes = [expireDateEnd(row.expireDate)];
    
    if (!canEditExpireDate(row)) {
        classes.push('bg-gray-100 cursor-not-allowed');
    } else if (isExpireDateRequired() && (!row.expireDate || row.expireDate.trim() === '')) {
        classes.push('border-red-500 bg-red-50');
    }
    return classes.join(' ');
}
function isRowDisabled(row: any) {
    // Return true for rows that should be disabled (gray color)
    return (row.lotSplit !== 1 && row.lotSplit !== '1') && (row.ExpDate !== 1 && row.ExpDate !== '1');
}




function onRowClick(event: any) {
    // ใช้ itemNo หรือ key ที่ unique
    const row = event.data;
    if (isRowDisabled(row)) return; 
    const realIndex = tableRows.value.findIndex(r => r.itemNo === row.itemNo);
    if (realIndex !== -1) {
        openEditDialog(realIndex);
    }
}
async function receiveNoLot(event?: Event) {
    const noLotRows = selectedRows.value.filter(row => {
        return (row.lotSplit !== 1 && row.lotSplit !== '1') && (row.ExpDate !== 1 && row.ExpDate !== '1');
    });

    if (noLotRows.length === 0) {
        toast.add({ severity: 'info', summary: 'Info', detail: 'No items to receive without lot.', life: 2000 });
        return;
    }

    confirmPopup.require({
        target: event?.target as HTMLElement,
        message: 'Are you sure you want to receive selected items without lot?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Receive',
            severity: 'success'
        },
        accept: async () => {
            for (const row of noLotRows) {
                const receiveQty = parseFloat(row.receiveQty || '0') || 0;
                // สร้าง lotRow สำหรับรับ lot
                lotRows.value = [{
                    id: null,
                    no: '',
                    lotNo: 'N/A',
                    qty: receiveQty,
                    unit: row.unit || '',
                    expireDate: '',
                    takeOutQty: receiveQty,
                    problem: false,
                    remark: ''
                }];
                // เซ็ต dialogRowIndex ให้ตรงกับแถวที่กำลังจะบันทึก
                dialogRowIndex.value = tableRows.value.findIndex(r => r.itemNo === row.itemNo);
                // เรียก saveLotSplit เพื่อบันทึก
                await saveLotSplit();
            }
        }
    });
}

// Add computed property to check if Lot Information is editable
const isLotInfoEditable = computed(() => {
    if (dialogRowIndex.value !== null && tableRows.value && tableRows.value[dialogRowIndex.value]) {
        const status = tableRows.value[dialogRowIndex.value].status;
        return !(status === 'UNDER_REVIEW' || status === 'PASS');
    }
    return true;
});
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
            @row-click="onRowClick"
            
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

            <Column field="receiveQty" header="Receive(QTY)" sortable>
                <template #body="{ data }">
                    {{ getReturnQty(data.receiveQty, data.returnQty) }}
                </template>
            </Column>

            <!-- <Column field="returnQty" header="Return QTY" sortable>
                <template #body>0</template>
            </Column> -->

            <Column field="balanceQty" header="Wait Split(QTY)" sortable>
                <template #body="{ data }">
                    <span :class="color_BalanceQty(data)">
                        {{ getRowBalanceQty(data).toFixed(2) }}
                    </span>
                </template>
            </Column>
            <Column field="LotSplit" header="Lot Split(Lot)" sortable>
                <template #body="{ data }">
                    <!-- จำนวน Lot ที่แบ่ง (นับจำนวน items/records) -->
                    {{ getRowLotSplitQty(data) }} lot
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

            <Column field="iqaStatus" header="IQA Status" sortable>
                <template #body="{ data }">
                    <span :class="getIQAStatusClass(data.status || 'PENDING')">
                        {{ data.status || 'PENDING' }}
                    </span>
                </template>
            </Column>
            <!-- <Column field="iqaStatus" header="IQA Status test" sortable>
                <template #body="{ data }">
                    <span>
                        {{ data.Description}}
                    </span>
                </template>
            </Column> -->

            <Column field="iqaremark" header="IQA Remark" sortable class="w-40">
                <template #body="{ data }">
                    {{ data.remark_iqa || '-' }}
                </template>
            
            
            
            </Column>

            
        </DataTable>

        <div class="flex justify-end">
            <ConfirmPopup></ConfirmPopup>
         
           <Button @click="receiveNoLot" icon="pi pi-box" label="Receive No Lot" class="mr-2" severity="success"></Button>
              <Button
    ref="popup"
    @click="Success()"
    icon="pi pi-check"
    label="Submit to IQA"
    class="mr-2"
    :disabled="!canSubmitSelected()"
/>
           
        </div>

        <div v-if="isDialogOpen" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
            <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl relative" style="min-height: 50vh;">
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
            
            <!-- Lot Split Status Information -->

            <div class="text-lg font-semibold mb-4">Lot Information</div>
           <div class="overflow-x-auto mb-4" style="max-height: 50vh;">
                <table class="min-w-full border border-gray-300">
                <thead class="bg-gray-100">
                    <tr>
                    <th class="border px-2 py-1">No</th>
                    <th class="border px-2 py-1">Lot No</th>
                    <th class="border px-2 py-1">TAKE OUT QTY</th>
                    <th class="border px-2 py-1">EXPIRE DATE</th>
                    <th class="border px-2 py-1">have a problem?</th>
                    <th class="border px-2 py-1">REMARK</th>
                    <th class="border px-2 py-1" v-if="isLotSplitRequired()">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, idx) in lotRows" :key="idx">
                        <td class="border px-2 py-1">
                            {{ idx + 1 }}
                        </td>
                        
                        <!-- Lot No Input -->
                        <td class="border px-2 py-1">
                            <input 
                                type="text" 
                                class="border rounded px-2 py-1 w-36" 
                                placeholder="Enter Lot No" 
                                v-model="row.lotNo"
                                :disabled="!isLotInfoEditable || !isLotSplitRequired()" 
                                :class="{
                                    'border-yellow-400 bg-yellow-50': !row.lotNo || row.lotNo.trim() === '',
                                    'border-green-400 bg-green-50': row.lotNo && row.lotNo.trim() !== ''
                                }"
                                :readonly="!isLotSplitRequired()"
                            />
                           
                        </td>
                        
                        <!-- Take Out QTY Input -->
                        <td class="border px-2 py-1">
                            <input
                                type="number"
                                min="0"
                                :max="dialogRowIndex !== null && tableRows && tableRows[dialogRowIndex] ? tableRows[dialogRowIndex].receiveQty : ''"
                                class="border rounded px-2 py-1 w-32"
                                placeholder="0.00"
                                v-model.number="row.takeOutQty"
                                step="0.01"
                                :disabled="!isLotInfoEditable || !row.lotNo || row.lotNo.trim() === '' || (!isLotSplitRequired() && idx === 0)"
                                :class="{
                                    'bg-gray-100 cursor-not-allowed': !row.lotNo || row.lotNo.trim() === '',
                                    'border-yellow-400 bg-yellow-50': row.lotNo && row.lotNo.trim() !== '' && (!row.takeOutQty || row.takeOutQty <= 0),
                                    'border-green-400 bg-green-50': row.lotNo && row.lotNo.trim() !== '' && row.takeOutQty && row.takeOutQty > 0
                                }"
                                @input="validateTakeOutQty(row, idx)"
                            />
                           
                        </td>
                        
                        <!-- Expire Date Input -->
                        <td class="border px-2 py-1">
                             <input 
                             type="date" 
                             class="border rounded px-2 py-1 w-36" 
                             v-model="row.expireDate" 
                             :disabled="!isLotInfoEditable || !canEditExpireDate(row)"
                             :class="getExpireDateClass(row)"
                             :required="isExpireDateRequired()"
                              />

                        </td>
                        
                        <!-- Problem Checkbox -->
                        <td class="border px-2 py-1 text-center">
                            <Checkbox
                                :id="'checkOption' + idx"
                                name="option"
                                :binary="true"
                                v-model="row.problem"
                                :disabled="!isLotInfoEditable"
                            />
                        </td>
                        
                        <!-- Remark Input -->
                        <td class="border px-2 py-1">
                            <input 
                                type="text" 
                                class="border rounded px-2 py-1 w-36" 
                                v-model="row.remark" 
                                placeholder="Optional remarks" 
                                :disabled="!isLotInfoEditable"
                            />
                        </td>
                        
                        <!-- Actions Column (only for lot split required items) -->
                        <td class="border px-2 py-1 text-center" v-if="isLotSplitRequired()">
                            <Button 
                                label="Delete" 
                                icon="pi pi-trash" 
                                severity="danger" 
                                size="small"
                                @click="confirmDelete(idx, $event)"
                                :disabled="lotRows.length <= 1 || !isLotInfoEditable"
                            />
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                    <td :colspan="isLotSplitRequired() ? 7 : 6" class="text-left font-semibold py-2 pl-4">
                        Balance QTY: {{ calculateBalanceQty() }} / {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.receiveQty : '' }}
                    </td>
                    </tr>
                </tfoot>
                </table>
            </div>
            <div class="flex justify-end gap-2">
                <button 
                    class="px-4 py-2 text-white rounded transition-all duration-200" 
                    :class="canAddRow && isLotSplitRequired() && isLotInfoEditable ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'" 
                    :disabled="!canAddRow || !isLotSplitRequired() || !isLotInfoEditable" 
                    @click="canAddRow && isLotSplitRequired() && isLotInfoEditable && addRow()"
                >
                + Add Row
                </button>
                <!-- Always allow closing the dialog -->
                <button class="px-4 py-2 bg-red-500 text-white rounded" @click="closeEditDialog()">Cancel</button>
                <ConfirmPopup></ConfirmPopup>
                <Button ref="popup" @click="confirm($event)" icon="pi pi-check" label="Save" class="mr-2" :loading="loading" :disabled="loading || !isLotInfoEditable"></Button>
            </div>
            <div class="flex flex-col gap-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"></div>
            </div>
            </div>
        </div>
    </div>

</template>

<style>
/* เพิ่มสีเทา */
:deep(.highlight-gray-row) {
    background-color: #e5e7eb !important;
}
:deep(.highlight-gray-row:hover) {
    background-color: #d1d5db !important;
}
:deep(.highlight-gray-row td) {
    background-color: #e5e7eb !important;
}
:deep(.highlight-gray-row:hover td) {
    background-color: #d1d5db !important;
}

</style>
