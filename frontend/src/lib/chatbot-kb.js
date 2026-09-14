// Shared between the floating ChatBot widget and the /assistant page: language
// detection plus the offline rule-based fallback used when the AI backend is
// unreachable or not configured (ANTHROPIC_API_KEY missing on the server).

export function detectLanguage(text) {
  if (/[ក-៿]/.test(text)) return 'km';
  if (/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/.test(text)) return 'vi';
  return 'en';
}

const KB = [
  {
    tags: {
      en: ["hello","hi","hey","greetings"],
      km: ["ជំរាបសួរ","សួស្ដី","អរុណ"],
      vi: ["xin chào","chào"],
    },
    answer: {
      en: "Hello! I'm your blood donation assistant. How can I help you today?",
      km: "ជំរាបសួរ! ខ្ញុំជាជំនួយការបរិច្ចាគឈាម។ តើខ្ញុំអាចជួយអ្វីបានខ្លះ?",
      vi: "Xin chào! Tôi là trợ lý hiến máu của bạn. Tôi có thể giúp gì cho bạn?",
    },
  },
  {
    tags: {
      en: ["thank","thanks","thank you"],
      km: ["អរគុណ","អរគុណច្រើន"],
      vi: ["cảm ơn","cám ơn"],
    },
    answer: {
      en: "You're welcome! Is there anything else I can help you with?",
      km: "មិនអីទេ! តើមានអ្វីទៀតដែលខ្ញុំអាចជួយបាន?",
      vi: "Không có gì! Bạn có cần tôi giúp thêm gì không?",
    },
  },
  {
    tags: {
      en: ["bye","goodbye"],
      km: ["លាហើយ","ជំរាបលា"],
      vi: ["tạm biệt"],
    },
    answer: {
      en: "Goodbye! Remember — one donation can save up to 3 lives.",
      km: "លាហើយ! ចងចាំថា ការបរិច្ចាគម្ដងអាចជួយសង្រ្គោះជីវិតបានរហូតដល់ 3 នាក់។",
      vi: "Tạm biệt! Hãy nhớ rằng — một lần hiến máu có thể cứu đến 3 sinh mạng.",
    },
  },
  {
    tags: {
      en: ["eligible","eligibility","qualify","can i donate","requirements","when can i donate","when do i donate","when i donate","when am i eligible","when to donate","when should i donate"],
      km: ["គុណសម្បត្តិ","តម្រូវការ","អាចបរិច្ចាគ","ផ្ដល់ឈាម","ពេលណាអាចបរិច្ចាគ"],
      vi: ["đủ điều kiện","điều kiện","yêu cầu","có thể hiến","khi nào có thể hiến","khi nào tôi hiến"],
    },
    answer: {
      en: "To donate blood you need to be:\n• Age 18–60\n• Weight at least 45 kg\n• In good health with no active infection\n• No donation in the past 3 months\n• Not pregnant or breastfeeding",
      km: "ដើម្បីបរិច្ចាគឈាម លោកអ្នកត្រូវ:\n• អាយុ 18–60 ឆ្នាំ\n• ទម្ងន់យ៉ាងហោចណាស់ 45 គីឡូ\n• សុខភាពល្អ គ្មានជំងឺឆ្លង\n• មិនបានបរិច្ចាគក្នុង 3 ខែចុងក្រោយ\n• មិនមានផ្ទៃពោះ ឬបំបៅដោះ",
      vi: "Để hiến máu, bạn cần:\n• Tuổi từ 18–60\n• Cân nặng ít nhất 45 kg\n• Sức khỏe tốt, không có bệnh truyền nhiễm\n• Không hiến máu trong 3 tháng qua\n• Không mang thai hoặc cho con bú",
    },
  },
  {
    tags: {
      en: ["blood type","blood group","compatible","compatibility"],
      km: ["ក្រុមឈាម","ប្រភេទឈាម","ជំនួស"],
      vi: ["nhóm máu","loại máu","tương thích"],
    },
    answer: {
      en: "There are 8 blood types: A+, A−, B+, B−, AB+, AB−, O+, O−\n\n• O− is the universal donor\n• AB+ is the universal recipient\n• O+ is the most common (~38%)",
      km: "មានក្រុមឈាម 8 ប្រភេទ: A+, A−, B+, B−, AB+, AB−, O+, O−\n\n• O− ជាម្ចាស់ជូនសាកល\n• AB+ ជាអ្នកទទួលសាកល\n• O+ ជាប្រភេទច្រើនបំផុត (~38%)",
      vi: "Có 8 nhóm máu: A+, A−, B+, B−, AB+, AB−, O+, O−\n\n• O− là người hiến phổ quát\n• AB+ là người nhận phổ quát\n• O+ phổ biến nhất (~38%)",
    },
  },
  {
    tags: {
      en: ["cold","sick","fever","flu"],
      km: ["ផ្ដាសាយ","គ្រុន","ជំងឺ","ក្ដៅ"],
      vi: ["cảm lạnh","bệnh","sốt","cúm"],
    },
    answer: {
      en: "If you have a mild cold without fever, you may be able to donate. However if you have a fever or sore throat, wait until you're fully recovered — at least 7 days symptom-free.",
      km: "ប្រសិនបើអ្នកមានជំងឺផ្ដាសាយស្រាលដោយគ្មានគ្រុនក្ដៅ លោកអ្នកអាចបរិច្ចាគបាន។ ប្រសិនបើមានគ្រុនក្ដៅ សូមរង់ចាំរហូតដល់ជាសះស្បើយ — យ៉ាងហោចណាស់ 7 ថ្ងៃ។",
      vi: "Nếu bạn bị cảm lạnh nhẹ không sốt, bạn vẫn có thể hiến máu. Tuy nhiên nếu có sốt hoặc đau họng, hãy chờ cho đến khi hồi phục — ít nhất 7 ngày không có triệu chứng.",
    },
  },
  {
    tags: {
      en: ["how often","frequency","how many times","interval"],
      km: ["ប៉ុន្មានដង","ញឹកញាប់","ប៉ុន្មានខែ"],
      vi: ["bao nhiêu lần","tần suất","bao lâu một lần"],
    },
    answer: {
      en: "You can donate whole blood once every 3 months (12 weeks). Plasma can be donated every 2 weeks.",
      km: "អ្នកអាចបរិច្ចាគឈាមសរុបម្ដងរៀងរាល់ 3 ខែ (12 សប្ដាហ៍)។ ប្លាស្មាអាចបរិច្ចាគបានរៀងរាល់ 2 សប្ដាហ៍ម្ដង។",
      vi: "Bạn có thể hiến máu toàn phần mỗi 3 tháng (12 tuần). Huyết tương có thể hiến mỗi 2 tuần.",
    },
  },
  {
    tags: {
      en: ["register","sign up","become donor","how to donate","want to donate","i want to donate","want donate","donate blood","i want donate","give blood","wanna donate"],
      km: ["ចុះឈ្មោះ","ក្លាយជា","ជាអ្នកបរិច្ចាគ","ចង់បរិចាគ","ចង់ឲ្យឈាម","បរិចាគឈាម"],
      vi: ["đăng ký","đăng kí","trở thành người hiến","muốn hiến máu","tôi muốn hiến"],
    },
    answer: {
      en: "To register:\n1. Click \"Donate Blood\" in the nav\n2. Fill in your details and blood type\n3. Confirm eligibility\n4. Submit your registration",
      km: "ដើម្បីចុះឈ្មោះ:\n1. ចុច «បរិច្ចាគឈាម» នៅម៉ឺនុយ\n2. បំពេញព័ត៌មានរបស់អ្នក និងក្រុមឈាម\n3. បញ្ជាក់គុណសម្បត្តិ\n4. ដាក់ស្នើពាក្យ",
      vi: "Để đăng ký:\n1. Nhấn «Hiến Máu» trên menu\n2. Điền thông tin và nhóm máu\n3. Xác nhận điều kiện\n4. Gửi đăng ký",
    },
  },
  {
    tags: {
      en: ["request blood","need blood","how to request"],
      km: ["សុំឈាម","ត្រូវការឈាម","ស្នើ"],
      vi: ["yêu cầu máu","cần máu","xin máu"],
    },
    answer: {
      en: "To request blood:\n1. Click \"Request Blood\"\n2. Enter patient and hospital details\n3. Select blood type and urgency\n4. Submit — our team responds by urgency level",
      km: "ដើម្បីស្នើសុំឈាម:\n1. ចុច «ស្នើសុំឈាម»\n2. បំពេញព័ត៌មានអ្នកជំងឺ និងមន្ទីរពេទ្យ\n3. ជ្រើសក្រុមឈាម និងកម្រិតបន្ទាន់\n4. ដាក់ស្នើ — ក្រុមការងាររបស់យើងនឹងឆ្លើយតប",
      vi: "Để yêu cầu máu:\n1. Nhấn «Yêu Cầu Máu»\n2. Nhập thông tin bệnh nhân và bệnh viện\n3. Chọn nhóm máu và mức độ khẩn cấp\n4. Gửi — đội ngũ chúng tôi phản hồi theo mức độ khẩn cấp",
    },
  },
  {
    tags: {
      en: ["appointment","book","schedule"],
      km: ["ណាត់ជួប","កក់","កាលវិភាគ"],
      vi: ["đặt lịch","hẹn","lịch hẹn"],
    },
    answer: {
      en: "To book an appointment:\n1. Click \"Book Appointment\"\n2. Select a donation center\n3. Choose date and time\n4. Fill in your details and confirm",
      km: "ដើម្បីណាត់ជួប:\n1. ចុច «ណាត់ការបរិច្ចាគ»\n2. ជ្រើសមន្ទីរពេទ្យ\n3. ជ្រើសកាលបរិច្ឆេទ និងម៉ោង\n4. បំពេញព័ត៌មាន និងបញ្ជាក់",
      vi: "Để đặt lịch hẹn:\n1. Nhấn «Đặt Lịch Hẹn»\n2. Chọn trung tâm hiến máu\n3. Chọn ngày và giờ\n4. Điền thông tin và xác nhận",
    },
  },
  {
    tags: {
      en: ["prepare","preparation","before","eat before"],
      km: ["រៀបចំ","មុន","ត្រៀម","ហូបអ្វី"],
      vi: ["chuẩn bị","trước khi","ăn gì trước"],
    },
    answer: {
      en: "How to prepare:\n• Eat a healthy meal 2–3 hours before\n• Drink at least 500ml extra water\n• Get a full night's sleep\n• Avoid alcohol 24 hours before\n• Bring a valid ID",
      km: "វិធីរៀបចំ:\n• ទទួលទានអាហារ 2–3 ម៉ោងមុន\n• ផឹកទឹកបន្ថែមយ៉ាងហោចណាស់ 500ml\n• គេងលក់ឱ្យបានគ្រប់គ្រាន់\n• កុំផឹកស្រា 24 ម៉ោងមុន\n• យកប័ណ្ណអត្តសញ្ញាណ",
      vi: "Cách chuẩn bị:\n• Ăn một bữa lành mạnh 2–3 giờ trước\n• Uống thêm ít nhất 500ml nước\n• Ngủ đủ giấc\n• Tránh rượu 24 giờ trước\n• Mang theo CMND/CCCD",
    },
  },
  {
    tags: {
      en: ["after","recovery","rest after"],
      km: ["ក្រោយ","ការសម្រាក","ក្រោយបរិច្ចាគ"],
      vi: ["sau khi","sau hiến","hồi phục"],
    },
    answer: {
      en: "After donating:\n• Rest 10–15 minutes at the center\n• Drink extra fluids for 24 hours\n• Avoid heavy exercise for 24 hours\n• Keep the bandage on for 4+ hours",
      km: "ក្រោយការបរិច្ចាគ:\n• សម្រាក 10–15 នាទីនៅមន្ទីរ\n• ផឹកទឹកបន្ថែម 24 ម៉ោង\n• កុំធ្វើការហ្វឹកហ្វឺនធ្ងន់ 24 ម៉ោង\n• ទុកក្រណាត់ 4+ ម៉ោង",
      vi: "Sau khi hiến máu:\n• Nghỉ ngơi 10–15 phút tại trung tâm\n• Uống thêm nước trong 24 giờ\n• Tránh vận động mạnh trong 24 giờ\n• Giữ băng gạc ít nhất 4 giờ",
    },
  },
  {
    tags: {
      en: ["safe","side effect","danger","risk","pain"],
      km: ["សុវត្ថិភាព","ផលប៉ះពាល់","គ្រោះថ្នាក់"],
      vi: ["an toàn","tác dụng phụ","nguy hiểm","rủi ro"],
    },
    answer: {
      en: "Blood donation is very safe! You may feel a small pinch. Mild dizziness is uncommon and serious complications are extremely rare.",
      km: "ការបរិច្ចាគឈាមមានសុវត្ថិភាព! អ្នកអាចមានអារម្មណ៍ឈឺបន្តិច។ វិលវល់ស្រាលកើតឡើងម្ដងម្កាល ហើយផលវិបាកធ្ងន់ធ្ងរមានកម្រណាស់។",
      vi: "Hiến máu rất an toàn! Bạn có thể cảm thấy hơi đau nhẹ. Chóng mặt nhẹ không phổ biến và biến chứng nghiêm trọng cực kỳ hiếm gặp.",
    },
  },
  {
    tags: {
      en: ["how long","duration","process","time"],
      km: ["ប៉ុន្មានម៉ោង","រយៈពេល","ចំណាយ"],
      vi: ["bao lâu","thời gian","mất bao lâu"],
    },
    answer: {
      en: "The full process takes 30–45 minutes:\n1. Registration — 5 min\n2. Health screening — 10 min\n3. Donation — 8–10 min\n4. Rest — 15 min",
      km: "ដំណើរការទាំងមូលចំណាយពេល 30–45 នាទី:\n1. ចុះឈ្មោះ — 5 នាទី\n2. ពិនិត្យសុខភាព — 10 នាទី\n3. បរិច្ចាគ — 8–10 នាទី\n4. សម្រាក — 15 នាទី",
      vi: "Toàn bộ quá trình mất 30–45 phút:\n1. Đăng ký — 5 phút\n2. Kiểm tra sức khỏe — 10 phút\n3. Hiến máu — 8–10 phút\n4. Nghỉ ngơi — 15 phút",
    },
  },
  {
    tags: {
      en: ["hospital","location","center","where"],
      km: ["មន្ទីរពេទ្យ","ទីតាំង","ណា"],
      vi: ["bệnh viện","địa điểm","trung tâm","ở đâu"],
    },
    answer: {
      en: "Partner hospitals:\n• Calmette Hospital, Phnom Penh\n• Royal Phnom Penh Hospital\n• Khmer Soviet Friendship Hospital\n• National Blood Transfusion Center\n• Angkor Hospital for Children\n• Battambang Provincial Hospital",
      km: "មន្ទីរពេទ្យដៃគូ:\n• មន្ទីរពេទ្យកាល់ម៉ែត ភ្នំពេញ\n• Royal Phnom Penh Hospital\n• មន្ទីរពេទ្យមិត្តភាពខ្មែរ-សូវៀត\n• មជ្ឈមណ្ឌលជាតិឈាម\n• Angkor Hospital for Children, សៀមរាប\n• មន្ទីរពេទ្យបង្គោលខេត្តបាត់ដំបង",
      vi: "Bệnh viện đối tác:\n• Bệnh viện Calmette, Phnom Penh\n• Royal Phnom Penh Hospital\n• Bệnh viện Hữu nghị Khmer-Xô Viết\n• Trung tâm Truyền máu Quốc gia\n• Bệnh viện Nhi Angkor, Siem Reap\n• Bệnh viện tỉnh Battambang",
    },
  },
  {
    tags: {
      en: ["tattoo","piercing"],
      km: ["សាក់","ចោះ","គំនូរលើស្បែក"],
      vi: ["xăm hình","xỏ khuyên","xăm"],
    },
    answer: {
      en: "Wait at least 12 months after a tattoo or piercing before donating.",
      km: "រង់ចាំយ៉ាងហោចណាស់ 12 ខែក្រោយពេលសាក់រូប ឬចោះ មុនពេលបរិច្ចាគ។",
      vi: "Hãy đợi ít nhất 12 tháng sau khi xăm hình hoặc xỏ khuyên trước khi hiến máu.",
    },
  },
  {
    tags: {
      en: ["medication","medicine","drug"],
      km: ["ថ្នាំ","ឱសថ"],
      vi: ["thuốc","dùng thuốc"],
    },
    answer: {
      en: "It depends on the medication. Always disclose all medications during your health screening. Blood thinners and some antibiotics may require a waiting period.",
      km: "អាស្រ័យលើថ្នាំ។ ចែករំលែកព័ត៌មានអំពីថ្នាំទាំងអស់ពេលពិនិត្យសុខភាព។ ថ្នាំស្ដើងឈាម និងថ្នាំអង់ទីប៊ីយ៉ូទិកខ្លះអាចត្រូវការពេលរង់ចាំ។",
      vi: "Tùy thuộc vào loại thuốc. Luôn khai báo tất cả các loại thuốc trong quá trình kiểm tra sức khỏe. Thuốc làm loãng máu và một số kháng sinh có thể yêu cầu thời gian chờ.",
    },
  },
];

const FALLBACK = {
  en: "I'm not sure about that. Ask me about eligibility, blood types, registration, appointments, or anything related to blood donation!",
  km: "ខ្ញុំមិនច្បាស់ពីចំណុចនោះ។ សូមសួរខ្ញុំអំពីគុណសម្បត្តិ ក្រុមឈាម ការចុះឈ្មោះ ការណាត់ជួប ឬអ្វីដែលទាក់ទងនឹងការបរិច្ចាគឈាម!",
  vi: "Tôi không chắc về điều đó. Hãy hỏi tôi về điều kiện, nhóm máu, đăng ký, lịch hẹn, hoặc bất cứ điều gì liên quan đến hiến máu!",
};

export const QUICK_PROMPTS = {
  en: [
    "Am I eligible to donate?",
    "How long does donation take?",
    "Can I donate with a cold?",
    "How often can I donate?",
    "What to do after donating?",
  ],
  km: [
    "តើខ្ញុំអាចបរិច្ចាគបានទេ?",
    "ដំណើរការចំណាយពេលប៉ុន្មាន?",
    "ជំងឺផ្ដាសាយ អាចបរិច្ចាគទេ?",
    "បរិច្ចាគបានប៉ុន្មានខែម្ដង?",
    "ក្រោយបរិច្ចាគ ត្រូវធ្វើអ្វី?",
  ],
  vi: [
    "Tôi có đủ điều kiện hiến không?",
    "Quá trình mất bao lâu?",
    "Cảm lạnh có thể hiến không?",
    "Tôi có thể hiến bao lâu một lần?",
    "Sau khi hiến cần làm gì?",
  ],
};

export function ruleBasedResponse(input, lang) {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    const langTags = entry.tags[lang] || [];
    const enTags = entry.tags.en || [];
    const allTags = [...langTags, ...enTags];
    if (allTags.some(tag => lower.includes(tag.toLowerCase()))) {
      return entry.answer[lang] || entry.answer.en;
    }
  }
  return FALLBACK[lang] || FALLBACK.en;
}
