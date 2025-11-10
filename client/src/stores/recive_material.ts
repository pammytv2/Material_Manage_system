function getIQAStatusText(iqa: number | string | null | undefined) {
    if (iqa === 0 || iqa === '0') return 'No';
    if (iqa === 1 || iqa === '1') return 'Yes';
    if (iqa === 2 || iqa === '2' || iqa === null || iqa === undefined || iqa === '') return 'Not Specified';
    return 'Not Specified';
}

function getIQARequiredClass(text: string) {
    switch (text) {
        case 'No':
            return 'bg-red-100 text-red-700 font-semibold transition-colors duration-200 px-2 py-1 rounded';
        case 'Yes':
            return 'bg-green-100 text-green-700 font-semibold transition-colors duration-200 px-2 py-1 rounded';
        case 'Not Specified':
            return 'bg-amber-100 text-amber-700 font-semibold transition-colors duration-200 px-2 py-1 rounded border border-amber-300';
        default:
            return 'bg-white text-gray-900 transition-colors duration-200 px-2 py-1 rounded border';
    }
}

function getLotSplitStatusText(lotSplit: number | string) {
    if (lotSplit === 0 || lotSplit === '0') return 'No';
    if (lotSplit === 1 || lotSplit === '1') return 'Yes';
    return 'Not Specified';
}
function getLotSplitStatusClass(status: string) {
    switch (status) {
        case 'No':
            return 'bg-red-100 text-red-700 font-semibold transition-colors duration-200';
        case 'Yes':
            return 'bg-green-100 text-green-700 font-semibold transition-colors duration-200';
        case 'Not Specified':
            return 'bg-gray-100 text-gray-700 font-semibold transition-colors duration-200';
        default:
            return 'bg-white text-gray-900 transition-colors duration-200';
    }
}

function getIqaApprovalClass(status: string) {  
    switch (status) {
        case 'Inspected by IQA':
            return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
        case 'Pending IQA Approval':
            return 'bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded';
        case 'Failed Inspection':
            return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
        default:
            return 'bg-gray-100 text-gray-700 px-2 py-1 rounded';
    }
}

function getIqaResultClass(status: string) {
    switch (status) {
        case 'PASS':
            return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
        case 'REWORK':
            return 'bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded';
        case 'REJECT':
            return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
        case 'IN':
            return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
        case 'OUT':
            return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
        default:
            return 'bg-gray-100 text-gray-700 px-2 py-1 rounded';
    }
}

function getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateString: string) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
}
function getIQAStatusTextD(status: string) {
    switch (status) {
        case 'IQA ตรวจสอบแล้ว':
            return 'IQA ตรวจสอบแล้ว';
        case 'IQA ตรวจสอบแล้ว ไม่ผ่าน':
            return 'IQA ตรวจสอบแล้ว ไม่ผ่าน';
        case 'รอIQAตรวจสอบ':
            return 'รอIQAตรวจสอบ';
        case 'IQA ตรวจแล้วส่งแก้ไข':
            return 'IQA ตรวจแล้วส่งแก้ไข';
        case 'ส่งใหม่หลังแก้ไข':
            return 'ส่งใหม่หลังแก้ไข';
    }
}
function getIqaResultClassD(status: string) {
    switch (status) {
        case 'IQA ตรวจสอบแล้ว':
            return 'bg-green-100 text-green-700 font-semibold px-2 py-1 rounded';
        case 'IQA ตรวจสอบแล้ว ไม่ผ่าน':
            return 'bg-red-100 text-red-700 font-semibold px-2 py-1 rounded';
        case 'รอIQAตรวจสอบ':
            return 'bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded';
        case 'IQA ตรวจแล้วส่งแก้ไข':
            return 'bg-orange-100 text-orange-700 font-semibold px-2 py-1 rounded';
        case 'ส่งใหม่หลังแก้ไข':
            return 'bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded';
        default:
            return 'bg-gray-100 text-gray-700 px-2 py-1 rounded';
    }
}

export { getIqaResultClassD,getIQAStatusTextD,getIqaResultClass, getIqaApprovalClass, getIQARequiredClass, formatDate, getTodayStr, getLotSplitStatusText, getIQAStatusText, getLotSplitStatusClass };
