import { ref, computed, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { filterMeta, IReceiveDetailItem, LotRow } from '@/interfaces/receive.interfaces';
import { useToast } from 'primevue/usetoast';
import { a } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import { useIqaCheckMaterialStore } from './iqa_check_material';

// Material Split_Page functions (can be at module level)
function getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateString: string) {
    if (!dateString || dateString.length < 8) return '';

    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
}

function getMaterialDivisionStatus(row: any) {
    if (!row) return 'none';

    const totalSplitQty = row.total_split_qty || 0;
    const totalReceivedQty = row.total_received_qty || 0;

    if (totalSplitQty === 0) return 'none';
    if (totalSplitQty === totalReceivedQty) return 'complete';
    if (totalSplitQty > 0 && totalSplitQty < totalReceivedQty) return 'partial';
    return 'none';
}

export function useMaterialSplit() {
    const router = useRouter();
    const route = useRoute();
    const receiveStore = useReceiveStore();
    const toast = useToast();

    // Reactive variables
    const startDate = ref(localStorage.getItem('receiveStartDate') || '');
    const endDate = ref(localStorage.getItem('receiveEndDate') || getTodayStr());
    const searchQuery = ref('');
    const loading = ref(false);
    const ReceptNumber = ref('');

    // Material Split Detail variables
    const isDialogOpen = ref(false);
    const dialogRowIndex = ref<number | null>(null);
    const selectedRows = ref<IReceiveDetailItem[]>([]);
    const detailTableRef = ref<HTMLElement | null>(null);
    const lotSplitStatusList = reactive([{ value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }, { value: 'Not Specified' }]);
    // Extend LotRow type to include IQA property
    type LotRowWithIQA = LotRow & { IQA?: number | string };

    const lotRows = ref<LotRowWithIQA[]>([]);
    const lotStatusIQA = ref<any[]>([]);
    const rowBalanceQtys = ref<{ [key: string]: number }>({});
    const rowLotSplitQtys = ref<{ [key: string]: number }>({});

    // Computed properties
    const allReceiveList = computed(() => receiveStore.materialSplitItems);
    const allLotRows = computed(() => receiveStore.detail?.allLotRows || []);
    const tableRows = computed(() => receiveStore.detail?.tableRows || []);
    const receiveNumber = computed(() => receiveStore.detail?.receiveNumber || route.params.receiveNumber || '');
    const receiveDate = computed(() => receiveStore.detail?.receiveDate || route.query.RecReceiveDate || route.params.receiveDate || '');
    const invoiceNumber = computed(() => receiveStore.detail?.invoiceNumber || route.query.InvoiceNumber || route.params.invoiceNumber || '');
    const specialExpDate = computed(() => receiveStore.detail?.specialExpDate || '');
    const PORHSEQ = computed(() => receiveStore.detail?.PORHSEQ || route.query.PORHSEQ || route.params.PORHSEQ || '');
    const vendorName = computed(() => receiveStore.detail?.vendorName || route.query.VendorName || route.params.vendorName || '');

    const filteredReceiveList = computed(() => {
        try {
            let list = allReceiveList.value || [];

            if (searchQuery.value) {
                const q = searchQuery.value.trim().toLowerCase();
                list = list.filter((item) => {
                    if (!item) return false;

                    const receive = (item.ReceptNumber || '').toLowerCase();
                    const invoice = (item.InvoiceNumber || '').toLowerCase();
                    return receive.includes(q) || invoice.includes(q) || receive.startsWith(q) || invoice.startsWith(q);
                });
            }

            if (startDate.value) {
                const startDateFormatted = startDate.value.replace(/-/g, '');
                list = list.filter((item) => item && (item.ReciveDate || '') >= startDateFormatted);
            }
            if (endDate.value) {
                const endDateFormatted = endDate.value.replace(/-/g, '');
                list = list.filter((item) => item && (item.ReciveDate || '') <= endDateFormatted);
            }

            return list.map((row) => ({
                ...row,
                MaterialDivisionStatus: getMaterialDivisionStatus(row)
            }));
        } catch (error) {
            console.error('Error in filteredReceiveList:', error);
            return [];
        }
    });

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
                row.PORHSEQ?.toLowerCase().includes(q) ||
                row.invoice?.toLowerCase().includes(q) ||
                row.iqaStatus?.toLowerCase().includes(q)
        );
    });

    const canAddRow = computed(() => {
        if (dialogRowIndex.value === null) return false;
        const currentRow = tableRows.value[dialogRowIndex.value];
        const isLotSplitRequired = currentRow?.lotSplit === 1 || currentRow?.lotSplit === '1';

        // Only allow adding rows if lot split is required AND there's remaining balance
        return isLotSplitRequired && calculateBalanceQty() > 0;
    });

    // Functions
    async function onDateSearch() {
        localStorage.setItem('receiveStartDate', startDate.value);
        localStorage.setItem('receiveEndDate', endDate.value);
        const start = startDate.value.replace(/-/g, '');
        const end = endDate.value.replace(/-/g, '');
        loading.value = true;
        await receiveStore.fetchMaterialSplit(start, end);
        loading.value = false;

        console.log('Material Split List fetched:', allReceiveList.value);
    }

    async function handleRowClick(receipt: any) {
        try {
            if (!receipt) {
                console.error('Receipt object is null or undefined');
                return;
            }

            const receiveNumber = receipt.ReceptNumber || '';
            const StatusRecIC = receipt.StatusRecIC || '';
            const InvoiceNumber = receipt.InvoiceNumber || '';
            const RecReceiveDate = receipt.ReciveDate || '';
            const VendorName = receipt.VendorName || '';

            if (!receiveNumber) {
                console.error('ReceptNumber is missing from receipt object');
                return;
            }

            router.push({
                path: `/materials-split-detail/${receiveNumber}`,
                query: { StatusRecIC, InvoiceNumber, RecReceiveDate, VendorName }
            });

            console.log('Row clicked:', receipt);
        } catch (error) {
            console.error('Error in handleRowClick:', error);
        }
    }

    // ...existing functions for Material Split Detail...
    function calculateBalanceQty() {
        if (dialogRowIndex.value === null) return 0;

        const receiveQty = parseFloat(tableRows.value[dialogRowIndex.value]?.receiveQty || '0') || 0;
        const totalTakeOutQty = lotRows.value.reduce((sum, row) => {
            return sum + (parseFloat(String(row.takeOutQty || '0')) || 0);
        }, 0);

        if (totalTakeOutQty > receiveQty) {
            return 0;
        }

        return Number((receiveQty - totalTakeOutQty).toFixed(2));
    }

    function rowClass(data: any) {
        if (data.CompletedSplitItems < data.TotalItems) {
            return 'highlight-yellow-row';
        }

        if (data.TotalItems == 0) return 'highlight-gray-row';
        if (data.AllItemsSentToIQA == 1) return 'highlight-green-row';

        return '';
    }

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

    function getRowLotSplitQty(data: any): number {
        const key = `${data.itemNo}_${data.no}`;
        return rowLotSplitQtys.value[key] ?? 0;
    }
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
    function addRow() {
        if (dialogRowIndex.value === null) return;

        const currentRow = tableRows.value[dialogRowIndex.value];
        const isLotSplitRequired = currentRow?.lotSplit === 1 || currentRow?.lotSplit === '1';

        // Only allow adding rows if lot split is required
        if (!isLotSplitRequired) {
            toast.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Cannot add rows - lot split not required for this item',
                life: 3000
            });
            return;
        }

        let unit = currentRow?.unit || '';

        const newRow = {
            id: null,
            no: '',
            lotNo: '',
            qty: 0,
            unit,
            expireDate: '',
            takeOutQty: 0,
            problem: false,
            remark: ''
        };
        lotRows.value.push(newRow);
    }

    function getRowBalanceQty(data: any): number {
        const key = `${data.itemNo}_${data.no}`;
        return rowBalanceQtys.value[key] ?? 0; // ใช้ calculateRowBalanceQty ถ้าไม่มี function นี้
    }

    function color_BalanceQty(data: any) {
        const balanceQty = getRowBalanceQty(data);
        if (balanceQty === 0) {
            return 'bg-green-200 text-green-700 font-semibold px-2 py-1 rounded';
        } else if (balanceQty > 0) {
            return 'bg-yellow-200 text-yellow-700 font-semibold px-2 py-1 rounded';
        }
        return '';
    }

    function canEditIQA(iqa: number | string | null | undefined) {
        return iqa === 2 || iqa === '2' || iqa === null || iqa === undefined || iqa === '';
    }

    function getIQAStatusClass(status: number | string) {
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
            case 'PASS':
                return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
            case 'REWORK':
                return 'bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded';
            case 'REJECT':
                return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
            case 'CANCELLED':
                return 'bg-orange-200 text-orange-700 font-semibold px-2 py-1 rounded';
            case 'RESUBMITTED':
                return 'bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded';
            case 'NOT_REQUIRED':
               return 'bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded';
            default:
                return 'bg-white text-gray-900 px-2 py-1 rounded';
        }
    }

    function expireDateEnd(date: string) {
        if (!date) return '';
        const today = new Date();
        const expire = new Date(date);
        const diffTime = expire.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return 'bg-red-200 text-red-700 font-semibold px-2 py-1 rounded';
        } else if (diffDays <= 15) {
            return 'bg-yellow-200 text-yellow-700 font-semibold px-2 py-1 rounded';
        }
        return '';
    }

    async function saveLotSplit() {
        if (dialogRowIndex.value === null) return;
        const currentRow = tableRows.value[dialogRowIndex.value];

        if (!lotRows.value || lotRows.value.length === 0) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'No lot data to save', life: 3000 });
            return;
        }

        const isExpireDateRequired = currentRow?.ExpDate === 1 || currentRow?.ExpDate === '1';

        for (let i = 0; i < lotRows.value.length; i++) {
            const lotRow = lotRows.value[i];
            if (!lotRow.lotNo || lotRow.lotNo.trim() === '') {
                toast.add({ severity: 'warn', summary: 'Warning', detail: `Row ${i + 1}: Please enter Lot No first`, life: 3000 });
                return;
            }
            if (!lotRow.takeOutQty || parseFloat(String(lotRow.takeOutQty)) <= 0) {
                toast.add({ severity: 'warn', summary: 'Warning', detail: `Row ${i + 1}: Please enter Take Out QTY after Lot No`, life: 3000 });
                return;
            }
            if (isExpireDateRequired && (!lotRow.expireDate || lotRow.expireDate.trim() === '')) {
                toast.add({ severity: 'warn', summary: 'Warning', detail: `Row ${i + 1}: Please enter Expire Date after completing Lot No and Take Out QTY`, life: 3000 });
                return;
            }
        }

        const validLotRows = lotRows.value.filter((lotRow) => lotRow.lotNo && lotRow.lotNo.trim() !== '' && lotRow.takeOutQty && parseFloat(String(lotRow.takeOutQty)) > 0);

        if (validLotRows.length === 0) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please complete at least one row with Lot No and Take Out Qty', life: 3000 });
            return;
        }

        const lotSplitPromises = validLotRows.map((lotRow) => {
            const payload: any = {
                ItemNo: currentRow?.itemNo || '',
                LotSplit: lotRow.lotNo,
                receiveno: receiveNumber.value,
                lot_unit: lotRow.unit || currentRow.unit,
                remark: lotRow.remark || '',
                isProblem: !!lotRow.problem,
                lot_qty: parseFloat(String(lotRow.takeOutQty ?? '0')) || 0,
                InvoiceNumber: invoiceNumber.value,
                PORHSEQ: currentRow?.PORHSEQ,
                IQA: currentRow?.IQA,
                exp_date: isExpireDateRequired && lotRow.expireDate ? new Date(lotRow.expireDate) : null
            };

            if (lotRow.id) {
                const updatePayload = { ...payload, id: lotRow.id };
                console.log('Updating lot split with payload:', updatePayload);
                console.log('Updating lot split with payload:', updatePayload);
                return receiveStore.updateLotSplit(updatePayload);
                
            } else {
                console.log('Creating lot split with payload:', payload);
                return receiveStore.createLotSplit(payload);
            }
        });

        try {
            const iqaCheckMaterialStore = useIqaCheckMaterialStore();
            loading.value = true;
            const results = await Promise.all(lotSplitPromises);
            const allSuccess = results.every((result) => result !== null && result !== undefined);
            if (allSuccess) {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Lot split data saved successfully', life: 3000 });
                await updateRowBalanceQtys();
                await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
                closeEditDialog(true);
                await receiveStore.fetchMaterialSplit(startDate.value.replace(/-/g, ''), endDate.value.replace(/-/g, ''));
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Some lot split data failed to save', life: 3000 });
            }
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to save lot split data: ${String(error)}`, life: 5000 });
        } finally {
            loading.value = false;
        }
    }

    async function handleUpdateLotSplit() {
        if (dialogRowIndex.value === null) return;
        const currentRow = tableRows.value[dialogRowIndex.value];

        // เตรียม payload สำหรับแต่ละ lotRow
        const updatePromises = lotRows.value.map((lotRow) => {
            const payload: any = {
                ItemNo: currentRow?.itemNo || '',
                LotSplit: lotRow.lotNo,
                receiveno: receiveNumber.value,
                lot_unit: lotRow.unit || currentRow.unit,
                remark: lotRow.remark || '',
                isProblem: !!lotRow.problem,
                lot_qty: parseFloat(String(lotRow.takeOutQty ?? '0')) || 0,
                InvoiceNumber: invoiceNumber.value,
                PORHSEQ: currentRow?.PORHSEQ,
                exp_date: lotRow.expireDate ? new Date(lotRow.expireDate) : null,
                // ถ้ามี id ให้ส่งไปด้วย
                ...(lotRow.id ? { id: lotRow.id } : {})
            };
            return receiveStore.updateLotSplit(payload);
        });

        try {
            loading.value = true;
            await Promise.all(updatePromises);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Lot split updated', life: 3000 });
            await updateRowBalanceQtys();
            closeEditDialog(true);
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update lot split', life: 3000 });
        } finally {
            loading.value = false;
        }
    }

    function getReturnQty(receiveQty: number | string, returnQty: number | string) {
        const r = parseFloat(receiveQty as string) || 0;
        const t = parseFloat(returnQty as string) || 0;
        return Math.max(t + r, 0);
    }

    function closeEditDialog(refresh = false) {
        isDialogOpen.value = false;
        dialogRowIndex.value = null;
        if (refresh) {
            // Refresh logic here if needed
        }
    }

    return {
        // Router and store
        router,
        route,
        receiveStore,
        // Date handling
        startDate,
        endDate,
        getTodayStr,
        onDateSearch,
        // Data and computed
        allReceiveList,
        filteredReceiveList,
        searchQuery,
        loading,
        ReceptNumber,
        // Material Split Detail
        isDialogOpen,
        dialogRowIndex,
        selectedRows,
        receiveNumber,
        receiveDate,
        invoiceNumber,
        specialExpDate,
        vendorName,
        detailTableRef,
        lotSplitStatusList,
        allLotRows,
        lotRows,
        lotStatusIQA,
        tableRows,
        rowBalanceQtys,
        rowLotSplitQtys,
        filteredRows,
        canAddRow,
        // Utility functions
        getMaterialDivisionStatus,
        handleRowClick,
        formatDate,
        rowClass,
        calculateBalanceQty,
        updateRowLotSplitQtys,
        getRowLotSplitQty,
        updateRowBalanceQtys,
        getRowBalanceQty,
        color_BalanceQty,
        canEditIQA,
        handleUpdateLotSplit,
        getIQAStatusClass,
        expireDateEnd,
        saveLotSplit,
        getReturnQty,
        closeEditDialog,
        toast,
        addRow
    };
}
