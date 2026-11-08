// Shared UI building blocks (components/ui).
const messages = {
  en: {
    breadcrumb: 'Breadcrumb',
    rowActions: 'Row actions',
    trend: {
      new: '{current} new vs {previous} prior',
      joined: '{current} joined vs {previous} prior',
      last30: '{current} in 30 days vs {previous} prior',
      recorded: '{current} recorded vs {previous} prior',
      added: '{current} added vs {previous} prior',
      unavailable: 'Trend unavailable',
    },
    pagination: {
      showing: 'Showing {from}–{to} of {total} {items}',
      items: {
        item: { one: 'item', other: 'items' },
        donor: { one: 'donor', other: 'donors' },
        request: { one: 'request', other: 'requests' },
        appointment: { one: 'appointment', other: 'appointments' },
        hospital: { one: 'hospital', other: 'hospitals' },
        message: { one: 'message', other: 'messages' },
      },
      pages: 'Pages',
      rows: 'Rows',
      rowsPerPage: 'Rows per page',
    },
  },
  km: {
    breadcrumb: 'ផ្លូវរុករក',
    rowActions: 'សកម្មភាពជួរ',
    trend: {
      new: 'ថ្មី {current} ធៀបនឹង {previous} មុននេះ',
      joined: 'ចូលរួម {current} ធៀបនឹង {previous} មុននេះ',
      last30: '{current} ក្នុង ៣០ ថ្ងៃ ធៀបនឹង {previous} មុននេះ',
      recorded: 'កត់ត្រា {current} ធៀបនឹង {previous} មុន',
      added: 'បន្ថែម {current} ធៀបនឹង {previous} មុន',
      unavailable: 'មិនមាននិន្នាការ',
    },
    pagination: {
      showing: 'បង្ហាញ {from}–{to} ក្នុងចំណោម {total} {items}',
      items: {
        item: { one: 'ធាតុ', other: 'ធាតុ' },
        donor: { one: 'អ្នកបរិច្ចាគ', other: 'អ្នកបរិច្ចាគ' },
        request: { one: 'សំណើ', other: 'សំណើ' },
        appointment: { one: 'ការណាត់ជួប', other: 'ការណាត់ជួប' },
        hospital: { one: 'មន្ទីរពេទ្យ', other: 'មន្ទីរពេទ្យ' },
        message: { one: 'សារ', other: 'សារ' },
      },
      pages: 'ទំព័រ',
      rows: 'ជួរ',
      rowsPerPage: 'ជួរក្នុងមួយទំព័រ',
    },
  },
  vi: {
    breadcrumb: 'Đường dẫn',
    rowActions: 'Thao tác trên dòng',
    trend: {
      new: '{current} mới so với {previous} kỳ trước',
      joined: '{current} tham gia so với {previous} kỳ trước',
      last30: '{current} trong 30 ngày so với {previous} kỳ trước',
      recorded: '{current} ghi nhận so với {previous} trước đó',
      added: '{current} thêm mới so với {previous} trước đó',
      unavailable: 'Chưa có xu hướng',
    },
    pagination: {
      showing: 'Hiển thị {from}–{to} trong {total} {items}',
      items: {
        item: { one: 'mục', other: 'mục' },
        donor: { one: 'người hiến máu', other: 'người hiến máu' },
        request: { one: 'yêu cầu', other: 'yêu cầu' },
        appointment: { one: 'lịch hẹn', other: 'lịch hẹn' },
        hospital: { one: 'bệnh viện', other: 'bệnh viện' },
        message: { one: 'tin nhắn', other: 'tin nhắn' },
      },
      pages: 'Trang',
      rows: 'Dòng',
      rowsPerPage: 'Số dòng mỗi trang',
    },
  },
};

export default messages;
