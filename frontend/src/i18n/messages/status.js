// Status words the API stores (request, appointment, urgency, stock and donor states), shown by
// StatusBadge and the status filters. The key is the value exactly as the API sends it.
const messages = {
  en: {
    All: 'All',
    Pending: 'Pending', Approved: 'Approved', Fulfilled: 'Fulfilled', Rejected: 'Rejected', Cancelled: 'Cancelled',
    Confirmed: 'Confirmed', CheckedIn: 'Checked in', Completed: 'Completed',
    Low: 'Low', Medium: 'Medium', High: 'High', Critical: 'Critical',
    adequate: 'Adequate', low: 'Low', critical: 'Critical', empty: 'Empty',
    Available: 'Available', Unavailable: 'Unavailable',
    stock: { adequate: 'Adequate', low: 'Low', critical: 'Critical', empty: 'Out of stock' },
    component: { 'Whole Blood': 'Whole Blood', 'Red Blood Cells': 'Red Blood Cells', Plasma: 'Plasma', Platelets: 'Platelets' },
  },
  km: {
    All: 'ទាំងអស់',
    Pending: 'កំពុងរង់ចាំ', Approved: 'បានយល់ព្រម', Fulfilled: 'បានបំពេញ', Rejected: 'បានបដិសេធ', Cancelled: 'បានលុបចោល',
    Confirmed: 'បានបញ្ជាក់', CheckedIn: 'បានចុះឈ្មោះចូល', Completed: 'បានបញ្ចប់',
    Low: 'ទាប', Medium: 'មធ្យម', High: 'ខ្ពស់', Critical: 'បន្ទាន់បំផុត',
    adequate: 'គ្រប់គ្រាន់', low: 'ទាប', critical: 'ធ្ងន់ធ្ងរ', empty: 'អស់',
    Available: 'ទំនេរ', Unavailable: 'មិនទំនេរ',
    stock: { adequate: 'គ្រប់គ្រាន់', low: 'ទាប', critical: 'ធ្ងន់ធ្ងរ', empty: 'អស់ស្តុក' },
    component: { 'Whole Blood': 'ឈាមទាំងមូល', 'Red Blood Cells': 'កោសិកាឈាមក្រហម', Plasma: 'ប្លាស្មា', Platelets: 'ប្លាកែត' },
  },
  vi: {
    All: 'Tất cả',
    Pending: 'Đang chờ', Approved: 'Đã duyệt', Fulfilled: 'Đã hoàn tất', Rejected: 'Đã từ chối', Cancelled: 'Đã hủy',
    Confirmed: 'Đã xác nhận', CheckedIn: 'Đã check-in', Completed: 'Đã hoàn thành',
    Low: 'Thấp', Medium: 'Trung bình', High: 'Cao', Critical: 'Khẩn cấp',
    adequate: 'Đủ', low: 'Thấp', critical: 'Nguy cấp', empty: 'Hết',
    Available: 'Sẵn sàng', Unavailable: 'Không sẵn sàng',
    stock: { adequate: 'Đủ', low: 'Thấp', critical: 'Nguy cấp', empty: 'Hết hàng' },
    component: { 'Whole Blood': 'Máu toàn phần', 'Red Blood Cells': 'Hồng cầu', Plasma: 'Huyết tương', Platelets: 'Tiểu cầu' },
  },
};

export default messages;
