// Notification bell items. The API sends each item with a key and raw values (i18n field,
// Backend/src/notification/notification.routes.js); see lib/feed-text.js.
const messages = {
  en: {
      "common": {
          "when": "{date}, {time}",
          "whenAt": "{date}, {time} at {place}",
          "requestFor": "{type} for {patient}",
          "requestForAt": "{type} for {patient} at {hospital}"
      },
      "units": {
          "one": "{count} unit",
          "other": "{count} units"
      },
      "donor": {
          "reply": "New reply from the BloodLife team",
          "appt": {
              "Confirmed": "Appointment confirmed",
              "Cancelled": "Appointment cancelled",
              "CheckedIn": "Thank you for donating!"
          },
          "donationRecorded": "Your donation has been recorded.",
          "donationRecordedAt": "Your donation at {place} has been recorded.",
          "rescheduleApproved": "Hospital approved the new date",
          "moved": "Your appointment has been moved to {date}, {time}.",
          "movedAt": "Your appointment at {place} has been moved to {date}, {time}.",
          "rescheduleDeclined": "Reschedule request declined",
          "stays": "Your appointment stays on {date}, {time}.",
          "staysAt": "Your appointment stays on {date}, {time} at {place}.",
          "reminderToday": "Your appointment is today",
          "reminderTomorrow": "Your appointment is tomorrow",
          "reminderOn": "Your appointment is on {date}",
          "bringId": "{time}. Remember to bring a photo ID.",
          "bringIdAt": "{time} at {place}. Remember to bring a photo ID.",
          "request": {
              "Approved": "Blood request approved",
              "Rejected": "Blood request not approved",
              "Fulfilled": "Blood request fulfilled"
          }
      },
      "staff": {
          "criticalRequest": "Critical blood request",
          "newRequest": "New blood request",
          "request": "{type} · {units} for {patient}",
          "requestUrgency": "{type} · {units} for {patient} · urgency: {urgency}",
          "requestAt": "{type} · {units} for {patient} at {hospital}",
          "requestUrgencyAt": "{type} · {units} for {patient} at {hospital} · urgency: {urgency}",
          "requestCancelled": "Blood request cancelled by the requester",
          "newAppointment": "New appointment booked",
          "booked": "{name} · {date}, {time}",
          "bookedAt": "{name} · {date}, {time} at {place}",
          "bookedType": "{name} ({type}) · {date}, {time}",
          "rescheduleRequested": "Reschedule requested",
          "move": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime}",
          "moveAt": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime} at {place}",
          "messageFrom": "New message from {name}",
          "newDonor": "New donor registered",
          "outOfStock": "{type} is out of stock",
          "lowStock": "{type} stock is critically low",
          "stockLeft": "{count} of minimum {min} units left",
          "stockLeftCentral": "{count} of minimum {min} units left in the central inventory",
          "donorCancelled": "Donor cancelled an appointment",
          "donorReschedule": "Donor asked to reschedule",
          "todayBooked": {
              "one": "{count} donor booked for today",
              "other": "{count} donors booked for today"
          },
          "todayToConfirm": "{count} still to confirm — check donors in as they arrive.",
          "todayAllConfirmed": "All confirmed — check donors in as they arrive."
      }
  },
  km: {
      "common": {
          "when": "{date}, {time}",
          "whenAt": "{date}, {time} នៅ {place}",
          "requestFor": "{type} សម្រាប់ {patient}",
          "requestForAt": "{type} សម្រាប់ {patient} នៅ {hospital}"
      },
      "units": {
          "one": "{count} ឯកតា",
          "other": "{count} ឯកតា"
      },
      "donor": {
          "reply": "ការឆ្លើយតបថ្មីពីក្រុម BloodLife",
          "appt": {
              "Confirmed": "ការណាត់ជួបត្រូវបានបញ្ជាក់",
              "Cancelled": "ការណាត់ជួបត្រូវបានលុបចោល",
              "CheckedIn": "សូមអរគុណសម្រាប់ការបរិច្ចាគ!"
          },
          "donationRecorded": "ការបរិច្ចាគរបស់អ្នកត្រូវបានកត់ត្រា។",
          "donationRecordedAt": "ការបរិច្ចាគរបស់អ្នកនៅ {place} ត្រូវបានកត់ត្រា។",
          "rescheduleApproved": "មន្ទីរពេទ្យបានយល់ព្រមកាលបរិច្ឆេទថ្មី",
          "moved": "ការណាត់ជួបរបស់អ្នកត្រូវបានប្តូរទៅ {date}, {time}។",
          "movedAt": "ការណាត់ជួបរបស់អ្នកនៅ {place} ត្រូវបានប្តូរទៅ {date}, {time}។",
          "rescheduleDeclined": "សំណើប្តូរកាលវិភាគត្រូវបានបដិសេធ",
          "stays": "ការណាត់ជួបរបស់អ្នកនៅតែ {date}, {time}។",
          "staysAt": "ការណាត់ជួបរបស់អ្នកនៅតែ {date}, {time} នៅ {place}។",
          "reminderToday": "ការណាត់ជួបរបស់អ្នកគឺថ្ងៃនេះ",
          "reminderTomorrow": "ការណាត់ជួបរបស់អ្នកគឺថ្ងៃស្អែក",
          "reminderOn": "ការណាត់ជួបរបស់អ្នកគឺនៅ {date}",
          "bringId": "{time}។ កុំភ្លេចយកអត្តសញ្ញាណប័ណ្ណមានរូបថតមកជាមួយ។",
          "bringIdAt": "{time} នៅ {place}។ កុំភ្លេចយកអត្តសញ្ញាណប័ណ្ណមានរូបថតមកជាមួយ។",
          "request": {
              "Approved": "សំណើឈាមត្រូវបានយល់ព្រម",
              "Rejected": "សំណើឈាមមិនត្រូវបានយល់ព្រម",
              "Fulfilled": "សំណើឈាមត្រូវបានបំពេញ"
          }
      },
      "staff": {
          "criticalRequest": "សំណើឈាមបន្ទាន់",
          "newRequest": "សំណើឈាមថ្មី",
          "request": "{type} · {units} សម្រាប់ {patient}",
          "requestUrgency": "{type} · {units} សម្រាប់ {patient} · ភាពបន្ទាន់៖ {urgency}",
          "requestAt": "{type} · {units} សម្រាប់ {patient} នៅ {hospital}",
          "requestUrgencyAt": "{type} · {units} សម្រាប់ {patient} នៅ {hospital} · ភាពបន្ទាន់៖ {urgency}",
          "requestCancelled": "សំណើឈាមត្រូវបានលុបចោលដោយអ្នកស្នើ",
          "newAppointment": "ការណាត់ជួបថ្មីត្រូវបានកក់",
          "booked": "{name} · {date}, {time}",
          "bookedAt": "{name} · {date}, {time} នៅ {place}",
          "bookedType": "{name} ({type}) · {date}, {time}",
          "rescheduleRequested": "បានស្នើប្តូរកាលវិភាគ",
          "move": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime}",
          "moveAt": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime} នៅ {place}",
          "messageFrom": "សារថ្មីពី {name}",
          "newDonor": "អ្នកបរិច្ចាគថ្មីបានចុះឈ្មោះ",
          "outOfStock": "{type} អស់ស្តុក",
          "lowStock": "ស្តុក {type} ទាបខ្លាំង",
          "stockLeft": "នៅសល់ {count} ក្នុងចំណោមអប្បបរមា {min} ឯកតា",
          "stockLeftCentral": "នៅសល់ {count} ក្នុងចំណោមអប្បបរមា {min} ឯកតា ក្នុងស្តុកកណ្តាល",
          "donorCancelled": "អ្នកបរិច្ចាគបានលុបចោលការណាត់ជួប",
          "donorReschedule": "អ្នកបរិច្ចាគបានស្នើប្តូរកាលវិភាគ",
          "todayBooked": {
              "one": "អ្នកបរិច្ចាគ {count} នាក់បានកក់សម្រាប់ថ្ងៃនេះ",
              "other": "អ្នកបរិច្ចាគ {count} នាក់បានកក់សម្រាប់ថ្ងៃនេះ"
          },
          "todayToConfirm": "នៅសល់ {count} ត្រូវបញ្ជាក់ — ចុះឈ្មោះអ្នកបរិច្ចាគចូលពេលពួកគេមកដល់។",
          "todayAllConfirmed": "បានបញ្ជាក់ទាំងអស់ — ចុះឈ្មោះអ្នកបរិច្ចាគចូលពេលពួកគេមកដល់។"
      }
  },
  vi: {
      "common": {
          "when": "{date}, {time}",
          "whenAt": "{date}, {time} tại {place}",
          "requestFor": "{type} cho {patient}",
          "requestForAt": "{type} cho {patient} tại {hospital}"
      },
      "units": {
          "one": "{count} đơn vị",
          "other": "{count} đơn vị"
      },
      "donor": {
          "reply": "Phản hồi mới từ đội BloodLife",
          "appt": {
              "Confirmed": "Lịch hẹn đã được xác nhận",
              "Cancelled": "Lịch hẹn đã bị hủy",
              "CheckedIn": "Cảm ơn bạn đã hiến máu!"
          },
          "donationRecorded": "Lần hiến máu của bạn đã được ghi nhận.",
          "donationRecordedAt": "Lần hiến máu của bạn tại {place} đã được ghi nhận.",
          "rescheduleApproved": "Bệnh viện đã duyệt ngày mới",
          "moved": "Lịch hẹn của bạn đã được dời sang {date}, {time}.",
          "movedAt": "Lịch hẹn của bạn tại {place} đã được dời sang {date}, {time}.",
          "rescheduleDeclined": "Yêu cầu dời lịch bị từ chối",
          "stays": "Lịch hẹn của bạn giữ nguyên vào {date}, {time}.",
          "staysAt": "Lịch hẹn của bạn giữ nguyên vào {date}, {time} tại {place}.",
          "reminderToday": "Lịch hẹn của bạn là hôm nay",
          "reminderTomorrow": "Lịch hẹn của bạn là ngày mai",
          "reminderOn": "Lịch hẹn của bạn vào {date}",
          "bringId": "{time}. Nhớ mang giấy tờ tùy thân có ảnh.",
          "bringIdAt": "{time} tại {place}. Nhớ mang giấy tờ tùy thân có ảnh.",
          "request": {
              "Approved": "Yêu cầu máu đã được duyệt",
              "Rejected": "Yêu cầu máu không được duyệt",
              "Fulfilled": "Yêu cầu máu đã hoàn tất"
          }
      },
      "staff": {
          "criticalRequest": "Yêu cầu máu khẩn cấp",
          "newRequest": "Yêu cầu máu mới",
          "request": "{type} · {units} cho {patient}",
          "requestUrgency": "{type} · {units} cho {patient} · mức khẩn cấp: {urgency}",
          "requestAt": "{type} · {units} cho {patient} tại {hospital}",
          "requestUrgencyAt": "{type} · {units} cho {patient} tại {hospital} · mức khẩn cấp: {urgency}",
          "requestCancelled": "Người yêu cầu đã hủy yêu cầu máu",
          "newAppointment": "Có lịch hẹn mới",
          "booked": "{name} · {date}, {time}",
          "bookedAt": "{name} · {date}, {time} tại {place}",
          "bookedType": "{name} ({type}) · {date}, {time}",
          "rescheduleRequested": "Có yêu cầu dời lịch",
          "move": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime}",
          "moveAt": "{name} · {fromDate}, {fromTime} → {toDate}, {toTime} tại {place}",
          "messageFrom": "Tin nhắn mới từ {name}",
          "newDonor": "Người hiến mới đăng ký",
          "outOfStock": "{type} đã hết",
          "lowStock": "Kho {type} thấp nghiêm trọng",
          "stockLeft": "Còn {count} / tối thiểu {min} đơn vị",
          "stockLeftCentral": "Còn {count} / tối thiểu {min} đơn vị trong kho trung tâm",
          "donorCancelled": "Người hiến đã hủy lịch hẹn",
          "donorReschedule": "Người hiến muốn dời lịch",
          "todayBooked": {
              "one": "{count} người hiến đặt lịch hôm nay",
              "other": "{count} người hiến đặt lịch hôm nay"
          },
          "todayToConfirm": "Còn {count} chờ xác nhận — check-in người hiến khi họ đến.",
          "todayAllConfirmed": "Đã xác nhận tất cả — check-in người hiến khi họ đến."
      }
  },
};

export default messages;
