'use client';
import React, { useState, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, IconButton,
  useTheme, Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import API_BASE from "@/lib/config";

function detectLanguage(text) {
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
      en: ["eligible","eligibility","qualify","can i donate","requirements"],
      km: ["គុណសម្បត្តិ","តម្រូវការ","អាចបរិច្ចាគ","ផ្ដល់ឈាម"],
      vi: ["đủ điều kiện","điều kiện","yêu cầu","có thể hiến"],
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
      en: ["register","sign up","become donor","how to donate"],
      km: ["ចុះឈ្មោះ","ក្លាយជា","ជាអ្នកបរិច្ចាគ"],
      vi: ["đăng ký","đăng kí","trở thành người hiến"],
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

const QUICK_PROMPTS = {
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

const UI_TEXT = {
  en: {
    placeholder: "Type a message...",
    title: "How can I help you?",
    sub: "Ask me anything about blood donation.",
  },
  km: {
    placeholder: "វាយបញ្ចូលសាររបស់អ្នក...",
    title: "តើខ្ញុំអាចជួយអ្វីបានខ្លះ?",
    sub: "សួរខ្ញុំអំពីការបរិច្ចាគឈាម។",
  },
  vi: {
    placeholder: "Nhập tin nhắn của bạn...",
    title: "Tôi có thể giúp gì cho bạn?",
    sub: "Hỏi tôi bất cứ điều gì về hiến máu.",
  },
};

const LANG_LABELS = { en: "EN", km: "ខ្មែរ", vi: "VN" };

function ruleBasedResponse(input, lang) {
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

export default function ChatBot() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [promptLang, setPromptLang] = useState("en");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
      setTimeout(() => inputRef.current?.focus(), 180);
    } else {
      setVisible(false);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const lang = detectLanguage(content);
    setPromptLang(lang);

    const userMsg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang }),
      });
      const data = await res.json();
      if (!res.ok && data.configured === false) {
        const reply = ruleBasedResponse(content, lang);
        setTimeout(() => { setMessages(prev => [...prev, { role: "assistant", content: reply }]); setLoading(false); }, 480);
        return;
      }
      if (!res.ok) throw new Error();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      const reply = ruleBasedResponse(content, lang);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const border = isDark ? "#1f1f1f" : "#e5e5e5";
  const panelBg = isDark ? "#111111" : "#ffffff";
  const ui = UI_TEXT[promptLang];

  return (
    <>
      <style>{`
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* FAB */}
      <Box onClick={() => setOpen(v => !v)} sx={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1300,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(220,38,38,0.5), 0 2px 8px rgba(220,38,38,0.3)",
        transition: "all 0.22s ease",
        "&:hover": {
          transform: "scale(1.08)",
          boxShadow: "0 8px 32px rgba(220,38,38,0.6), 0 4px 12px rgba(220,38,38,0.4)",
        },
      }}>
        {open
          ? <CloseIcon sx={{ color: "white", fontSize: 22 }} />
          : <SmartToyIcon sx={{ color: "white", fontSize: 24 }} />}
      </Box>

      {/* Panel */}
      {open && (
        <Paper elevation={0} sx={{
          position: "fixed", bottom: 96, right: 28, zIndex: 1299,
          width: { xs: "calc(100vw - 32px)", sm: 400 },
          maxWidth: 420, height: 560,
          borderRadius: "20px",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 24px 80px rgba(0,0,0,0.7), 0 8px 32px rgba(0,0,0,0.5)"
            : "0 24px 80px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.08)",
          bgcolor: panelBg,
          animation: "chatPanelIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}>

          {/* Header */}
          <Box sx={{
            px: 2.5, py: 2,
            borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0,
            background: isDark
              ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
              : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: "12px",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <SmartToyIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box flex={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography fontWeight={800} fontSize="0.92rem" sx={{ color: "white", letterSpacing: "-0.01em" }}>
                  AI Assistant
                </Typography>
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 0.4,
                  px: 0.8, py: 0.2, borderRadius: "100px",
                  bgcolor: "rgba(255,255,255,0.18)",
                }}>
                  <Box sx={{
                    width: 5, height: 5, borderRadius: "50%", bgcolor: "#4ade80",
                    animation: "pulse 2s ease infinite",
                    "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
                  }} />
                  <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Online</Typography>
                </Box>
              </Box>
              {/* Language selector */}
              <Box sx={{ display: "flex", gap: 0.5, mt: 0.4 }}>
                {["en", "km", "vi"].map(lang => (
                  <Box
                    key={lang}
                    onClick={() => setPromptLang(lang)}
                    sx={{
                      px: 0.8, py: 0.1, borderRadius: "6px", cursor: "pointer",
                      fontSize: "0.62rem", fontWeight: 700,
                      bgcolor: promptLang === lang ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
                      color: promptLang === lang ? "white" : "rgba(255,255,255,0.55)",
                      border: `1px solid ${promptLang === lang ? "rgba(255,255,255,0.4)" : "transparent"}`,
                      transition: "all 0.15s",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)", color: "white" },
                    }}
                  >
                    {LANG_LABELS[lang]}
                  </Box>
                ))}
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" }, borderRadius: "8px" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{
            flex: 1, overflowY: "auto", px: 2, py: 2,
            display: "flex", flexDirection: "column", gap: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "#2a2a2a" : "#e0e0e0", borderRadius: 2 },
          }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Box sx={{
                  width: 68, height: 68, borderRadius: "18px", mx: "auto", mb: 2,
                  background: "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(185,28,28,0.08) 100%)",
                  border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "rgba(220,38,38,0.20)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FavoriteIcon sx={{ fontSize: 32, color: "#dc2626" }} />
                </Box>
                <Typography fontWeight={700} fontSize="0.95rem" mb={0.5} sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>
                  {ui.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
                  {ui.sub}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                  {QUICK_PROMPTS[promptLang].map(p => (
                    <Chip
                      key={p} label={p} size="small" clickable onClick={() => sendMessage(p)}
                      variant="outlined"
                      sx={{
                        fontSize: "0.78rem", fontWeight: 500, height: 30,
                        borderColor: isDark ? "#2a2a2a" : "#e0e0e0",
                        color: isDark ? "#888888" : "#555555",
                        borderRadius: "8px",
                        "&:hover": {
                          borderColor: "#dc2626", color: "#dc2626",
                          bgcolor: "rgba(220,38,38,0.06)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 1 }}>
                {msg.role === "assistant" && (
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "8px",
                    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                    flexShrink: 0, mt: 0.2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <SmartToyIcon sx={{ fontSize: 14, color: "white" }} />
                  </Box>
                )}
                <Box sx={{
                  maxWidth: "78%", px: 1.8, py: 1.2,
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                    : isDark ? "#1a1a1a" : "#f5f5f5",
                  border: msg.role === "user" ? "none" : `1px solid ${isDark ? "#2a2a2a" : "#ebebeb"}`,
                  color: msg.role === "user" ? "white" : isDark ? "rgba(245,245,245,0.9)" : "#222222",
                  boxShadow: msg.role === "user" ? "0 2px 8px rgba(220,38,38,0.3)" : "none",
                }}>
                  <Typography variant="body2" sx={{ fontSize: "0.83rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Typing indicator */}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: "8px",
                  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SmartToyIcon sx={{ fontSize: 14, color: "white" }} />
                </Box>
                <Box sx={{
                  px: 2, py: 1.3, borderRadius: "16px 16px 16px 4px",
                  bgcolor: isDark ? "#1a1a1a" : "#f5f5f5",
                  border: `1px solid ${isDark ? "#2a2a2a" : "#ebebeb"}`,
                  display: "flex", alignItems: "center", gap: 0.6,
                }}>
                  {[0, 1, 2].map(i => (
                    <Box key={i} sx={{
                      width: 7, height: 7, borderRadius: "50%",
                      bgcolor: "#dc2626", opacity: 0.7,
                      animation: `dotBounce 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </Box>
              </Box>
            )}

            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box sx={{
            px: 1.5, py: 1.5, flexShrink: 0,
            borderTop: `1px solid ${border}`,
            display: "flex", alignItems: "flex-end", gap: 1,
            bgcolor: isDark ? "#0f0f0f" : "#fafafa",
          }}>
            <TextField
              inputRef={inputRef} fullWidth size="small"
              placeholder={ui.placeholder}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              multiline maxRows={4} disabled={loading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px", fontSize: "0.85rem",
                  bgcolor: isDark ? "#111111" : "#ffffff",
                  "& fieldset": { borderColor: isDark ? "#2a2a2a" : "#e5e5e5" },
                  "&:hover fieldset": { borderColor: "#dc2626" },
                  "&.Mui-focused fieldset": { borderColor: "#dc2626", borderWidth: "1.5px" },
                },
              }}
            />
            <IconButton onClick={() => sendMessage()} disabled={!input.trim() || loading}
              sx={{
                width: 38, height: 38, flexShrink: 0, borderRadius: "10px",
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                  : isDark ? "#1f1f1f" : "#ebebeb",
                color: input.trim() && !loading ? "white" : "text.disabled",
                "&:hover": {
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)"
                    : undefined,
                },
                transition: "all 0.18s ease",
                boxShadow: input.trim() && !loading ? "0 2px 8px rgba(220,38,38,0.4)" : "none",
              }}>
              <SendIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
}
