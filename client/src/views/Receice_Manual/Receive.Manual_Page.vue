<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode } from '@primevue/core/api';
import type { receiveForm, receiveItems } from '@/interfaces/manual.interfaces';
import { useReceiveStore_manual } from '@/stores/receive_manual';

const receiveStore_manual = useReceiveStore_manual();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);
const selectedRows = ref([]);

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
    vdcodeSuggestions.value = response ?? [];
    loading.value = false;
});


async function searchItemListManual() {
    loading.value = true;
    try {
        // รับ PoNumber หลายตัวจาก Chips
        const poNumbers = receiveForm.value.receiveNumberList;
        // รับ VDCODE จาก AutoComplete
        const vdcode = String(receiveForm.value.VDCODE ?? '');
        // เรียก API
        const result = await receiveStore_manual.fetchItemList_manual(poNumbers, vdcode);
        // สมมติ recordset แรกคือรายการ
        console.log('API Result:', result)
        receiveItems.value = result?.[0] ?? [];
        receiveForm.value.ItemCount = receiveItems.value.length;
        

        console.log('Fetched Items:', receiveItems.value);
        console.log('Item Count:', receiveForm.value.ItemCount);
        console.log('Po Numbers:', poNumbers);
        console.log('VDCODE:', vdcode);
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
                    style="min-width: 350px; max-width: 100%; height: 40px;"
                    :inputStyle="{ minHeight: '40px', fontSize: '1rem' }"
                    />
                </div>
                <div class="w-full fmax-w-60 gap-2 mt-2">
                    <label for="PoNumber" class="block font-bold mb-1 min-w-[100px]">Po Number</label>
                    <Chips 
                        v-model="receiveForm.receiveNumberList" 
                        separator="," 
                        addOnBlur 
                        placeholder="Po Number" 
                        class="w-full"
                        style="min-width: 350px; max-width: 100%;"
                        :inputStyle="{ minHeight: '25px', fontSize: '1rem' }"
                    />
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
                    <Button label="search" icon="pi pi-search" severity="success"  @click="searchItemListManual" outlined style="background-color: #22c55e; color: #fff" />
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
                <Column field="InvoiceNo" header="Invoice No" sortable style="width: auto">
                    <template #body="slotProps">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText :modelValue="String(receiveForm.InvoiceNo ?? '')" @update:modelValue="(val) => (receiveForm.InvoiceNo = String(val))" placeholder="Invoice No" class="w-full text-sm" size="small" />
                        </template>
                    </template>
                    <template #filter="{ filterModel }">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by invoice no" />
                        </template>
                    </template>
                </Column>

                <Column field="Po Number" header="Po Number" sortable style="width: auto">
                    <template #body="slotProps">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText :modelValue="String(receiveForm.PoNumber ?? '')" @update:modelValue="(val) => (receiveForm.PoNumber = String(val))" placeholder="Po Number" class="w-full text-sm" size="small" />
                        </template>
                    </template>
                    <template #filter="{ filterModel }">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by po number" />
                        </template>
                    </template>
                </Column>

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

                <Column field="description" header="Description" sortable style="width: auto">
                    <template #body="slotProps">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText v-model="slotProps.data.description" placeholder="Description" class="w-full text-sm" size="small" />
                        </template>
                    </template>
                    <template #filter="{ filterModel }">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by description" />
                        </template>
                    </template>
                </Column>
                <Column field="Quantity" header="Quantity" sortable style="width: auto">
                    <template #body="slotProps">
                        <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <InputNumber v-model="slotProps.data.Quantity" :min="0" placeholder="Qty" class="w-full" />
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

        <div class="flex justify-end gap-2">
            <Button label="Cancel" @click="goBack" severity="danger" outlined style="background-color: #dc3545; color: #fff" />
            <ConfirmDialog />
            <Button label="Save Receive" @click="confirmSave" :loading="loading" :disabled="!isFormValid || loading" icon="pi pi-save" />
        </div>
    </div>
</template>
