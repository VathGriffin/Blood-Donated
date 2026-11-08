// The full-page assistant (/assistant). The floating chat widget has its own texts in
// components/chat/chat-i18n.js; both follow the site language.
const messages = {
  en: {
    helpTitle: 'How can I help you today?',
    helpLead: 'Ask about eligibility, blood types, appointments, or anything about donating.',
    name: 'BloodLife Assistant',
    startHint: 'Ask a question below to get started',
    emptyHint: 'Pick a suggestion on the left, or type your own question.',
    offline: 'Offline answer — the AI is temporarily unavailable',
    poweredBy: 'Powered by Google Gemini',
    placeholder: 'Type your question…',
    send: 'Send message',
  },
  km: {
    helpTitle: 'តើខ្ញុំអាចជួយអ្វីអ្នកនៅថ្ងៃនេះ?',
    helpLead: 'សួរអំពីលក្ខខណ្ឌបរិច្ចាគ ក្រុមឈាម ការណាត់ជួប ឬអ្វីផ្សេងទៀតអំពីការបរិច្ចាគ។',
    name: 'ជំនួយការ BloodLife',
    startHint: 'សួរសំណួរខាងក្រោមដើម្បីចាប់ផ្តើម',
    emptyHint: 'ជ្រើសរើសសំណួរណែនាំនៅខាងឆ្វេង ឬសរសេរសំណួររបស់អ្នកផ្ទាល់។',
    offline: 'ចម្លើយក្រៅបណ្តាញ — AI មិនអាចប្រើបានបណ្តោះអាសន្ន',
    poweredBy: 'ដំណើរការដោយ Google Gemini',
    placeholder: 'សរសេរសំណួររបស់អ្នក…',
    send: 'ផ្ញើសារ',
  },
  vi: {
    helpTitle: 'Hôm nay tôi có thể giúp gì cho bạn?',
    helpLead: 'Hỏi về điều kiện hiến máu, nhóm máu, lịch hẹn hoặc bất cứ điều gì về hiến máu.',
    name: 'Trợ lý BloodLife',
    startHint: 'Đặt câu hỏi bên dưới để bắt đầu',
    emptyHint: 'Chọn một gợi ý bên trái hoặc tự nhập câu hỏi của bạn.',
    offline: 'Câu trả lời ngoại tuyến — AI tạm thời không khả dụng',
    poweredBy: 'Được hỗ trợ bởi Google Gemini',
    placeholder: 'Nhập câu hỏi của bạn…',
    send: 'Gửi tin nhắn',
  },
};

export default messages;
