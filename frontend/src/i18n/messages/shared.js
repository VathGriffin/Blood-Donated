// Components shared by the hospital and admin dashboards (reschedule requests, stock alerts and
// charts, the QR scanner).
const messages = {
  en: {
    "resched": {
      "approvedDone": "Approved. {name}’s appointment is now on {when}.",
      "declinedDone": "Declined. {name}’s appointment stays on {when}.",
      "saveFailed": "Could not save the decision. Please try again.",
      "title": "Reschedule requests",
      "lead": "Donors asking to move a confirmed appointment. Their current slot is kept until you approve.",
      "none": "No requests waiting.",
      "requestedAt": "Requested {date}",
      "current": "Current",
      "to": "to",
      "requested": "Requested",
      "reject": "Reject",
      "approve": "Approve",
      "approveTitle": "Approve the new date?",
      "rejectTitle": "Reject this request?",
      "approveText": "{name}’s appointment will move from {from} to {to}. Availability is checked again before saving.",
      "rejectText": "{name}’s appointment stays on {when}.",
      "noteLabel": "Note to the donor (optional)",
      "reasonLabel": "Reason for the donor (recommended)",
      "back": "Back"
    },
    "lowStock": {
      "bloodType": "Blood Type",
      "current": "Current Stock",
      "status": "Status",
      "title": "Low Stock Alert",
      "viewAll": "View All",
      "none": "No inventory recorded",
      "noneText": "Alerts appear once stock levels are entered.",
      "allGood": "Every blood type is adequately stocked.",
      "update": "Update stock"
    },
    "scanner": {
      "camera": "Could not access the camera. Check browser permissions and try again.",
      "starting": "Starting camera…",
      "point": "Point the camera at a donor’s QR card."
    },
    "charts": {
      "inStock": {
        "one": "{units} unit in stock",
        "other": "{units} units in stock"
      },
      "minimum": "Minimum {min}",
      "bloodType": "Blood type",
      "units": "Units",
      "total": "Total Units"
    },
    // @end-en
  },
  km: {
    "resched": {
      "approvedDone": "បានយល់ព្រម។ ការណាត់ជួបរបស់ {name} ឥឡូវនេះគឺនៅ {when}។",
      "declinedDone": "បានបដិសេធ។ ការណាត់ជួបរបស់ {name} នៅតែ {when}។",
      "saveFailed": "មិនអាចរក្សាទុកការសម្រេចចិត្តបានទេ។ សូមព្យាយាមម្តងទៀត។",
      "title": "សំណើប្តូរកាលវិភាគ",
      "lead": "អ្នកបរិច្ចាគដែលស្នើប្តូរការណាត់ជួបដែលបានបញ្ជាក់។ ម៉ោងបច្ចុប្បន្នរបស់ពួកគេត្រូវបានរក្សាទុករហូតដល់អ្នកយល់ព្រម។",
      "none": "មិនមានសំណើកំពុងរង់ចាំ។",
      "requestedAt": "បានស្នើ {date}",
      "current": "បច្ចុប្បន្ន",
      "to": "ទៅ",
      "requested": "បានស្នើ",
      "reject": "បដិសេធ",
      "approve": "យល់ព្រម",
      "approveTitle": "យល់ព្រមកាលបរិច្ឆេទថ្មី?",
      "rejectTitle": "បដិសេធសំណើនេះ?",
      "approveText": "ការណាត់ជួបរបស់ {name} នឹងប្តូរពី {from} ទៅ {to}។ ភាពទំនេរនឹងត្រូវពិនិត្យម្តងទៀតមុនពេលរក្សាទុក។",
      "rejectText": "ការណាត់ជួបរបស់ {name} នៅតែ {when}។",
      "noteLabel": "កំណត់ចំណាំទៅអ្នកបរិច្ចាគ (ស្រេចចិត្ត)",
      "reasonLabel": "មូលហេតុសម្រាប់អ្នកបរិច្ចាគ (ណែនាំ)",
      "back": "ត្រឡប់ក្រោយ"
    },
    "lowStock": {
      "bloodType": "ប្រភេទឈាម",
      "current": "ស្តុកបច្ចុប្បន្ន",
      "status": "ស្ថានភាព",
      "title": "ការជូនដំណឹងស្តុកទាប",
      "viewAll": "មើលទាំងអស់",
      "none": "មិនទាន់មានស្តុកត្រូវបានកត់ត្រា",
      "noneText": "ការជូនដំណឹងនឹងបង្ហាញនៅពេលបញ្ចូលកម្រិតស្តុក។",
      "allGood": "គ្រប់ប្រភេទឈាមមានស្តុកគ្រប់គ្រាន់។",
      "update": "ធ្វើបច្ចុប្បន្នភាពស្តុក"
    },
    "scanner": {
      "camera": "មិនអាចចូលប្រើកាមេរ៉ាបានទេ។ សូមពិនិត្យការអនុញ្ញាតកម្មវិធីរុករក ហើយព្យាយាមម្តងទៀត។",
      "starting": "កំពុងបើកកាមេរ៉ា…",
      "point": "តម្រង់កាមេរ៉ាទៅកាត QR របស់អ្នកបរិច្ចាគ។"
    },
    "charts": {
      "inStock": {
        "one": "{units} ឯកតាក្នុងស្តុក",
        "other": "{units} ឯកតាក្នុងស្តុក"
      },
      "minimum": "អប្បបរមា {min}",
      "bloodType": "ប្រភេទឈាម",
      "units": "ឯកតា",
      "total": "ឯកតាសរុប"
    },
    // @end-km
  },
  vi: {
    "resched": {
      "approvedDone": "Đã duyệt. Lịch hẹn của {name} giờ là {when}.",
      "declinedDone": "Đã từ chối. Lịch hẹn của {name} giữ nguyên vào {when}.",
      "saveFailed": "Không thể lưu quyết định. Vui lòng thử lại.",
      "title": "Yêu cầu dời lịch",
      "lead": "Người hiến muốn dời lịch hẹn đã xác nhận. Khung giờ hiện tại được giữ cho đến khi bạn duyệt.",
      "none": "Không có yêu cầu đang chờ.",
      "requestedAt": "Yêu cầu lúc {date}",
      "current": "Hiện tại",
      "to": "sang",
      "requested": "Yêu cầu",
      "reject": "Từ chối",
      "approve": "Duyệt",
      "approveTitle": "Duyệt ngày mới?",
      "rejectTitle": "Từ chối yêu cầu này?",
      "approveText": "Lịch hẹn của {name} sẽ dời từ {from} sang {to}. Tình trạng chỗ trống sẽ được kiểm tra lại trước khi lưu.",
      "rejectText": "Lịch hẹn của {name} giữ nguyên vào {when}.",
      "noteLabel": "Ghi chú cho người hiến (không bắt buộc)",
      "reasonLabel": "Lý do cho người hiến (nên ghi)",
      "back": "Quay lại"
    },
    "lowStock": {
      "bloodType": "Nhóm máu",
      "current": "Tồn kho hiện tại",
      "status": "Trạng thái",
      "title": "Cảnh báo thiếu máu",
      "viewAll": "Xem tất cả",
      "none": "Chưa ghi nhận tồn kho",
      "noneText": "Cảnh báo sẽ hiện khi đã nhập mức tồn kho.",
      "allGood": "Mọi nhóm máu đều đủ.",
      "update": "Cập nhật kho"
    },
    "scanner": {
      "camera": "Không thể truy cập máy ảnh. Hãy kiểm tra quyền của trình duyệt và thử lại.",
      "starting": "Đang mở máy ảnh…",
      "point": "Hướng máy ảnh vào thẻ QR của người hiến."
    },
    "charts": {
      "inStock": {
        "one": "{units} đơn vị trong kho",
        "other": "{units} đơn vị trong kho"
      },
      "minimum": "Tối thiểu {min}",
      "bloodType": "Nhóm máu",
      "units": "Đơn vị",
      "total": "Tổng số đơn vị"
    },
    // @end-vi
  },
};

export default messages;
