<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, reactive, ref, toRefs, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { IReceiveDetailItem, LotRow, IReceiveItem } from '@/interfaces/receive.interfaces';
import { useRoute } from 'vue-router';
import { item } from '@primeuix/themes/aura/breadcrumb';

const receiveStore = useReceiveStore();
const router = useRouter();
const toast = useToast();
const confirmPopup = useConfirm();
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
const lotSplitStatusList = reactive([{ value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }]);
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

// ฟังก์ชันสำหรับดึง Lot Split QTY ของแถวที่ระบุ
function getRowLotSplitQty(data: any): number {
    const key = `${data.itemNo}_${data.no}`;
    return rowLotSplitQtys.value[key] ?? 0;
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
function getRowBalanceQty(data: any): number {
    const key = `${data.itemNo}_${data.no}`;
    return rowBalanceQtys.value[key] ?? calculateRowBalanceQty(data);
}

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

async function saveLotSplit() {
    if (dialogRowIndex.value === null) return;
    const currentRow = tableRows.value[dialogRowIndex.value];

    if (!lotRows.value || lotRows.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'No lot data to save', life: 3000 });
        return;
    }

    const validLotRows = lotRows.value.filter(lotRow => lotRow.lotNo && lotRow.takeOutQty && parseFloat(String(lotRow.takeOutQty)) > 0);
    if (validLotRows.length === 0) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in Lot No and Take Out Qty for at least one row', life: 3000 });
        return;
    }

    const lotSplitPromises = validLotRows.map(lotRow => {
        // Ensure value is boolean before converting to 1/0
        const payload = {
            ItemNo: currentRow?.itemNo || '',
            LotSplit: lotRow.lotNo,
            receiveno: receiveNumber.value,
            lot_unit: lotRow.unit || currentRow.unit,
            exp_date: new Date(lotRow.expireDate),
            remark: lotRow.remark || '',
            isProblem: !!lotRow.problem,
            lot_qty: parseFloat(String(lotRow.takeOutQty ?? '0')) || 0
        };

        // ถ้ามี id = UPDATE, ถ้าไม่มี id = INSERT
        if (lotRow.id) {
            const updatePayload = { ...payload, id: lotRow.id };
            console.log('Update LotSplit Payload:', updatePayload);
            return receiveStore.updateLotSplit(updatePayload);
        } else {
            console.log('Insert LotSplit Payload:', payload);
            return receiveStore.createLotSplit(payload);
        }
    });
    

    try {
        loading.value = true;
        const results = await Promise.all(lotSplitPromises);
        const allSuccess = results.every(result => result !== null && result !== undefined);
        if (allSuccess) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Lot split data saved successfully', life: 3000 });
            
            // อัปเดต Balance QTY ใหม่หลังจากบันทึกสำเร็จ
            await updateRowBalanceQtys();
            
            closeEditDialog(true);
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Some lot split data failed to save', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: `Failed to save lot split data: ${String(error)}`, life: 5000 });
    } finally {
        loading.value = false;
    }
}


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

function calculateRowBalanceQty(data: any) {
    // คำนวณ Balance QTY สำหรับแต่ละแถวใน DataTable
    const receiveQty = parseFloat(data.receiveQty || '0') || 0;
    const returnQty = parseFloat(data.returnQty || '0') || 0;
    
    // Balance = Receive - Return - Total Lot Split Qty
    return Math.max(receiveQty - returnQty, 0);
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
        const totalLotSplitQty = existingLotSplits?.reduce((sum: number, lot: any) => {
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
const canAddRow = computed(() => {
    return calculateBalanceQty() > 0;
});

function color_BalanceQty(data: any) {
    const balanceQty = getRowBalanceQty(data);
    if (balanceQty === 0) {
        return 'bg-green-200 text-green-700 font-semibold px-2 py-1 rounded'; 
    } else if (balanceQty > 0) {
        return 'bg-yellow-200 text-yellow-700 font-semibold px-2 py-1 rounded'; 
    }
    return ''; 
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

async function openEditDialog(rowIndex: number) {
    dialogRowIndex.value = rowIndex;
    const currentRow = tableRows.value[rowIndex];
    
    try {
        loading.value = true;
        
        // ดึงข้อมูล Lot Split ที่มีอยู่แล้วจาก API
        const existingLotSplits = await receiveStore.fetchLotSplitByRecAndItem({
            receiveno: receiveNumber.value,
            itemNo: currentRow?.itemNo || ''
        } as any);
        
        console.log('Existing Lot Splits:', existingLotSplits);
        
        // แปลงข้อมูลจาก API เป็นรูปแบบที่ใช้ใน Dialog
        if (existingLotSplits && existingLotSplits.length > 0) {
            lotRows.value = existingLotSplits.map((row: any) => ({
                id: row.id, // เพิ่ม id สำหรับ update
                no: '',
                lotNo: row.lot_no || '',
                qty: row.lot_qty || '',
                unit: row.lot_unit || currentRow?.unit || '',
                expireDate: row.exp_date ? new Date(row.exp_date).toISOString().split('T')[0] : '',
                takeOutQty: row.lot_qty || '',
                problem: !!row.isProblem, // แปลง 1/0 เป็น boolean
                remark: row.remark || ''
            }));
        } else {
            // ถ้าไม่มีข้อมูลเก่า ให้สร้าง row ว่างใหม่
            lotRows.value = [{
                id: null, // ไม่มี id = ข้อมูลใหม่
                no: '',
                lotNo: '',
                qty: '',
                unit: currentRow?.unit || '',
                expireDate: '',
                takeOutQty: '',
                problem: false,
                remark: ''
            }];
        }
        
    } catch (error) {
        console.error('Error fetching lot split data:', error);
        toast.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to load existing lot split data', 
            life: 3000 
        });
        
        // ถ้าเกิด error ให้สร้าง row ว่างใหม่
        lotRows.value = [{
            id: null, // ไม่มี id = ข้อมูลใหม่
            no: '',
            lotNo: '',
            qty: '',
            unit: currentRow?.unit || '',
            expireDate: '',
            takeOutQty: '',
            problem: false,
            remark: ''
        }];
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
        if (detailTableRef.value) {
            detailTableRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function addRow() {
 let unit = '';
    if (dialogRowIndex.value !== null) {
        unit = tableRows.value[dialogRowIndex.value]?.unit || '';
    }

    const newRow = {
        id: null, // ไม่มี id = ข้อมูลใหม่
        no: '',
        lotNo: '',
        qty: '',
        unit,
        expireDate: '',
        takeOutQty: '',
        problem: false, 
        remark: ''
    };
    lotRows.value.push(newRow);
}

async function removeRow(index: number) {
    const lotRow = lotRows.value[index];
    
    // ถ้า row มี id แสดงว่าเป็นข้อมูลที่มีอยู่ในฐานข้อมูล ต้องลบจริง
    if (lotRow.id) {
        try {
            loading.value = true;
            
            // เรียก API delete
            const deleteResult = await receiveStore.Delete_LotSplit({
                receiveno: receiveNumber.value,
                itemNo: dialogRowIndex.value !== null ? tableRows.value[dialogRowIndex.value]?.itemNo || '' : '',
                lotNo: lotRow.lotNo
            } as any);
            
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
        message: lotRow.id 
            ? `Are you sure you want to delete Lot ${lotRow.lotNo}? This will permanently remove it from the database.`
            : 'Are you sure you want to remove this row?',
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
        },
    });
}

function confirm(event) {
    console.log('🔍 confirm function called'); // เพิ่ม log เพื่อ debug
    confirmPopup.require({
        target: event.target,
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
            console.log('✅ User accepted, calling saveLotSplit'); // เพิ่ม log
            await saveLotSplit();
        },
        reject: () => {
            console.log('❌ User rejected'); // เพิ่ม log
            toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Operation cancelled', life: 3000 });
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
                    <!-- จำนวนที่เหลือหลังจากแบ่ง Lot ไปแล้ว (Balance QTY) -->
                    <span :class="color_BalanceQty(data)">
                        {{ getRowBalanceQty(data) }}
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
                    <span :class="getIQAStatusClass(data.iqaStatus || 'PENDING')">
                        {{ data.iqaStatus || 'PENDING' }}
                    </span>
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
                                    <input
                                        type="number"
                                        min="0"
                                        :max="dialogRowIndex !== null && tableRows && tableRows[dialogRowIndex] ? tableRows[dialogRowIndex].receiveQty : ''"
                                        class="border rounded px-2 py-1 w-16"
                                        placeholder="0"
                                        v-model="row.takeOutQty"
                                        step="any"
                                        @input="
                                            (() => {
                                                if (dialogRowIndex !== null) {
                                                    // รวม takeOutQty ทุกแถว
                                                    const totalTakeOutQty = lotRows.reduce((sum, r) => {
                                                        return sum + (parseFloat(String(r.takeOutQty || '0')) || 0);
                                                    }, 0);
                                                    const receiveQty = parseFloat(String(tableRows[dialogRowIndex].receiveQty || '0')) || 0;
                                                    if (totalTakeOutQty > receiveQty) {
                                                        // ปรับค่า row.takeOutQty ให้ไม่เกิน receiveQty - (sum ของแถวอื่น)
                                                        const otherRowsSum = totalTakeOutQty - (parseFloat(String(row.takeOutQty || '0')) || 0);
                                                        row.takeOutQty = Math.max(receiveQty - otherRowsSum, 0).toString();
                                                        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Take Out Qty รวมทุกแถวห้ามเกิน Receive Qty', life: 2000 });
                                                    }
                                                }
                                            })()
                                        "
                                    />
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="date" class="border rounded px-2 py-1 w-36" v-model="row.expireDate" :class="expireDateEnd(row.expireDate)" />
                                </td>
                                <td class="border px-2 py-1">
                                    <Checkbox
                                        :id="'checkOption' + idx"
                                        name="option"
                                        :binary="true"
                                        v-model="row.problem"
                                        @update:modelValue="
                                            (value) => {
                                                console.log(`Checkbox ${idx} updated to:`, value, typeof value);
                                                row.problem = value;
                                            }
                                        "
                                    />
                                    <!-- แสดงค่าปัจจุบันเพื่อ debug -->
                                    <span class="ml-2 text-xs text-gray-400"> ({{ row.problem ? 'checked' : 'unchecked' }}) </span>
                                </td>
                                <td class="border px-2 py-1">
                                    <input type="text" class="border rounded px-2 py-1 w-36" v-model="row.remark" />
                                </td>
                                <td class="border px-2 py-1 text-center">
                                    <Button 
                                        label="Delete" 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        style="width: auto" 
                                        @click="confirmDelete(idx, $event)" 
                                    />
                                </td>
                            </tr>
                        </tbody>

                        <tfoot>
                            <tr>
                                <td colspan="8" class="text-left font-semibold py-2 pl-4">Balance QTY: {{ calculateBalanceQty() }} / {{ dialogRowIndex !== null ? tableRows[dialogRowIndex]?.receiveQty : '' }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div class="flex justify-end gap-2">
                    <button class="px-4 py-2 text-white rounded transition-all duration-200" :class="canAddRow ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'" :disabled="!canAddRow" @click="canAddRow && addRow()">
                        + Add Row
                    </button>
                    <button class="px-4 py-2 bg-red-500 text-white rounded" @click="closeEditDialog()">Cancel</button>
                    <ConfirmPopup></ConfirmPopup>
                    <Button ref="popup" @click="confirm($event)" icon="pi pi-check" label="Save" class="mr-2" :loading="loading" :disabled="loading"></Button>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"></div>
                </div>
            </div>
        </div>
    </div>
</template>
