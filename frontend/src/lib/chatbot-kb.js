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
  // ── Accounts. Order matters: the first entry whose tag appears in the message wins, so the
  // specific ones (forgot password, staff, "do I need an account") come before the broad ones. ──
  {
    tags: {
      en: ["forgot password","forgot my password","reset password","reset my password","lost password","password reset","can't remember my password"],
      km: ["ភ្លេចពាក្យសម្ងាត់","ប្ដូរពាក្យសម្ងាត់","កំណត់ពាក្យសម្ងាត់ឡើងវិញ"],
      vi: ["quên mật khẩu","đặt lại mật khẩu","lấy lại mật khẩu"],
    },
    answer: {
      en: "Automatic password reset isn't available yet. Please [contact the team](/contact) with the email you registered with and we'll help you get back in.\n\nIf you signed up with Google or Facebook, just use that button on the [Login](/login) page — there's no password.",
      km: "ការកំណត់ពាក្យសម្ងាត់ឡើងវិញដោយស្វ័យប្រវត្តិមិនទាន់មានទេ។ សូម[ទាក់ទងក្រុមការងារ](/contact) ជាមួយអ៊ីមែលដែលអ្នកបានចុះឈ្មោះ ហើយយើងនឹងជួយអ្នក។\n\nប្រសិនបើអ្នកបានចុះឈ្មោះដោយ Google ឬ Facebook សូមប្រើប៊ូតុងនោះនៅទំព័រ [Login](/login) — មិនមានពាក្យសម្ងាត់ទេ។",
      vi: "Chức năng đặt lại mật khẩu tự động chưa có. Vui lòng [liên hệ đội ngũ](/contact) kèm email bạn đã đăng ký, chúng tôi sẽ giúp bạn truy cập lại.\n\nNếu bạn đăng ký bằng Google hoặc Facebook, hãy dùng nút đó ở trang [Login](/login) — không có mật khẩu.",
    },
  },
  {
    tags: {
      en: ["staff account","staff login","hospital staff","hospital account","hospital login","admin account","admin login","admin"],
      km: ["បុគ្គលិកមន្ទីរពេទ្យ","គណនីបុគ្គលិក","គណនីអ្នកគ្រប់គ្រង","អ្នកគ្រប់គ្រង"],
      vi: ["nhân viên bệnh viện","tài khoản nhân viên","tài khoản quản trị","quản trị viên"],
    },
    answer: {
      en: "Hospital staff accounts can't be created by signing up — the platform administrator sets them up for each partner hospital. If you already have one, sign in at [Staff Login](/hospital/login).\n\nAdmin accounts are managed by the platform team and can't be self-registered. Want your hospital to join? [Contact us](/contact).",
      km: "គណនីបុគ្គលិកមន្ទីរពេទ្យមិនអាចបង្កើតដោយការចុះឈ្មោះខ្លួនឯងបានទេ — អ្នកគ្រប់គ្រងប្រព័ន្ធបង្កើតឲ្យមន្ទីរពេទ្យដៃគូនីមួយៗ។ ប្រសិនបើអ្នកមានរួចហើយ សូមចូលនៅ [Staff Login](/hospital/login)។\n\nគណនីអ្នកគ្រប់គ្រងត្រូវបានគ្រប់គ្រងដោយក្រុមការងារប្រព័ន្ធ ហើយមិនអាចចុះឈ្មោះដោយខ្លួនឯងបានទេ។ ចង់ឲ្យមន្ទីរពេទ្យរបស់អ្នកចូលរួម? [ទាក់ទងយើង](/contact)។",
      vi: "Tài khoản nhân viên bệnh viện không thể tự đăng ký — quản trị viên nền tảng tạo cho từng bệnh viện đối tác. Nếu bạn đã có, hãy đăng nhập tại [Staff Login](/hospital/login).\n\nTài khoản quản trị do đội ngũ nền tảng quản lý và không thể tự đăng ký. Muốn bệnh viện của bạn tham gia? [Liên hệ chúng tôi](/contact).",
    },
  },
  {
    tags: {
      en: ["need an account","do i need an account","why create an account","why register","benefit of an account","benefits of an account","account or donor","difference between account","donor account","what is an account","what can i do with an account"],
      km: ["ត្រូវការគណនី","ហេតុអ្វីត្រូវមានគណនី","គណនី ឬអ្នកបរិច្ចាគ","អត្ថប្រយោជន៍គណនី"],
      vi: ["cần tài khoản","có cần tài khoản","lợi ích tài khoản","khác nhau giữa tài khoản","tài khoản hay người hiến"],
    },
    answer: {
      en: "An account lets you sign in, see your own blood requests and appointments, get your donor QR card and message the team.\n\nIt's separate from registering as a donor: donors are added on [Donate](/donate) (blood type, availability). Use the same email for both so they link up.\n\nYou don't need an account to donate, request blood or book an appointment.",
      km: "គណនីអនុញ្ញាតឲ្យអ្នកចូលប្រើ មើលសំណើឈាម និងការណាត់ជួបរបស់អ្នក ទទួលបានកាត QR អ្នកបរិច្ចាគ និងផ្ញើសារទៅក្រុមការងារ។\n\nវាខុសពីការចុះឈ្មោះជាអ្នកបរិច្ចាគ៖ អ្នកបរិច្ចាគត្រូវបានបន្ថែមនៅ [Donate](/donate) (ក្រុមឈាម ភាពអាចបរិច្ចាគ)។ សូមប្រើអ៊ីមែលដូចគ្នាសម្រាប់ទាំងពីរ ដើម្បីភ្ជាប់គ្នា។\n\nអ្នកមិនចាំបាច់មានគណនីដើម្បីបរិច្ចាគ ស្នើសុំឈាម ឬណាត់ជួបទេ។",
      vi: "Tài khoản giúp bạn đăng nhập, xem các yêu cầu máu và lịch hẹn của mình, nhận thẻ QR người hiến máu và nhắn tin cho đội ngũ.\n\nNó khác với việc đăng ký làm người hiến máu: người hiến được thêm tại [Donate](/donate) (nhóm máu, tình trạng sẵn sàng). Hãy dùng cùng một email cho cả hai để liên kết.\n\nBạn không cần tài khoản để hiến máu, yêu cầu máu hoặc đặt lịch hẹn.",
    },
  },
  {
    tags: {
      en: ["log in","login","sign in","signin","sign-in","can't log in","cannot log in","cant login","logged out"],
      km: ["ចូលគណនី","ចូលប្រើ","ចូលប្រព័ន្ធ"],
      vi: ["đăng nhập","dang nhap","không đăng nhập được"],
    },
    answer: {
      en: "To log in:\n1. Open [Login](/login)\n2. Enter your email and password, then press **Login**\n3. Tick **Remember me** to stay signed in on this device\n\nNo account yet? [Register](/register). Signed up with Google or Facebook? Use the same button to sign in — there's no password. Forgot your password? Just ask me.",
      km: "ដើម្បីចូលគណនី៖\n1. បើក [Login](/login)\n2. បញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់ រួចចុច **Login**\n3. ធីក **Remember me** ដើម្បីនៅតែចូលក្នុងឧបករណ៍នេះ\n\nមិនទាន់មានគណនី? [Register](/register)។ បានចុះឈ្មោះដោយ Google ឬ Facebook? ប្រើប៊ូតុងដដែលដើម្បីចូល — មិនមានពាក្យសម្ងាត់ទេ។ ភ្លេចពាក្យសម្ងាត់? សួរខ្ញុំបាន។",
      vi: "Để đăng nhập:\n1. Mở [Login](/login)\n2. Nhập email và mật khẩu, rồi nhấn **Login**\n3. Chọn **Remember me** để giữ đăng nhập trên thiết bị này\n\nChưa có tài khoản? [Register](/register). Đăng ký bằng Google hoặc Facebook? Dùng chính nút đó để đăng nhập — không có mật khẩu. Quên mật khẩu? Cứ hỏi tôi.",
    },
  },
  {
    tags: {
      en: ["create account","create an account","create a account","new account","make an account","make account","open an account","account","sign up","signup","sign-up","register","registration","how to register","how do i register"],
      km: ["បង្កើតគណនី","គណនីថ្មី","ចុះឈ្មោះគណនី","ចុះឈ្មោះ","គណនី"],
      vi: ["tạo tài khoản","tài khoản mới","đăng ký tài khoản","đăng ký","đăng kí","tài khoản"],
    },
    answer: {
      en: "To create an account:\n1. Open [Register](/register) (the \"Register\" button in the top menu)\n2. Fill in your full name, email and a password (at least 6 characters), then confirm it\n3. Optionally add your date of birth, phone, blood type and location\n4. Press **Create Account** — you're signed in right away\n\nYou can also use Google or Facebook if those buttons appear. Want to give blood too? Register as a donor on [Donate](/donate) using the same email.",
      km: "ដើម្បីបង្កើតគណនី៖\n1. បើក [Register](/register) (ប៊ូតុង «Register» នៅម៉ឺនុយខាងលើ)\n2. បំពេញឈ្មោះពេញ អ៊ីមែល និងពាក្យសម្ងាត់ (យ៉ាងតិច 6 តួអក្សរ) រួចបញ្ជាក់ម្ដងទៀត\n3. បើចង់ អាចបន្ថែមថ្ងៃខែឆ្នាំកំណើត លេខទូរសព្ទ ក្រុមឈាម និងទីតាំង\n4. ចុច **Create Account** — អ្នកនឹងចូលគណនីភ្លាមៗ\n\nអ្នកក៏អាចប្រើ Google ឬ Facebook បានផងប្រសិនបើមានប៊ូតុងទាំងនោះ។ ចង់បរិច្ចាគឈាមដែរឬទេ? សូមចុះឈ្មោះជាអ្នកបរិច្ចាគនៅ [Donate](/donate) ដោយប្រើអ៊ីមែលដូចគ្នា។",
      vi: "Để tạo tài khoản:\n1. Mở [Register](/register) (nút «Register» trên menu phía trên)\n2. Nhập họ tên, email và mật khẩu (ít nhất 6 ký tự), rồi xác nhận lại mật khẩu\n3. Có thể thêm ngày sinh, số điện thoại, nhóm máu và địa điểm\n4. Nhấn **Create Account** — bạn được đăng nhập ngay\n\nBạn cũng có thể dùng Google hoặc Facebook nếu có các nút đó. Muốn hiến máu? Hãy đăng ký làm người hiến máu tại [Donate](/donate) với cùng một email.",
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
      en: ["register as a donor","register as donor","donor registration","become donor","become a donor","how to donate","want to donate","i want to donate","want donate","donate blood","i want donate","give blood","wanna donate"],
      km: ["ចុះឈ្មោះជាអ្នកបរិច្ចាគ","ក្លាយជា","ជាអ្នកបរិច្ចាគ","ចង់បរិចាគ","ចង់ឲ្យឈាម","បរិចាគឈាម"],
      vi: ["đăng ký làm người hiến","đăng ký hiến máu","trở thành người hiến","muốn hiến máu","tôi muốn hiến"],
    },
    answer: {
      en: "To register as a blood donor:\n1. Open [Donate](/donate) in the top menu\n2. Fill in your details and blood type\n3. Confirm eligibility\n4. Submit your registration\n\nNo password needed. (Want a website account too? Just ask me how to create one.)",
      km: "ដើម្បីចុះឈ្មោះជាអ្នកបរិច្ចាគឈាម:\n1. បើក [Donate](/donate) នៅម៉ឺនុយខាងលើ\n2. បំពេញព័ត៌មានរបស់អ្នក និងក្រុមឈាម\n3. បញ្ជាក់គុណសម្បត្តិ\n4. ដាក់ស្នើពាក្យ\n\nមិនត្រូវការពាក្យសម្ងាត់ទេ។ (ចង់បានគណនីគេហទំព័រដែរឬទេ? សួរខ្ញុំពីរបៀបបង្កើត។)",
      vi: "Để đăng ký làm người hiến máu:\n1. Mở [Donate](/donate) trên menu phía trên\n2. Điền thông tin và nhóm máu\n3. Xác nhận điều kiện\n4. Gửi đăng ký\n\nKhông cần mật khẩu. (Muốn có tài khoản website? Hãy hỏi tôi cách tạo.)",
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
      en: "To find hospitals and clinics near you, open [Find a Hospital](/map) — search your city or province, or tap the location button. You can also book a donation slot on the [Appointments](/appointments) page.",
      km: "ដើម្បីស្វែងរកមន្ទីរពេទ្យ និងគ្លីនិកនៅជិតអ្នក សូមបើក [Find a Hospital](/map) — ស្វែងរកតាមទីក្រុង ឬខេត្ត ឬចុចប៊ូតុងទីតាំង។ អ្នកក៏អាចណាត់ជួបបរិច្ចាគនៅទំព័រ [Appointments](/appointments) ផងដែរ។",
      vi: "Để tìm bệnh viện và phòng khám gần bạn, hãy mở [Find a Hospital](/map) — tìm theo thành phố/tỉnh hoặc nhấn nút vị trí. Bạn cũng có thể đặt lịch hiến máu tại trang [Appointments](/appointments).",
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
  en: "I'm not sure about that. Ask me about creating an account, eligibility, blood types, registration, appointments, or anything related to blood donation!",
  km: "ខ្ញុំមិនច្បាស់ពីចំណុចនោះ។ សូមសួរខ្ញុំអំពីការបង្កើតគណនី គុណសម្បត្តិ ក្រុមឈាម ការចុះឈ្មោះ ការណាត់ជួប ឬអ្វីដែលទាក់ទងនឹងការបរិច្ចាគឈាម!",
  vi: "Tôi không chắc về điều đó. Hãy hỏi tôi về cách tạo tài khoản, điều kiện, nhóm máu, đăng ký, lịch hẹn, hoặc bất cứ điều gì liên quan đến hiến máu!",
};

export const QUICK_PROMPTS = {
  en: [
    "How do I create an account?",
    "Am I eligible to donate?",
    "How long does donation take?",
    "Can I donate with a cold?",
    "How often can I donate?",
    "What to do after donating?",
  ],
  km: [
    "តើបង្កើតគណនីដោយរបៀបណា?",
    "តើខ្ញុំអាចបរិច្ចាគបានទេ?",
    "ដំណើរការចំណាយពេលប៉ុន្មាន?",
    "ជំងឺផ្ដាសាយ អាចបរិច្ចាគទេ?",
    "បរិច្ចាគបានប៉ុន្មានខែម្ដង?",
    "ក្រោយបរិច្ចាគ ត្រូវធ្វើអ្វី?",
  ],
  vi: [
    "Làm sao để tạo tài khoản?",
    "Tôi có đủ điều kiện hiến không?",
    "Quá trình mất bao lâu?",
    "Cảm lạnh có thể hiến không?",
    "Tôi có thể hiến bao lâu một lần?",
    "Sau khi hiến cần làm gì?",
  ],
};

// Short plain-ASCII tags ("hi", "cold", "time") must match as whole words: as substrings they hit
// unrelated words — "hi" inside the Vietnamese "hiến" or the English "this" — and hijack the answer.
const tagMatches = (lower, tag) => {
  const t = tag.toLowerCase();
  if (t.length <= 4 && /^[a-z]+$/.test(t)) return new RegExp(`\\b${t}\\b`).test(lower);
  return lower.includes(t);
};

// The entry with the longest matching phrase wins, so "register as a donor" beats the broader
// "register", and specific questions win over generic ones regardless of their order in KB.
// Ties go to the earlier entry.
export function ruleBasedResponse(input, lang) {
  const lower = input.toLowerCase();
  let best = null;
  let bestLength = 0;
  for (const entry of KB) {
    const tags = [...(entry.tags[lang] || []), ...(entry.tags.en || [])];
    for (const tag of tags) {
      if (tag.length > bestLength && tagMatches(lower, tag)) {
        best = entry;
        bestLength = tag.length;
      }
    }
  }
  return best ? (best.answer[lang] || best.answer.en) : (FALLBACK[lang] || FALLBACK.en);
}
