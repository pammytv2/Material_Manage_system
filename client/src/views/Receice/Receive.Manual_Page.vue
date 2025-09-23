<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode } from '@primevue/core/api';

const receiveStore = useReceiveStore();
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

// Form data for receive header
const receiveForm = reactive({
    receiveNumber: '',
    receiveDate: '',
    ItemCount: '',

});

// Vendor options (ควรดึงจาก API)

// Material items for receive
const receiveItems = ref([
    {
        id: null,
        itemNo: '',
        description: '',
        unit: '',
        receiveQty: 0,
        lotNo: '',
        expireDate: null,
        remark: '',
        iqaRequired: false,
        lotRequired: false
    }
]);

// Add new item row
function addItem() {
    receiveItems.value.push({
        id: null,
        itemNo: '',
        description: '',
        unit: '',
        receiveQty: 0,
        lotNo: '',
        expireDate: null,
        remark: '',
        iqaRequired: false,
        lotRequired: false
    });
}



// Remove item row
function removeItem(index: number) {
    receiveItems.value.splice(index, 1);
}
// Confirm before deleting an item row
function confirmDelete(index: number) {
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
            removeItem(index);
        }
    });
}

// Update ItemCount when changed
function updateItemCount() {
    const count = Number(receiveForm.ItemCount);
    if (count > 0) {
        // Adjust receiveItems array length to match ItemCount
        while (receiveItems.value.length < count) {
            addItem();
        }
        while (receiveItems.value.length > count) {
            receiveItems.value.pop();
        }
    }
}

// Validate form data
const isFormValid = computed(() => {
    if (!receiveForm.receiveNumber ) {
        return false;
    }

    // Check if at least one item has data
    const hasValidItems = receiveItems.value.some((item) => item.itemNo && item.receiveQty > 0);

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
        items: receiveItems.value.filter((item) => item.itemNo && item.receiveQty > 0)
    };

    try {
        loading.value = true;

        // TODO: เรียก API สำหรับบันทึก Manual Receive
        // const result = await receiveStore.createManualReceive(receiveData);

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

// Go back to previous page
function goBack() {
    router.back();
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
            <div class="flex flex-col gap-4">
                <div>
                    <label for="receiveNumber" class="block text-sm font-medium mb-1">Receive Number</label>
                    <div class="flex gap-2">
                        <InputText id="receiveNumber" v-model="receiveForm.receiveNumber" placeholder="receive number" class="flex-1" />
                    </div>
                </div>

                <div>
                    <label for="receiveDate" class="block text-sm font-medium mb-1">Receive Date</label>
                    <InputText id="receiveDate" v-model="receiveForm.receiveDate" type="Date" placeholder="" class="w-full" />
                </div>

                <div>
                    <label for="ItemCount" class="block text-sm font-medium mb-1">Item Count</label>
                    <InputText id="ItemCount" v-model="receiveForm.ItemCount" type="number" min="1" placeholder="0" class="w-full" @change="updateItemCount" />
                </div>

            </div>

    
        </div>
            <div class="mb-6">
                <div class="font-semibold text-xl mb-4">Manual Receive Item</div>
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

                    <Column field="itemNo" header="Item No" sortable style="width: auto;">
                        <template #body="slotProps">
                            <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                                <InputText v-model="slotProps.data.itemNo" placeholder="Item No" class="w-full text-sm" size="small" />
                            </template>
                        </template>
                        <template #filter="{ filterModel }">
                            <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                                <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by item no"  />
                            </template>
                        </template>
                    </Column>

                    <Column field="receiveQty" header="Receive Qty" sortable style="width: auto;">
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

                    <Column header="Action">
                        <template #body="slotProps">
                            <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                            <Button 
                                label="Delete"
                                icon="pi pi-trash" 
                                severity="danger" 
                                outlined style="background-color: #dc3545; color: #fff;"
                                @click="confirmDelete(slotProps.index)" 
                               
                            />
                            </template>
                        </template>
                    </Column>
                </DataTable>
            </div>
        
        <div class="flex justify-end gap-2">
            <Button label="Cancel" @click="goBack" severity="danger" outlined style="background-color: #dc3545; color: #fff;" />
            <ConfirmDialog />
            <Button label="Save Receive" @click="confirmSave" :loading="loading" :disabled="!isFormValid || loading" icon="pi pi-save" />
        </div>
    </div>
</template>
