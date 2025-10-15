import { useReceiveStore } from '@/stores/receive';
import { useReceiveStore_manual } from '@/stores/receive_manual';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import type { receiveForm, receiveItems, NoPoItemType } from '@/interfaces/manual.interfaces';


const router = useRouter();
const loading = ref(false);
const pageLoading = ref(false); // Add full-page loading state
const selectedRows = ref([]);
const poHeader = ref<any[]>([]);
const receiveStore_manual = useReceiveStore_manual();
const itemNoOptions = ref<{ label: string; value: string }[]>([]);
const locationList = ref<{ label: string; value: string }[]>([]);
const filteredLocationOptions = ref<{ label: string; value: string }[]>([]);
const filteredItemNoOptions = ref<{ label: string; value: string }[]>([]);
const vdcodeSuggestions = ref<{ code: string; name: string }[]>([]);
const manualReceives = ref([]);



const receiveItems = ref<receiveItems[]>([]);
const receiveForm = ref<receiveForm & { VDCODE?: string | { code: string; name: string } }>({
    PoNumber: '',
    receiveNumberList: [],
    receiveDate: '',
    ItemCount: 0,
    InvoiceNo: '',

    VDCODE: ''
});
const noPoItem = ref<NoPoItemType>({
    itemNo: '',
    description: '',
    unit: '',
    receiveQty: 0,
    unitCost: 0,
    location: '',
    vdcode: '',
    invoiceNo: ''
});
const noPoItems = ref<NoPoItemType[]>([]);
const showNoPoDialog = ref(false);
const invoiceNoNoPoError = ref('');
const itemNoNoPoError = ref('');
const locationNoPoError = ref('');
const vdcodeNoPoError = ref('');


function closeNoPoDialog() {
    showNoPoDialog.value = false;
    // รีเซ็ตข้อมูลใน Dialog
    noPoItem.value = {
        itemNo: '',
        description: '',
        unit: '',
        receiveQty: 0,
        unitCost: 0,
        location: '',
        vdcode: '',
        invoiceNo: ''
    };
    noPoItems.value = [];
}

function filterItemNoOptions(event: { query: string }) {
    if (!event.query) {
        filteredItemNoOptions.value = itemNoOptions.value.slice(0, 10);
        return;
    }
    filteredItemNoOptions.value = itemNoOptions.value
        .map((option) => {
            // ตัด undefined ออกจาก label เช่น "[SMTVI] undefined" ให้เหลือแค่ "[SMTVI]"
            const label = option.label.replace(/\sundefined$/, '');
            return { ...option, label };
        })
        .filter((option) => option.label.toLowerCase().includes(event.query.toLowerCase()));
}



async function searchVDCODE(event: { query: string }) {
    const allVDCodes = await receiveStore_manual.fetchVDCODE();
    // ถ้า API ส่งมาเป็น array ของ string เช่น ['V1001|SHINDENGEN ELECTRIC MFG.CO.,LTD.', ...]
    vdcodeSuggestions.value = (allVDCodes ?? [])
        .map((item: any) => {
            if (typeof item === 'string') {
                const [code, name] = item.split('|');
                return { code: code?.trim() ?? '', name: name?.trim() ?? '' };
            }
            // ถ้าเป็น object อยู่แล้ว
            return {
                code: item.VDCODE,
                name: item.VDNAME
            };
        })
        .filter((item: { code: string; name: string }) => `[${item.code}] ${item.name}`.toLowerCase().includes(event.query.toLowerCase()));
}
// Remove item row
// function removeItem(index: number) {
//     receiveItems.value.splice(index, 1);
// }


function filterLocationOptions(event: { query: string }) {
    if (!event.query) {
        filteredLocationOptions.value = locationList.value.slice(0, 10);
        return;
    }
    filteredLocationOptions.value = locationList.value.filter((option) => `[${option.value}] ${option.label}`.toLowerCase().includes(event.query.toLowerCase()));
}

const isFormValid = computed(() => {
    const hasPo = !!receiveForm.value.PoNumber || (Array.isArray(receiveForm.value.receiveNumberList) && receiveForm.value.receiveNumberList.length > 0);
    const hasValidItems = receiveItems.value.some((item) => item.itemNo && Number(item.receiveQty) > 0);
    return hasPo && hasValidItems;
});


function confirmRemoveNoPoItem(confirm: any, index: number) {
    confirm.require({
        message: 'Are you sure you want to delete this item?',
        header: 'Confirm Delete',
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
        accept: () => {
            removeNoPoItem(index);
        }
    });
}




async function saveReceive(toast: any) {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',

            summary: 'Validation Error',
            detail: 'Please fill in all required fields',
            life: 3000
        });
        return;
    }

    try {
        loading.value = true;

        const itemsToUpdate = receiveItems.value.map((item) => ({
            ItemNo: item.itemNo,
            ReceiveQty: Number(item.receiveQty),
            
        }));
        const invoiceNumber = String(receiveForm.value.InvoiceNo ?? '');
        // Here you would call the API to save to database
        await receiveStore_manual.updateReceiveItems(itemsToUpdate, invoiceNumber);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Manual receive created successfully',
            life: 3000
        });

        // กลับไปหน้า Receive List
    } catch (error) {
        console.error('Error saving manual receive:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save manual receive',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}



// Confirm before save
function confirmSave(confirm: any, toast: any) {
    confirm.require({
        message: 'Are you sure you want to save this manual receive?',
        header: 'Confirm Save',
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
            saveReceive(toast);
        }
    });
}



function goBack() {
    router.back();
}

async function viewManualDetail(invoiceNumber?: string, poNumber?: string) {
    pageLoading.value = true;
    receiveForm.value.PoNumber = poNumber ? String(poNumber) : '';
    if (receiveForm.value.PoNumber) {
        const poArr = String(receiveForm.value.PoNumber).split(',').map(p => p.trim()).filter(p => p);
        // เพิ่ม PO ที่ยังไม่มีใน receiveNumberList
        poArr.forEach(po => {
            if (!receiveForm.value.receiveNumberList.includes(po)) {
                receiveForm.value.receiveNumberList.push(po);
            }
        });
    }
    if (invoiceNumber) {
        const detail = await receiveStore_manual.showItem_manual_detail(
            String(invoiceNumber),
            poNumber ? String(poNumber) : '' // ส่ง poNumber เฉพาะเมื่อมี
        );
        receiveItems.value = Array.isArray(detail) ? detail.map((item: any) => ({
            itemNo: item.ITEMNO?.trim() ?? '',
            description: item.ITEMDESC?.trim() ?? '',
            unit: item.UNIT?.trim() ?? '',
            receiveQty: item.ReceiveQty ?? 0,
            Quantity: item.Quantity ?? item.RQRECEIVED ?? item.ReceiveQty ?? 0,
            lotNo: item.lotNo ?? '',
            expireDate: item.expireDate ?? '',
            remark: item.remark ?? '',
            unitCost: item.UNITCOST ?? 0,
            iqaRequired: item.iqaRequired ?? false,
            lotRequired: item.lotRequired ?? false,
            ReceiveQty: item.ReceiveQty ?? 0,
            extendedcost: ((Number(item.ReceiveQty ?? 0)) * (Number(item.UNITCOST ?? 0))),
            PoNumber: item.PORHSEQ ?? '', // <-- เพิ่มตรงนี้
            location: item.location ?? '' // <-- เพิ่ม property location
        })) : [];
        receiveForm.value.InvoiceNo = String(invoiceNumber);
        receiveForm.value.PoNumber = poNumber ? String(poNumber) : '';
        receiveForm.value.ItemCount = receiveItems.value.length;
        console.log('Loaded Manual Detail:', receiveItems.value);
    }
    pageLoading.value = false; // End full-page loading
}



const invoiceNoError = ref('');
const poNumberError = ref('');
const vdcodeError = ref('');

async function searchItemListManual(toast: any) {
    invoiceNoError.value = '';
    poNumberError.value = '';
    vdcodeError.value = '';

    let hasError = false;
    if (!receiveForm.value.InvoiceNo) {
        invoiceNoError.value = 'กรุณากรอก Invoice Number';
        hasError = true;
    }
    if (
        !receiveForm.value.receiveNumberList ||
        !Array.isArray(receiveForm.value.receiveNumberList) ||
        receiveForm.value.receiveNumberList.length === 0
    ) {
        poNumberError.value = 'กรุณากรอก Po Number';
        hasError = true;
    }
    if (!receiveForm.value.VDCODE) {
        vdcodeError.value = 'กรุณากรอก VDCODE';
        hasError = true;
    }
    if (hasError) return;

    pageLoading.value = true; // Start full-page loading
    try {
        const poNumbers = receiveForm.value.receiveNumberList;
        const vdcode =
            typeof receiveForm.value.VDCODE === 'string' ? receiveForm.value.VDCODE : typeof receiveForm.value.VDCODE === 'object' && receiveForm.value.VDCODE !== null && 'code' in receiveForm.value.VDCODE ? receiveForm.value.VDCODE.code : '';
        const invoiceNumber = String(receiveForm.value.InvoiceNo ?? '');

        console.log('Searching Item List (Manual) with PO Numbers:', poNumbers, 'VDCODE:', vdcode, 'InvoiceNumber:', invoiceNumber);

        // Only search for items, don't save Invoice No to DB yet
        const result = await receiveStore_manual.fetchItemList_manual(poNumbers, vdcode, invoiceNumber);
        console.log('Fetched Item List (Manual):', result);

        // เก็บ PO Header (array แรก)
        poHeader.value = Array.isArray(result) && result.length > 0 ? result[0] : [];

        // เก็บ PO Items (array ที่สอง)
        const itemsArray = Array.isArray(result) && result.length > 1 ? result[1] : [];
        receiveItems.value = itemsArray.map((item: any) => ({
            itemNo: item.ITEMNO?.trim() ?? '',
            description: Array.isArray(item.ITEMDesc) ? item.ITEMDesc.join(', ').trim() : (item.ITEMDesc?.trim() ?? ''),
            unit: item.UNIT?.trim() ?? '',
            Quantity: item.RQRECEIVED ?? 0,
            unitCost: item.UNITCOST ?? 0,
            InvoiceNo: receiveForm.value.InvoiceNo, // Keep for display but don't save to DB yet
            PoNumber: item.PORHSEQ,
            vdcode: item.VDCODE?.trim() ?? '',
            vdname: item.VDNAME?.trim() ?? '',
            receiveQty: item.ReceiveQty ?? 0 // Initialize receiveQty to 0,
        }));

        receiveForm.value.ItemCount = receiveItems.value.length;

        console.log('PO Header:', poHeader.value);
        console.log('poNumbers:', poNumbers, 'vdcode:', vdcode, 'InvoiceNumber:', invoiceNumber);
        console.log('PO Items:', receiveItems.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch item list',
            life: 3000
        });
    } finally {
        pageLoading.value = false; // End full-page loading
    }
}



function confirmSaveNoPoItems(confirm: any, toast: any) {
    confirm.require({
        message: 'Are you sure you want to save these No PO items?',
        header: 'Confirm Save',
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
            saveNoPoItems(toast);
        }
    });
}



async function saveNoPoItems(toast: any) {
    if (!noPoItems.value.length) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please add at least one No PO item',
            life: 3000
        });
        return;
    }
    try {
        loading.value = true;
        // ส่งทุกแถวใน noPoItems.value ไปยัง API
        for (const item of noPoItems.value) {
            const VENDORCODE = typeof item.vdcode === 'object' && item.vdcode !== null && 'code' in item.vdcode ? item.vdcode.code : (item.vdcode ?? '');
            const itemNoStr = typeof item.itemNo === 'object' && item.itemNo !== null && 'value' in item.itemNo ? item.itemNo.value : (item.itemNo ?? '');
            const invoiceNumber = item.invoiceNo ?? '';
            const locationStr = typeof item.location === 'object' && item.location !== null && 'value' in item.location ? item.location.value : item.location;
            await receiveStore_manual.fetchInsertNoPoItem(
                VENDORCODE,
                invoiceNumber,
                Number(item.receiveQty) ?? 0,
                itemNoStr,
                locationStr
            );
        }
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'No PO items saved successfully',
            life: 3000
        });
        noPoItems.value = [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save No PO items',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function addNoPoItem(toast: any) {
    invoiceNoNoPoError.value = '';
    itemNoNoPoError.value = '';
    locationNoPoError.value = '';
    vdcodeNoPoError.value = '';

    let hasError = false;
    if (!noPoItem.value.invoiceNo) {
        invoiceNoNoPoError.value = 'กรุณากรอก Invoice Number';
        hasError = true;
    }
    if (!noPoItem.value.itemNo) {
        itemNoNoPoError.value = 'กรุณากรอก Item No';
        hasError = true;
    }
    if (!noPoItem.value.location) {
        locationNoPoError.value = 'กรุณากรอก Location';
        hasError = true;
    }
    if (!noPoItem.value.vdcode) {
        vdcodeNoPoError.value = 'กรุณากรอก VDCODE';
        hasError = true;
    }
    if (hasError) return;

    const itemNoStr = typeof noPoItem.value.itemNo === 'object' && noPoItem.value.itemNo !== null && 'value' in noPoItem.value.itemNo ? noPoItem.value.itemNo.value : String(noPoItem.value.itemNo);
    const locationStr = typeof noPoItem.value.location === 'object' && noPoItem.value.location !== null && 'value' in noPoItem.value.location ? noPoItem.value.location.value : String(noPoItem.value.location);

    receiveStore_manual.fetchItemList_lotSplit(itemNoStr, locationStr).then((lotSplitData) => {
        const apiData = Array.isArray(lotSplitData) ? lotSplitData[0] : lotSplitData;
        if (!apiData) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No item data found from API',
                life: 3000
            });
            return;
        }
        noPoItem.value.description = apiData.ITEMDesc ?? '';
        noPoItems.value.push({
            ...noPoItem.value,
            description: apiData.ITEMDesc ?? '',
            unit: apiData.UNIT ?? '',
            unitCost: apiData.RECENTCOST ?? 0,
            location: apiData.LOCATION ?? noPoItem.value.location
        });
        noPoItem.value = {
            itemNo: '',
            description: '',
            unit: '',
            receiveQty: 0,
            unitCost: 0,
            location: '',
            vdcode: '',
            invoiceNo: noPoItem.value.invoiceNo // เก็บ Invoice No ไว้
        };
    });
}

// Remove No PO item row
function removeNoPoItem(index: number) {
    noPoItems.value.splice(index, 1);
}

function editNoPoItem(index: number) {
    const item = noPoItems.value[index];
    if (item) {
        noPoItem.value = {
            itemNo: item.itemNo ?? '',
            description: item.description ?? '',
            unit: typeof item.unit === 'string' ? item.unit : String(item.unit ?? ''),
            receiveQty: typeof item.receiveQty === 'number' ? item.receiveQty : Number(item.receiveQty ?? 0),
            unitCost: typeof item.unitCost === 'number' ? item.unitCost : Number(item.unitCost ?? 0),
            location: item.location ?? '',
            vdcode: item.vdcode ?? '',
            invoiceNo: item.invoiceNo ?? ''
        };
        noPoItems.value.splice(index, 1);
    }
}

function editNoPoFromList(index: number) {
    const item = receiveItems.value[index];
    if (item && !item.PoNumber) {
        showNoPoDialog.value = true;
       
        const editItem = {
            itemNo: item.itemNo ?? '',
            description: item.description ?? '',
            unit: typeof item.unit === 'string' ? item.unit : String(item.unit ?? ''),
            receiveQty: typeof item.receiveQty === 'number' ? item.receiveQty : Number(item.receiveQty ?? 0),
            unitCost: typeof item.unitCost === 'number' ? item.unitCost : Number(item.unitCost ?? 0),
            location: item.location ?? '',
            vdcode: item.vdcode ?? '',
            invoiceNo: String(item.invoiceNo ?? item.InvoiceNo ?? '')
        };
        // ใส่ข้อมูลลงในฟอร์ม
        noPoItem.value = { ...editItem };
        // เพิ่มข้อมูลเข้า array เพื่อแสดงในตาราง 
        noPoItems.value = [editItem];
    }
}

async function loadManualReceives(toast: any) {
    loading.value = true;
    try {
        const data = await receiveStore_manual.showItem_manual();
        manualReceives.value = data || [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load manual receive list',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

const grandTotal = computed(() =>
    receiveItems.value.reduce((sum, item) => {
        const qty = Number(item.receiveQty) || 0;
        const cost = Number(item.unitCost) || 0;
        return sum + qty * cost;
    }, 0)
);
const noPoSubtotal = computed(() =>
    noPoItems.value.reduce((sum, item) => {
        const qty = Number(item.receiveQty) || 0;
        const cost = Number(item.unitCost) || 0;
        return sum + qty * cost;
    }, 0)
);



// Export all necessary functions and variables
export function useManualMaterial() {
    
    return {
        // Router and utilities
        router,
        
        // Loading states
        loading,
        pageLoading,
        // Data
        selectedRows,
        poHeader,
        receiveItems,
        receiveForm,
        noPoItem,
        noPoItems,
        manualReceives, // Add this missing export
        // Options and suggestions
        itemNoOptions,
        locationList,
        filteredLocationOptions,
        filteredItemNoOptions,
        vdcodeSuggestions,
        
        // Dialog state
        showNoPoDialog,
        
        // Error states
        invoiceNoError: ref(''),
        poNumberError: ref(''),
        vdcodeError: ref(''),
        invoiceNoNoPoError,
        itemNoNoPoError,
        locationNoPoError,
        vdcodeNoPoError,
        
        // Computed
        isFormValid,
        grandTotal,
        noPoSubtotal,
        
        // Functions that need toast/confirm parameters
        saveReceive,
        confirmSave,
        loadManualReceives,
        searchItemListManual,
        confirmSaveNoPoItems,
        saveNoPoItems,
        addNoPoItem,
        confirmRemoveNoPoItem,
        
        // Functions that don't need parameters
        closeNoPoDialog,
        filterItemNoOptions,
        searchVDCODE,
        filterLocationOptions,
        goBack,
        viewManualDetail,
        removeNoPoItem,
        editNoPoItem,
        editNoPoFromList
    };
}

