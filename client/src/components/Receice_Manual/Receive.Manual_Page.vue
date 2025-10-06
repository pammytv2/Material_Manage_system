<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode } from '@primevue/core/api';
import type { receiveForm, receiveItems } from '@/interfaces/manual.interfaces';
import { useReceiveStore_manual } from '@/stores/receive_manual';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const receiveStore_manual = useReceiveStore_manual();
const itemNoOptions = ref<{ label: string; value: string }[]>([]);
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);
const selectedRows = ref([]);
const poHeader = ref<any[]>([]);

// Filters for DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unit: { value: null, matchMode: FilterMatchMode.EQUALS },
    receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const receiveItems = ref<receiveItems[]>([]);
const receiveForm = ref<receiveForm>({
    PoNumber: '',
    receiveNumberList: [],
    receiveDate: '',
    ItemCount: 0,
    InvoiceNo: ''
    // VDCODE: '',
});

// Suggestions for VDCODE autocomplete
const vdcodeSuggestions = ref<{ code: string; name: string }[]>([]);

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
function removeItem(index: number) {
    receiveItems.value.splice(index, 1);
}

const isFormValid = computed(() => {
    if (!receiveForm.value.PoNumber) {
        return false;
    }

    const hasValidItems = receiveItems.value.some((item) => item.itemNo && Number(item.receiveQty) > 0);

    return hasValidItems;
});

// Save receive data
async function saveReceive() {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please fill in all required fields',
            life: 3000
        });
        return;
    }

    const receiveData = {
        ...receiveForm,
        items: receiveItems.value.filter((item) => item.itemNo && Number(item.receiveQty) > 0)
    };

    try {
        loading.value = true;

        console.log('Manual Receive Data:', receiveData);

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Manual receive created successfully',
            life: 3000
        });

        // กลับไปหน้า Receive List
        setTimeout(() => {
            router.push('/uikit/receive-material');
        }, 1000);
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
function confirmSave() {
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
            saveReceive();
        }
    });
}

function goBack() {
    router.back();
}

onMounted(async () => {
    const response = await receiveStore_manual.fetchVDCODE();
    const itemList = await receiveStore_manual.fetchItemList_spec();
    vdcodeSuggestions.value = response ?? [];
    // แสดง ItemNo และ SPEC ใน dropdown
    itemNoOptions.value = (itemList ?? []).map((item) => ({
        label: `${item.ItemNo.trim()} - ${item.SPEC?.trim() ?? ''}`,
        value: item.ItemNo.trim()
    }));
    loading.value = false;
});
// เพิ่มตัวแปรสำหรับเก็บ PO Header

async function searchItemListManual() {
    loading.value = true;
    try {
        const poNumbers = receiveForm.value.receiveNumberList;
        const vdcode =
    typeof receiveForm.value.VDCODE === 'string'
        ? receiveForm.value.VDCODE
        : typeof receiveForm.value.VDCODE === 'object' && receiveForm.value.VDCODE !== null && 'code' in receiveForm.value.VDCODE
            ? receiveForm.value.VDCODE.code
            : '';


        console.log('Searching Item List (Manual) with PO Numbers:', poNumbers, 'and VDCODE:', vdcode);
        
        const result = await receiveStore_manual.fetchItemList_manual(poNumbers, vdcode);
        console.log('Fetched Item List (Manual):', result);

        // เก็บ PO Header (array แรก)
        poHeader.value = Array.isArray(result) && result.length > 0 ? result[0] : [];

        // เก็บ PO Items (array ที่สอง)
        const itemsArray = Array.isArray(result) && result.length > 1 ? result[1] : [];
        receiveItems.value = itemsArray.map((item: any) => ({
            itemNo: item.ITEMNO?.trim() ?? '',
            description: '', // ถ้ามี field description ให้ใส่, ถ้าไม่มีให้เว้นไว้
            unit: item.UNIT?.trim() ?? '',
            Quantity: item.Qty ?? 0,
            unitCost: item.UNITCOST ?? 0,
            InvoiceNo: receiveForm.value.InvoiceNo,
            PoNumber: item.PORHSEQ,
            vdcode: item.VDCODE?.trim() ?? '',
            vdname: item.VDNAME?.trim() ?? ''
        }));

        receiveForm.value.ItemCount = receiveItems.value.length;

        console.log('PO Header:', poHeader.value);
        console.log('poNumbers:', poNumbers, 'vdcode:', vdcode);
        console.log('PO Items:', receiveItems.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch item list',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
// Clear all filters
function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS },
        unit: { value: null, matchMode: FilterMatchMode.EQUALS },
        receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

const noPoItem = ref({
    itemNo: '',
    description: '',
    unit: '',
    receiveQty: 0,
    unitCost: 0,
    location: '',
    vdcode: '',
    invoiceNo: ''
});
const showNoPoForm = ref(false);

function addNoPoItem() {
    if (!noPoItem.value.itemNo || !noPoItem.value.location || !noPoItem.value.vdcode || !noPoItem.value.invoiceNo) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please fill all required fields for No PO item',
            life: 3000
        });
        return;
    }
    receiveItems.value.push({
        ...noPoItem.value,
        lotNo: '',
        expireDate: '',
        remark: '',
        iqaRequired: false,
        lotRequired: false
    });
    // reset form
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
    showNoPoForm.value = false;
}
</script>

<template>
    <div class="card mb-6">
        <Button icon="pi pi-arrow-left" @click="goBack" severity="secondary" outlined />
        <div class="flex items-center gap-4 mb-4">
            <div class="text-2xl font-bold">Manual Receive</div>
        </div>

        <!-- Header Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-full fmax-w-60 gap-2 mt-2">
                    <label for="InvoiceNo" class="block font-bold mb-1 min-w-[90px]">Invoice Number</label>
                    <InputText
                        :modelValue="String(receiveForm.InvoiceNo ?? '')"
                        @update:modelValue="(val) => (receiveForm.InvoiceNo = String(val))"
                        placeholder="Invoice Number"
                        class="w-full"
                        style="min-width: 350px; max-width: 100%; height: 40px"
                        :inputStyle="{ minHeight: '40px', fontSize: '1rem' }"
                    />
                </div>
                <div class="w-full fmax-w-60 gap-2 mt-2">
                    <label for="PoNumber" class="block font-bold mb-1 min-w-[100px]">Po Number</label>
                    <Chips v-model="receiveForm.receiveNumberList" separator="," addOnBlur placeholder="Po Number" class="w-full" style="min-width: 350px; max-width: 100%" :inputStyle="{ minHeight: '25px', fontSize: '1rem' }" />
                </div>
                <div class="w-full fmax-w-60 gap-2 mt-2">
                    <label for="VDCODE" class="block font-bold mb-1 min-w-[90px]">VDCODE</label>
                    <AutoComplete
                        v-model="receiveForm.VDCODE"
                        :suggestions="vdcodeSuggestions"
                        @complete="searchVDCODE"
                        placeholder="Search or select VDCODE"
                        class="w-full"
                        dropdown
                        :optionLabel="(item) => `[${item.code}] ${item.name}`"
                        :optionValue="(item) => item.code"
                        :inputStyle="{ whiteSpace: 'normal', wordBreak: 'break-word', minHeight: '40px', width: '350px' }"
                        :panelStyle="{ minWidth: '350px', maxWidth: '100%' }"
                    >
                        <template #option="slotProps">
                            <div style="white-space: normal; word-break: break-word; max-width: 350px">
                                <span class="font-semibold">[{{ slotProps.option.code }}]</span>
                                <span class="ml-2">{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </AutoComplete>
                </div>
                <div class="mt-8">
                    <Button label="search" icon="pi pi-search" severity="success" @click="searchItemListManual" outlined style="background-color: #22c55e; color: #fff" />
                </div>
            </div>
        </div>
        <Button label="Add Item (No PO)" icon="pi pi-plus" severity="info" outlined @click="showNoPoForm = !showNoPoForm" />
        <div v-if="showNoPoForm" class="mt-4 p-4 border rounded bg-gray-50">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                    <label class="block font-bold mb-1 text-sm">Invoice No</label>
                    <InputText v-model="noPoItem.invoiceNo" placeholder="Invoice No" class="w-full" />
                </div>
                <div>
                    <label class="block font-bold mb-1">Item No</label>
                    <AutoComplete
                        v-model="noPoItem.itemNo"
                        :suggestions="itemNoOptions"
                        @complete="() => {}"
                        placeholder="Search or select Item No"
                        class="w-full"
                        dropdown
                        :optionLabel="(item) => item.label"
                        :optionValue="(item) => item.value"
                    >
                        <template #option="slotProps">
                            <div style="white-space: normal; word-break: break-word; max-width: 350px">
                                <span class="font-semibold">{{ slotProps.option.value }}</span>
                                <span class="ml-2">{{ slotProps.option.label.split(' - ')[1] }}</span>
                            </div>
                        </template>
                    </AutoComplete>
                </div>
                <div>
                    <label class="block font-bold mb-1">Location</label>
                    <InputText v-model="noPoItem.location" placeholder="Location" class="w-full" />
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                    <label class="block font-bold mb-1">VDCODE</label>
                    <AutoComplete
                        v-model="noPoItem.vdcode"
                        :suggestions="vdcodeSuggestions"
                        @complete="searchVDCODE"
                        placeholder="Search or select VDCODE"
                        class="w-full"
                        dropdown
                        :optionLabel="(item) => `[${item.code}] ${item.name}`"
                        :optionValue="(item) => item.code"
                    >
                        <template #option="slotProps">
                            <div style="white-space: normal; word-break: break-word; max-width: 350px">
                                <span class="font-semibold">[{{ slotProps.option.code }}]</span>
                                <span class="ml-2">{{ slotProps.option.name }}</span>
                            </div>
                        </template>
                    </AutoComplete>
                </div>
            </div>
            <div class="flex gap-2 mt-2">
                <Button label="Add" icon="pi pi-check" severity="success" @click="addNoPoItem" />
                <Button label="Cancel" icon="pi pi-times" severity="danger" outlined @click="showNoPoForm = false" />
            </div>
        </div>
    </div>

    <div class="mb-6">
        <div class="font-semibold text-xl mb-4">Manual Receive List</div>
        <DataTable
            :value="receiveItems"
            v-model:filters="filters"
            v-model:selection="selectedRows"
            paginator
            :rows="10"
            dataKey="id"
            filterDisplay="menu"
            :loading="loading"
            loadingIcon="pi pi-spin pi-spinner"
            showGridlines
            rowHover
            :globalFilterFields="['itemNo', 'description', 'unit', 'receiveQty']"
            class="p-datatable-sm mb-6"
            responsiveLayout="scroll"
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


    

            <Column field="itemNo" header="Item No" sortable style="width: auto">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="slotProps.data.itemNo" placeholder="Item No" class="w-full text-sm" size="small" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by item no" />
                    </template>
                </template>
            </Column>


            <Column field="Quantity" header="Quantity" sortable style="width: auto">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputNumber v-model="slotProps.data.Quantity" :min="0" placeholder="Qty" class="w-full"   :disabled="true" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by qty" />
                    </template>
                </template>
            </Column>
            <Column field="receiveQty" header="Receive Qty" sortable style="width: auto">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputNumber v-model="slotProps.data.receiveQty" :min="0" placeholder="Qty" class="w-full" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by qty" />
                    </template>
                </template>
            </Column>
            <Column field="Unit Cost" header="Unit Cost" sortable style="width: auto">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputNumber v-model="slotProps.data.unitCost" :min="0" placeholder="Unit Cost" class="w-full" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by unit cost" />
                    </template>
                </template>
            </Column>

            <Column field="Unit" header="Unit" sortable style="width: auto">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="slotProps.data.unit" placeholder="Unit" class="w-full text-sm" size="small" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by unit" />
                    </template>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Form for items without PO -->

    <div class="flex justify-end gap-2">
        <Button label="Cancel" @click="goBack" severity="danger" outlined style="background-color: #dc3545; color: #fff" />
        <ConfirmDialog />
        <Button label="Save Receive" @click="confirmSave" :loading="loading" :disabled="!isFormValid || loading" icon="pi pi-save" />
    </div>
</template>
