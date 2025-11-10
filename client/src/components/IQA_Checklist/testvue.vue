<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import Breadcrumb from 'primevue/breadcrumb';
import Badge from 'primevue/badge';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

// TypeScript interfaces
interface GroupMat {
    id: string;
    name: string;
    description: string;
}

interface Type2 {
    id: string;
    name: string;
    groupMatId: string;
}

interface Material {
    id: number;
    itemNo: string;
    description: string;
    unit: string;
    availableQty: number;
    unitCost: number;
    category: string;
    groupMatId: string;
    type2Id: string;
}

interface SelectedMaterial extends Material {
    requestedQty: number;
    totalCost: number;
}

// Mock data for GROUPMAT
const groupMats = ref<GroupMat[]>([
    { id: 'GM001', name: 'โลหะและอัลลอยด์', description: 'วัสดุโลหะทุกประเภท' },
    { id: 'GM002', name: 'วัสดุสิ้นเปลือง', description: 'วัสดุที่ใช้แล้วหมด' },
    { id: 'GM003', name: 'เครื่องมือและอุปกรณ์', description: 'เครื่องมือสำหรับการผลิต' },
    { id: 'GM004', name: 'สารเคมีและน้ำมัน', description: 'สารเคมีและน้ำมันหล่อลื่น' },
    { id: 'GM005', name: 'ชิ้นส่วนและฮาร์ดแวร์', description: 'ชิ้นส่วนต่างๆ' }
]);

// Mock data for Type2
const type2s = ref<Type2[]>([
    // โลหะและอัลลอยด์
    { id: 'T2001', name: 'เหล็กและเหล็กกล้า', groupMatId: 'GM001' },
    { id: 'T2002', name: 'อลูมิเนียม', groupMatId: 'GM001' },
    { id: 'T2003', name: 'ทองเหลือง', groupMatId: 'GM001' },
    
    // วัสดุสิ้นเปลือง
    { id: 'T2004', name: 'ลวดเชื่อม', groupMatId: 'GM002' },
    { id: 'T2005', name: 'แผ่นตัด', groupMatId: 'GM002' },
    { id: 'T2006', name: 'กระดาษทราย', groupMatId: 'GM002' },
    
    // เครื่องมือและอุปกรณ์
    { id: 'T2007', name: 'เครื่องมือตัด', groupMatId: 'GM003' },
    { id: 'T2008', name: 'เครื่องมือวัด', groupMatId: 'GM003' },
    { id: 'T2009', name: 'อุปกรณ์ยึดจับ', groupMatId: 'GM003' },
    
    // สารเคมีและน้ำมัน
    { id: 'T2010', name: 'น้ำมันหล่อลื่น', groupMatId: 'GM004' },
    { id: 'T2011', name: 'สี', groupMatId: 'GM004' },
    { id: 'T2012', name: 'ทินเนอร์', groupMatId: 'GM004' },
    
    // ชิ้นส่วนและฮาร์ดแวร์
    { id: 'T2013', name: 'แบริ่ง', groupMatId: 'GM005' },
    { id: 'T2014', name: 'น็อต-สกรู', groupMatId: 'GM005' },
    { id: 'T2015', name: 'ซีล-ปะเก็น', groupMatId: 'GM005' }
]);

// Mock data for materials
const allMaterials = ref<Material[]>([
    // โลหะและอัลลอยด์ - เหล็กและเหล็กกล้า
    {
        id: 1,
        itemNo: 'M001',
        description: 'Steel Rod 12mm',
        unit: 'KG',
        availableQty: 500,
        unitCost: 85.50,
        category: 'Raw Material',
        groupMatId: 'GM001',
        type2Id: 'T2001'
    },
    // โลหะและอัลลอยด์ - อลูมิเนียม
    {
        id: 2,
        itemNo: 'M002',
        description: 'Aluminum Sheet 3mm',
        unit: 'SQM',
        availableQty: 200,
        unitCost: 120.00,
        category: 'Raw Material',
        groupMatId: 'GM001',
        type2Id: 'T2002'
    },
    // วัสดุสิ้นเปลือง - ลวดเชื่อม
    {
        id: 3,
        itemNo: 'M003',
        description: 'Welding Rod 3.2mm',
        unit: 'KG',
        availableQty: 50,
        unitCost: 180.00,
        category: 'Consumable',
        groupMatId: 'GM002',
        type2Id: 'T2004'
    },
    // วัสดุสิ้นเปลือง - แผ่นตัด
    {
        id: 4,
        itemNo: 'M004',
        description: 'Cutting Disc 4 inch',
        unit: 'PCS',
        availableQty: 100,
        unitCost: 25.50,
        category: 'Tool',
        groupMatId: 'GM002',
        type2Id: 'T2005'
    },
    // สารเคมีและน้ำมัน - น้ำมันหล่อลื่น
    {
        id: 5,
        itemNo: 'M005',
        description: 'Hydraulic Oil SAE 32',
        unit: 'LTR',
        availableQty: 80,
        unitCost: 95.00,
        category: 'Lubricant',
        groupMatId: 'GM004',
        type2Id: 'T2010'
    },
    // ชิ้นส่วนและฮาร์ดแวร์ - แบริ่ง
    {
        id: 6,
        itemNo: 'M006',
        description: 'Bearing 6205-2RS',
        unit: 'PCS',
        availableQty: 30,
        unitCost: 150.00,
        category: 'Component',
        groupMatId: 'GM005',
        type2Id: 'T2013'
    },
    // ชิ้นส่วนและฮาร์ดแวร์ - น็อต-สกรู
    {
        id: 7,
        itemNo: 'M007',
        description: 'Bolt M8x30 Grade 8.8',
        unit: 'PCS',
        availableQty: 1000,
        unitCost: 3.50,
        category: 'Hardware',
        groupMatId: 'GM005',
        type2Id: 'T2014'
    },
    // สารเคมีและน้ำมัน - สี
    {
        id: 8,
        itemNo: 'M008',
        description: 'Paint Primer White',
        unit: 'LTR',
        availableQty: 25,
        unitCost: 220.00,
        category: 'Chemical',
        groupMatId: 'GM004',
        type2Id: 'T2011'
    }
]);

// Selection states
const selectedGroupMat = ref<GroupMat | null>(null);
const selectedType2 = ref<Type2 | null>(null);

// Selected materials and request quantities with proper typing
const selectedMaterials = ref<SelectedMaterial[]>([]);
const requestQuantities = ref<Record<number, number>>({});
const requestNote = ref<string>('');
const productionOrder = ref<string>('PO-2024-001');

// Filters for DataTable
const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    itemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    category: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

// Computed properties
const availableType2s = computed((): Type2[] => {
    if (!selectedGroupMat.value) return [];
    return type2s.value.filter(type2 => type2.groupMatId === selectedGroupMat.value?.id);
});

const materials = computed((): Material[] => {
    if (!selectedGroupMat.value || !selectedType2.value) return [];
    return allMaterials.value.filter(material => 
        material.groupMatId === selectedGroupMat.value?.id && 
        material.type2Id === selectedType2.value?.id
    );
});

const totalSelectedItems = computed((): number => selectedMaterials.value.length);
const totalEstimatedCost = computed((): number => {
    return selectedMaterials.value.reduce((total, item) => {
        return total + (item.requestedQty * item.unitCost);
    }, 0);
});

// Functions
function clearFilter(): void {
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        itemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        category: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    };
}

function addToRequest(material: Material): void {
    const quantity = requestQuantities.value[material.id];
    
    if (!quantity || quantity <= 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'แจ้งเตือน', 
            detail: 'กรุณาใส่จำนวนที่ต้องการเบิก', 
            life: 3000 
        });
        return;
    }
    
    if (quantity > material.availableQty) {
        toast.add({ 
            severity: 'error', 
            summary: 'ข้อผิดพลาด', 
            detail: `จำนวนที่เบิกเกินจำนวนที่มีในคลัง (มีเพียง ${material.availableQty} ${material.unit})`, 
            life: 3000 
        });
        return;
    }
    
    const existingIndex = selectedMaterials.value.findIndex(item => item.id === material.id);
    
    if (existingIndex >= 0) {
        selectedMaterials.value[existingIndex].requestedQty = quantity;
        selectedMaterials.value[existingIndex].totalCost = quantity * material.unitCost;
        toast.add({ 
            severity: 'success', 
            summary: 'อัปเดต', 
            detail: 'อัปเดตจำนวนสำเร็จ', 
            life: 3000 
        });
    } else {
        const newSelectedMaterial: SelectedMaterial = {
            ...material,
            requestedQty: quantity,
            totalCost: quantity * material.unitCost
        };
        selectedMaterials.value.push(newSelectedMaterial);
        toast.add({ 
            severity: 'success', 
            summary: 'เพิ่มแล้ว', 
            detail: 'เพิ่มรายการเบิกวัสดุสำเร็จ', 
            life: 3000 
        });
    }
}

function removeFromRequest(materialId: number): void {
    selectedMaterials.value = selectedMaterials.value.filter(item => item.id !== materialId);
    delete requestQuantities.value[materialId];
    toast.add({ 
        severity: 'info', 
        summary: 'ลบแล้ว', 
        detail: 'ลบรายการออกจากคำขอเบิกแล้ว', 
        life: 3000 
    });
}

function clearAllSelections(): void {
    selectedMaterials.value = [];
    requestQuantities.value = {};
    requestNote.value = '';
    toast.add({ 
        severity: 'info', 
        summary: 'เคลียร์แล้ว', 
        detail: 'ลบรายการที่เลือกทั้งหมดแล้ว', 
        life: 3000 
    });
}

function submitRequest(): void {
    if (selectedMaterials.value.length === 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'แจ้งเตือน', 
            detail: 'กรุณาเลือกวัสดุที่ต้องการเบิก', 
            life: 3000 
        });
        return;
    }
    
    // Simulate API call
    console.log('Submitting material request:', {
        productionOrder: productionOrder.value,
        materials: selectedMaterials.value,
        note: requestNote.value,
        totalCost: totalEstimatedCost.value
    });
    
    toast.add({ 
        severity: 'success', 
        summary: 'ส่งคำขอสำเร็จ', 
        detail: `ส่งคำขอเบิกวัสดุ ${totalSelectedItems.value} รายการสำเร็จ`, 
        life: 5000 
    });
    
    // Clear form after successful submission
    clearAllSelections();
}

function getCategoryBadgeStyle(category: string): string {
    const styles: Record<string, string> = {
        'Raw Material': 'bg-blue-100 text-blue-800',
        'Consumable': 'bg-orange-100 text-orange-800',
        'Tool': 'bg-green-100 text-green-800',
        'Lubricant': 'bg-purple-100 text-purple-800',
        'Component': 'bg-red-100 text-red-800',
        'Hardware': 'bg-gray-100 text-gray-800',
        'Chemical': 'bg-yellow-100 text-yellow-800'
    };
    return styles[category] || 'bg-gray-100 text-gray-800';
}

onMounted(() => {
    console.log('Material Request Page Loaded');
});

// Watch for group selection changes
watch(selectedGroupMat, (newGroupMat) => {
    selectedType2.value = null;
    clearAllSelections();
});

watch(selectedType2, () => {
    clearAllSelections();
});
</script>

<template>
    <Toast />
    
    <div class="p-6 space-y-6">
        <!-- Header Section -->
        <Card>
            <template #content>
              
                
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">เบิกวัสดุสำหรับการผลิต</h1>
                        <p class="text-gray-600">เลือกวัสดุที่ต้องการสำหรับใบสั่งผลิต: {{ productionOrder }}</p>
                    </div>
                    
                    <div class="flex gap-4 text-center">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">{{ totalSelectedItems }}</div>
                            <div class="text-sm text-gray-600">รายการที่เลือก</div>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">{{ totalEstimatedCost.toLocaleString() }}</div>
                            <div class="text-sm text-gray-600">ราคารวม (บาท)</div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Group Selection Card -->
        <Card>
            <template #header>
                <h2 class="text-xl font-semibold">เลือกกลุ่มวัสดุ</h2>
            </template>
            
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">กลุ่มวัสดุ (GROUPMAT)</label>
                        <Dropdown 
                            v-model="selectedGroupMat" 
                            :options="groupMats" 
                            option-label="name" 
                            placeholder="เลือกกลุ่มวัสดุ"
                            class="w-full"
                            show-clear
                        >
                            <template #option="slotProps">
                                <div class="p-2">
                                    <div class="font-medium">{{ slotProps.option.name }}</div>
                                    <div class="text-sm text-gray-500">{{ slotProps.option.description }}</div>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">ประเภทย่อย (Type2)</label>
                        <Dropdown 
                            v-model="selectedType2" 
                            :options="availableType2s" 
                            option-label="name" 
                            placeholder="เลือกประเภทย่อย"
                            class="w-full"
                            :disabled="!selectedGroupMat"
                            show-clear
                        />
                    </div>
                </div>
                
                <div v-if="selectedGroupMat && selectedType2" class="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div class="text-sm font-medium text-blue-900">
                        กลุ่มวัสดุที่เลือก: {{ selectedGroupMat.name }} → {{ selectedType2.name }}
                    </div>
                    <div class="text-sm text-blue-700 mt-1">
                        จำนวนวัสดุที่พบ: {{ materials.length }} รายการ
                    </div>
                </div>
                
                <div v-else class="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <div class="text-sm text-yellow-800">
                        กรุณาเลือกกลุ่มวัสดุและประเภทย่อยเพื่อแสดงรายการวัสดุ
                    </div>
                </div>
            </template>
        </Card>

        <!-- Material Selection Table -->
        <Card v-if="selectedGroupMat && selectedType2 && materials.length > 0">
            <template #header>
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <h2 class="text-xl font-semibold">รายการวัสดุที่มีในคลัง</h2>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <Button 
                            icon="pi pi-filter-slash" 
                            label="ล้างการค้นหา" 
                            severity="secondary" 
                            @click="clearFilter()" 
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText 
                                v-model="filters['global'].constraints[0].value" 
                                placeholder="ค้นหาวัสดุ..." 
                            />
                        </IconField>
                    </div>
                </div>
            </template>
            
            <template #content>
                <DataTable
                    :value="materials"
                    v-model:filters="filters"
                    paginator
                    :rows="10"
                    dataKey="id"
                    filterDisplay="menu"
                    showGridlines
                    rowHover
                    :globalFilterFields="['itemNo', 'description', 'category', 'unit']"
                    responsiveLayout="scroll"
                >
                    <Column field="itemNo" header="รหัสวัสดุ" sortable style="min-width: 120px"></Column>
                    
                    <Column field="description" header="รายละเอียด" sortable style="min-width: 250px"></Column>
                    
                    <Column field="category" header="หมวดหมู่" sortable style="min-width: 120px">
                        <template #body="slotProps">
                            <span :class="`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeStyle(slotProps.data.category)}`">
                                {{ slotProps.data.category }}
                            </span>
                        </template>
                    </Column>
                    
                    <Column field="availableQty" header="จำนวนในคลัง" sortable style="min-width: 130px">
                        <template #body="slotProps">
                            <span :class="slotProps.data.availableQty > 50 ? 'text-green-600 font-semibold' : 
                                           slotProps.data.availableQty > 10 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'">
                                {{ slotProps.data.availableQty }} {{ slotProps.data.unit }}
                            </span>
                        </template>
                    </Column>
                    
                    <Column field="unitCost" header="ราคาต่อหน่วย" sortable style="min-width: 120px">
                        <template #body="slotProps">
                            ฿{{ slotProps.data.unitCost.toLocaleString() }}
                        </template>
                    </Column>
                    
                    <Column header="จำนวนที่เบิก" style="min-width: 150px">
                        <template #body="slotProps">
                            <InputNumber 
                                v-model="requestQuantities[slotProps.data.id]" 
                                :min="0" 
                                :max="slotProps.data.availableQty"
                                placeholder="0"
                                class="w-full"
                                size="small"
                                :suffix="` ${slotProps.data.unit}`"
                            />
                        </template>
                    </Column>
                    
                    <Column header="การดำเนินการ" style="min-width: 150px">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-plus" 
                                    size="small" 
                                    severity="success"
                                    @click="addToRequest(slotProps.data)"
                                    :disabled="!requestQuantities[slotProps.data.id] || requestQuantities[slotProps.data.id] <= 0"
                                    v-tooltip.top="'เพิ่มในรายการเบิก'"
                                />
                                <Button 
                                    icon="pi pi-minus" 
                                    size="small" 
                                    severity="danger"
                                    @click="removeFromRequest(slotProps.data.id)"
                                    :disabled="!selectedMaterials.find(item => item.id === slotProps.data.id)"
                                    v-tooltip.top="'ลบออกจากรายการเบิก'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- No Materials Found -->
        <Card v-if="selectedGroupMat && selectedType2 && materials.length === 0">
            <template #content>
                <div class="text-center py-8">
                    <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่พบวัสดุในกลุ่มที่เลือก</h3>
                    <p class="text-gray-500">ไม่มีวัสดุในกลุ่ม "{{ selectedGroupMat.name }}" ประเภท "{{ selectedType2.name }}"</p>
                </div>
            </template>
        </Card>

        <!-- Selected Materials Summary -->
        <Card v-if="selectedMaterials.length > 0">
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-semibold">สรุปรายการที่เลือกเบิก</h2>
                    <Badge :value="totalSelectedItems" severity="info"></Badge>
                </div>
            </template>
            
            <template #content>
                <DataTable :value="selectedMaterials" class="mb-4">
                    <Column field="itemNo" header="รหัสวัสดุ"></Column>
                    <Column field="description" header="รายละเอียด"></Column>
                    <Column field="requestedQty" header="จำนวนเบิก">
                        <template #body="slotProps">
                            {{ slotProps.data.requestedQty }} {{ slotProps.data.unit }}
                        </template>
                    </Column>
                    <Column field="unitCost" header="ราคาต่อหน่วย">
                        <template #body="slotProps">
                            ฿{{ slotProps.data.unitCost.toLocaleString() }}
                        </template>
                    </Column>
                    <Column header="ราคารวม">
                        <template #body="slotProps">
                            ฿{{ (slotProps.data.requestedQty * slotProps.data.unitCost).toLocaleString() }}
                        </template>
                    </Column>
                    <Column header="การดำเนินการ">
                        <template #body="slotProps">
                            <Button 
                                icon="pi pi-trash" 
                                size="small" 
                                severity="danger"
                                @click="removeFromRequest(slotProps.data.id)"
                                v-tooltip.top="'ลบออกจากรายการ'"
                            />
                        </template>
                    </Column>
                </DataTable>
                
                <!-- Request Note -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                    <InputText 
                        v-model="requestNote" 
                        placeholder="ระบุหมายเหตุเพิ่มเติม..." 
                        class="w-full"
                    />
                </div>
                
                <!-- Summary and Action Buttons -->
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 pt-4 border-t">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-600">ราคารวมทั้งหมด</div>
                        <div class="text-2xl font-bold text-gray-900">฿{{ totalEstimatedCost.toLocaleString() }}</div>
                    </div>
                    
                    <div class="flex gap-2">
                        <Button 
                            label="ลบทั้งหมด" 
                            icon="pi pi-trash" 
                            severity="secondary" 
                            @click="clearAllSelections()" 
                        />
                        <Button 
                            label="ส่งคำขอเบิกวัสดุ" 
                            icon="pi pi-check" 
                            @click="submitRequest()" 
                        />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
