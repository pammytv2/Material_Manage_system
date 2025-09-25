<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { watch } from 'vue';
import ConfirmPopup from 'primevue/confirmpopup';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const loading = ref(false);
const router = useRouter();
const confirmPopup = useConfirm();
const toast = useToast();
const showDialog = ref(false);
const selectedRow = ref<any>(null);
const receiveStore = useReceiveStore();
const unitPackingOptions = ref([]);
const type2Options = ref([]);
const groupProductOptions = ref([]);
const lotSplitOptions = ref([]);
const iqaOptions = ref([]);
const expDateOptions = ref([]);

const filters = ref<{
    itemno: filterMeta;
    description: filterMeta;
    unit: filterMeta;
    category: filterMeta;
    groupmat: filterMeta;
    partChip: filterMeta;
    spec: filterMeta;
    type: filterMeta;
    vendor: filterMeta;
    project: filterMeta;
    sectgroup: filterMeta;
    min: filterMeta;
    max: filterMeta;
    total: filterMeta;
    lotsplitStatus: filterMeta;
    iqaStatus: filterMeta;
    expireDateStatus: filterMeta;
}>({
    itemno: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    unit: { value: null, matchMode: FilterMatchMode.DATE_IS },
    category: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    groupmat: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    partChip: { value: null, matchMode: FilterMatchMode.CONTAINS },
    spec: { value: null, matchMode: FilterMatchMode.CONTAINS },
    type: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendor: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    project: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    sectgroup: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    min: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    max: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    total: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    lotsplitStatus: { value: null, matchMode: FilterMatchMode.CONTAINS },
    iqaStatus: { value: null, matchMode: FilterMatchMode.CONTAINS },
    expireDateStatus: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const itemList = ref<any[]>([]);

onMounted(async () => {
    loading.value = true;
    try {
        const data = await receiveStore.fetchItemList();
        const dropdowns = await receiveStore. fetchUnitPacking();
        unitPackingOptions.value = dropdowns[0]; // [{ UnitPackingID, UnitPacking }]
        type2Options.value = dropdowns[1]; // [{ Type2ID, Type2Name }]
        groupProductOptions.value = dropdowns[2]; // [{ GProdID, GroupProductName }]
        lotSplitOptions.value = dropdowns[3]; // [{ LotSplit_ID, LotSplit_Name }]
        iqaOptions.value = dropdowns[4]; // [{ IQA_ID, IQA_Name }]
        expDateOptions.value = dropdowns[5];
        itemList.value = data;
        console.log('itemList:', itemList.value);
    } finally {
        loading.value = false;
    }
});

function getLotSplitStatusText(LotSplit: any) {
    if (LotSplit === true || LotSplit === 1 || LotSplit === '1') return 'Lot Required';
    if (LotSplit === false || LotSplit === 0 || LotSplit === '0') return 'No Lot Required';
    return 'Not Specified';
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
        }
    });
}
function getLotSplitStatusClass(status: string) {
    switch (status) {
        case 'Lot Required':
            return 'p-tag p-tag-danger';
        case 'No Lot Required':
            return 'p-tag p-tag-success';
        case 'Not Specified':
            return 'p-tag p-tag-secondary';
        default:
            return 'p-tag';
    }
}

function getIQAStatusText(iqa: any) {
    if (iqa === true || iqa === 1 || iqa === '1') return 'IQA Required';
    if (iqa === false || iqa === 0 || iqa === '0') return 'No IQA Required';
    return 'Not Specified';
}

function getIQARequiredClass(text: string) {
    switch (text) {
        case 'IQA Required':
            return 'p-tag p-tag-danger';
        case 'No IQA Required':
            return 'p-tag p-tag-success';
        case 'Not Specified':
            return 'p-tag p-tag-secondary';
        default:
            return 'p-tag';
    }
}
function getExpireDateStatusText(ExpDate: any) {
    if (ExpDate === true || ExpDate === 1 || ExpDate === '1') return 'Valid';
    if (ExpDate === false || ExpDate === 0 || ExpDate === '0') return 'Expired';
    return 'Not Specified';
}
function getExpireDateStatusClass(status: string) {
    switch (status) {
        case 'Valid':
            return 'p-tag p-tag-danger';
        case 'Expired':
            return 'p-tag p-tag-success';
        case 'Not Specified':
            return 'p-tag p-tag-secondary';
        default:
            return 'p-tag';
    }
}

async function handleRowClick(row: any) {
    loading.value = true;
    try {
       
        const item = await receiveStore.fetchItem_by_itemNo(row.ItemNo);
        console.log('Fetched item details:', item); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้รับ

        // ถ้า API คืนเป็น array ให้ใช้ item[0]
        selectedRow.value = Array.isArray(item) ? item[0] : (item ?? row);
        showDialog.value = true;
    } finally {
        loading.value = false;
    }
}
async function saveLotSplit() {
    loading.value = true;
    try {
        const itemData = {
            itemNo: selectedRow.value.ItemNo,
            Inactive: Number(selectedRow.value.Inactive ?? 0),
            LotSplit: Number(selectedRow.value.LotSplit ?? 0),
            Packing: Number(selectedRow.value.Packing ?? 0),
            Type2: Number(selectedRow.value.Type2 ?? 0),
            IQA: Number(selectedRow.value.IQA ?? 0),
            ExpDate: Number(selectedRow.value.ExpDate ?? 0),
            GroupMatID: Number(selectedRow.value.GroupMatID ?? 0),
            Min: Number(selectedRow.value.Min ?? 0),
            Max: Number(selectedRow.value.Max ?? 0),
            GProdID: Number(selectedRow.value.GProdID ?? 0)
        };
        const result = await receiveStore.updateItemList(itemData);
        if (result !== undefined && result !== null) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Update successful', life: 3000 });
            // รีเซตตาราง: ดึงข้อมูลใหม่
            const data = await receiveStore.fetchItemList();
            itemList.value = data;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Update failed', life: 3000 });
        }
    } finally {
        loading.value = false;
    }
}
const searchQuery = ref('');

// Watch searchQuery and update global filter

watch(searchQuery, (val) => {
    filters.value['global'] = { value: val, matchMode: FilterMatchMode.CONTAINS };
});
function clearFilter() {
    filters.value = {
        itemno: { value: null, matchMode: FilterMatchMode.CONTAINS },
        description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        unit: { value: null, matchMode: FilterMatchMode.DATE_IS },
        category: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        groupmat: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        partChip: { value: null, matchMode: FilterMatchMode.CONTAINS },
        spec: { value: null, matchMode: FilterMatchMode.CONTAINS },
        type: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendor: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        project: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        sectgroup: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        min: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        max: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        total: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        lotsplitStatus: { value: null, matchMode: FilterMatchMode.CONTAINS },
        iqaStatus: { value: null, matchMode: FilterMatchMode.CONTAINS },
        expireDateStatus: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Manage Material</div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Material List</div>
        <DataTable
            :value="itemList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceptNumber"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="(e) => handleRowClick(e.data)"
            :globalFilterFields="['ItemNo', 'ITEMDesc', 'TYPE', 'VENDOR', 'PROJECT', 'GROUPMATTYPE', 'CATEGORY', 'SPEC', 'Inactive', 'lotsplitStatus']"
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

            <Column field="ItemNo" header="Item No" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.ItemNo }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Item No" />
                </template>
            </Column>

            <Column field="ITEMDesc" header="Description" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.ITEMDesc }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Description" />
                </template>
            </Column>

            <Column field="TYPE" header="Type" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    {{ data.TYPE }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Type" />
                </template>
            </Column>
            <Column field="UNIT" header="Unit" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    {{ data.UnitPacking ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Unit" />
                </template>
            </Column>

            <Column field="PARTCHIP" header="Part Chip" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    {{ data.PARTCHIP ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Part Chip" />
                </template>
            </Column>

            <Column field="VENDOR" header="Vendor" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.VENDOR }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Vendor" />
                </template>
            </Column>

            <Column field="PROJECT" header="Project" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.PROJECT }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Project" />
                </template>
            </Column>

            <Column field="SectionGroup" header="Section Group" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.GroupProductName ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Section Group" />
                </template>
            </Column>

            <Column field="GROUPMATTYPE" header="Group Mat" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.GroupmatName ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Group Mat" />
                </template>
            </Column>

            <Column field="CATEGORY" header="Category" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.CATEGORY }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Category" />
                </template>
            </Column>

            <Column field="SPEC" header="Spec" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.SPEC }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Spec" />
                </template>
            </Column>

            <Column field="MIN" header="Min" sortable style="min-width: 4rem">
                <template #body="{ data }">
                    {{ data.Min ?? '0' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Min" />
                </template>
            </Column>

            <Column field="MAX" header="Max" sortable style="min-width: 4rem">
                <template #body="{ data }">
                    {{ data.Max ?? '0' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Spec" />
                </template>
            </Column>

            <Column field="Packing" header="Packing" sortable style="min-width: 4rem">
                <template #body="{ data }">
                    {{ data.Packing ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Packing" />
                </template>
            </Column>

            <Column field="IQA" header="IQA Status" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    <span :class="getIQARequiredClass(getIQAStatusText(data.IQA))">
                        {{ getIQAStatusText(data.IQA) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by IQA Status" />
                </template>
            </Column>
            <Column field="ExpDate" header="Exp Date" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <span :class="getExpireDateStatusClass(getExpireDateStatusText(data.ExpDate))">
                        {{ getExpireDateStatusText(data.ExpDate) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Exp Date" />
                </template>
            </Column>

            <Column field="LotSplit" header="LotSplit Status" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <span :class="getLotSplitStatusClass(getLotSplitStatusText(data.LotSplit))">
                        {{ getLotSplitStatusText(data.LotSplit) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by LotSplit Status" />
                </template>
            </Column>

            <Column field="Inactive" header="Inactive" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    <Tag :value="data.Inactive ? 'Inactive' : 'Active'" :severity="data.Inactive ? 'danger' : 'success'" />
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Status" />
                </template>
            </Column>
            <!-- filepath: d:\Natchaphon\Material_Manage_system\client\src\views\Manage_Material\Manage.Material_Page.vue -->
            <Dialog v-model:visible="showDialog" modal header="Material Details" :style="{ width: '50vw' }" :dismissableMask="true">
                <div v-if="selectedRow" class="p-4 rounded-lg shadow bg-white border border-gray-200">
                    <div class="flex flex-wrap gap-6">
                        <!-- ซ้าย -->
                        <div class="flex-1 min-w-[220px]">
                            <div class="mb-2">
                                <b>Item No:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.ItemNo }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Description:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.ITEMDesc }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Unit:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.UnitPacking ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Spec:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.SPEC ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Type:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.TYPE ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Group Material:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.GroupmatName ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Section Group:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.GroupProductName ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2 flex gap-4">
                                <div class="flex-1">
                                    <b>Min:</b>
                                    <InputText v-model="selectedRow.Min" placeholder="Min" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                </div>
                                <div class="flex-1">
                                    <b>Max:</b>
                                    <InputText v-model="selectedRow.Max" placeholder="Max" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                </div>
                                <div class="flex-1">
                                    <b>Packing:</b>
                                    <InputText v-model="selectedRow.Packing" placeholder="Packing" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                </div>
                            </div>
                        </div>
                        <!-- ขวา -->
                        <div class="flex-1 min-w-[220px]">
                            <div class="mb-2">
                                <b>Part Chip:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.PARTCHIP }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Category:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.CATEGORY ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Project:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.PROJECT ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Vendor:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.VENDOR ?? 'N/A' }}</div>
                            </div>
                            <div class="mb-2">
                                <b>Lot Split Status:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <span :class="getLotSplitStatusClass(getLotSplitStatusText(selectedRow.LotSplit))">
                                        {{ getLotSplitStatusText(selectedRow.LotSplit) }}
                                    </span>
                                </div>
                            </div>
                            <div class="mb-2">
                                <b>IQA Status:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <span :class="getIQARequiredClass(getIQAStatusText(selectedRow.IQA))">
                                        {{ getIQAStatusText(selectedRow.IQA) }}
                                    </span>
                                </div>
                            </div>
                            <div class="mb-2">
                                <b>Exp Date Status:</b>
                               <div class="mb-2">
    <b>Exp Date Status:</b>
    <div class="bg-gray-100 rounded p-2 mt-1">
        <Dropdown
    v-model="selectedRow.ExpDate"
    :options="expDateOptions"
    optionLabel="Exp_Name"
    optionValue="Exp_ID"
    placeholder="Select Exp Date Status"
    class="w-full"
/>
    </div>
</div>
                                <div class="mb-2">
                                    <b>Inactive:</b>
                                    <div class="bg-gray-100 rounded p-2 mt-1">
                                        <Dropdown
                                            v-model="selectedRow.Inactive"
                                            :options="[
                                                { label: 'Active', value: true },
                                                { label: 'Inactive', value: false }
                                            ]"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Select Status"
                                            class="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-6">
                        <Button label="Save" icon="pi pi-check" @click="confirm($event)" severity="success" :disabled="loading" />
                        <Button label="Cancel" icon="pi pi-times" @click="showDialog = false" severity="secondary" outlined :disabled="loading" />
                        <ConfirmPopup></ConfirmPopup>
                    </div>
                </div>
            </Dialog>
        </DataTable>
    </div>
</template>
