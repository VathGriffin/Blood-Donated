// Privacy Policy (/privacy) and Terms of Service (/terms). Lists are objects so every language
// keeps the same items; the pages show them in the order written here.
const messages = {
  en: {
    privacy: {
      title: 'Privacy Policy',
      lead: 'We are committed to protecting your personal data and your right to privacy. This policy explains how BloodLife collects, uses, and safeguards your information.',
      updated: 'Last updated: August 2026',
      gdpr: 'GDPR Compliant',
      contents: 'Contents',
      collect: {
        title: 'Data We Collect',
        intro: 'We collect only the information necessary to operate the BloodLife platform and facilitate blood donation matching.',
        personalTitle: 'Personal Information',
        personal: {
          a: 'Full name, email address, and phone number when you register',
          b: 'Blood type, location, and donation history when you register as a donor',
          c: 'Profile photo (optional) that you choose to upload',
          d: 'Patient information provided in blood request forms',
        },
        technicalTitle: 'Technical Data',
        technical: {
          a: 'IP address, browser type, and device information for security logging',
          b: 'Session tokens used for authentication (stored securely, never in cookies)',
          c: 'API request logs retained for 30 days for security auditing',
        },
      },
      use: {
        title: 'How We Use Your Data',
        intro: 'Your data is used exclusively to operate the platform and improve blood donation outcomes in Cambodia.',
        items: {
          a: 'Matching blood donors with patients who have compatible blood types',
          b: 'Sending appointment reminders and donation confirmations',
          c: 'Displaying your donor profile on the public donor directory (only if you choose to be available)',
          d: 'Generating anonymized statistics for public health reporting',
          e: 'Verifying your identity and preventing fraudulent requests',
          f: 'Improving the platform through aggregated, anonymized usage analytics',
        },
        never: 'We never use your data for advertising, marketing profiling, or sell it to third parties.',
      },
      share: {
        title: 'Data Sharing',
        intro: 'We do not sell, rent, or trade your personal information. Data may only be shared in the following limited circumstances:',
        items: {
          hospitals: { label: 'Partner hospitals:', text: 'Your contact information may be shared with verified partner hospitals when a blood match is confirmed and you have consented' },
          legal: { label: 'Legal obligations:', text: 'We may disclose data if required by Cambodian law or court order' },
          providers: { label: 'Service providers:', text: 'Cloud infrastructure providers (MongoDB Atlas) under strict data processing agreements' },
          ai: { label: 'AI assistant:', text: 'Chat messages sent to the AI assistant are processed by Google’s Gemini API and are not stored on our servers' },
        },
      },
      security: {
        title: 'Security',
        intro: 'We implement industry-standard technical and organizational measures to protect your data.',
        items: {
          a: 'All passwords are hashed using bcrypt with a minimum cost factor of 12',
          b: 'Authentication tokens (JWT) expire after 8 hours and are signed with a secure secret',
          c: 'All API requests are protected against NoSQL injection and XSS attacks',
          d: 'Rate limiting prevents brute-force attacks (10 login attempts per 15 minutes per IP)',
          e: 'HTTPS enforced in production; all data in transit is encrypted via TLS 1.2+',
          f: 'File uploads are validated for type and size; stored outside the web root',
          g: 'Security headers (HSTS, X-Frame-Options, CSP) enforced via Helmet.js',
          h: 'Server request logs are reviewed and purged every 30 days',
        },
      },
      rights: {
        title: 'Your Rights',
        intro: 'You have the following rights regarding your personal data:',
        items: {
          access: { label: 'Right of Access', text: 'Request a copy of all personal data we hold about you' },
          rectify: { label: 'Right to Rectification', text: 'Correct inaccurate or incomplete personal data at any time via your profile settings' },
          erase: { label: 'Right to Erasure', text: 'Request deletion of your account and all associated data' },
          port: { label: 'Right to Portability', text: 'Receive your data in a machine-readable format (JSON) upon request' },
          object: { label: 'Right to Object', text: 'Opt out of your donor profile being visible on the public directory' },
          restrict: { label: 'Right to Restrict', text: 'Request that we limit processing of your data in certain circumstances' },
        },
        exercise: 'To exercise any of these rights, contact us at {email}. We will respond within 30 days.',
      },
      retention: {
        title: 'Data Retention',
        items: {
          a: 'Active donor and user accounts: retained while the account is active',
          b: 'Deleted accounts: all personal data purged within 30 days of deletion request',
          c: 'Blood request records: anonymized and retained for 2 years for public health statistics',
          d: 'Server access logs: retained for 30 days, then automatically deleted',
          e: 'Uploaded photos: permanently deleted when account is closed or photo is removed',
        },
      },
      contact: {
        title: 'Contact Us',
        intro: 'If you have any questions, concerns, or requests regarding this privacy policy or your personal data, please reach out:',
        controller: 'BloodLife Data Controller',
        org: 'Hanoi University of Science and Technology (HUST)',
        city: 'Hanoi, Vietnam',
        email: 'Email: {email}',
      },
    },
    terms: {
      title: 'Terms of Service',
      lead: 'By using BloodLife you agree to these terms. Please read them carefully.',
      effective: 'Effective: August 2026',
      questions: 'Questions about these terms? Contact us at {email}',
      sections: {
        acceptance: {
          title: '1. Acceptance of Terms',
          text: 'By accessing or using the BloodLife platform (“Service”), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, donors, and registered users.',
        },
        eligibility: {
          title: '2. Eligibility',
          text: 'To register as a donor on BloodLife, you must meet the following criteria:',
          items: {
            a: 'Be between 18 and 60 years of age',
            b: 'Weigh at least 45 kg',
            c: 'Not have donated blood within the past 3 months',
            d: 'Be free of active infections, certain chronic conditions, or communicable diseases',
            e: 'Provide accurate and truthful information during registration',
          },
          after: 'BloodLife reserves the right to remove any donor profile that does not meet these eligibility requirements.',
        },
        responsibilities: {
          title: '3. User Responsibilities',
          items: {
            a: 'Provide accurate, current, and complete information at registration and keep it updated',
            b: 'Keep your account credentials confidential and not share your password',
            c: 'Use the platform only for lawful, legitimate blood donation and request purposes',
            d: 'Not submit false blood requests or donor registrations',
            e: 'Not attempt to scrape, reverse-engineer, or abuse the platform’s APIs',
          },
          warnings: {
            a: 'Misuse of the blood request system for non-medical purposes may result in permanent account suspension and legal action',
          },
        },
        medical: {
          title: '4. Medical Disclaimer',
          notice: 'BloodLife is not a medical provider.',
          text: 'The platform facilitates connections between blood donors and patients but does not provide medical advice, diagnosis, or treatment. All blood collection and transfusion procedures must be performed by qualified medical professionals at licensed facilities. BloodLife is not liable for any medical outcomes resulting from blood donations or transfusions arranged through the platform.',
        },
        ip: {
          title: '5. Intellectual Property',
          text: 'All content, design, code, and trademarks on the BloodLife platform are the intellectual property of the development team at Hanoi University of Science and Technology (HUST). You may not copy, modify, distribute, or use any part of the platform without prior written permission, except as expressly permitted by these terms.',
        },
        liability: {
          title: '6. Limitation of Liability',
          warnings: {
            a: 'BloodLife provides the platform “as is” without warranty of any kind',
            b: 'We are not liable for any direct, indirect, or consequential damages arising from use of the Service',
            c: 'We do not guarantee continuous, uninterrupted availability of the platform',
            d: 'We are not responsible for the accuracy of donor or patient information submitted by users',
          },
        },
        termination: {
          title: '7. Termination',
          text: 'We reserve the right to suspend or terminate your account at any time if you violate these terms. You may delete your account at any time through your profile settings or by contacting us. Upon termination, your personal data will be deleted in accordance with our Privacy Policy.',
        },
        changes: {
          title: '8. Changes to Terms',
          text: 'We may update these Terms of Service from time to time. We will notify registered users of material changes via email. Continued use of the platform after changes are posted constitutes acceptance of the updated terms. The “Last updated” date at the top of this page will reflect any revisions.',
        },
        law: {
          title: '9. Governing Law',
          text: 'These terms are governed by the laws of the Kingdom of Cambodia. Any disputes arising from the use of BloodLife shall be resolved in the competent courts of Phnom Penh, Cambodia.',
        },
      },
    },
  },
  km: {
    privacy: {
      title: 'គោលការណ៍ឯកជនភាព',
      lead: 'យើងប្តេជ្ញាការពារទិន្នន័យផ្ទាល់ខ្លួន និងសិទ្ធិឯកជនភាពរបស់អ្នក។ គោលការណ៍នេះពន្យល់ពីរបៀបដែល BloodLife ប្រមូល ប្រើប្រាស់ និងការពារព័ត៌មានរបស់អ្នក។',
      updated: 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ សីហា ២០២៦',
      gdpr: 'អនុលោមតាម GDPR',
      contents: 'មាតិកា',
      collect: {
        title: 'ទិន្នន័យដែលយើងប្រមូល',
        intro: 'យើងប្រមូលតែព័ត៌មានដែលចាំបាច់សម្រាប់ដំណើរការវេទិកា BloodLife និងជួយផ្គូផ្គងការបរិច្ចាគឈាមប៉ុណ្ណោះ។',
        personalTitle: 'ព័ត៌មានផ្ទាល់ខ្លួន',
        personal: {
          a: 'ឈ្មោះពេញ អាសយដ្ឋានអ៊ីមែល និងលេខទូរស័ព្ទ នៅពេលអ្នកចុះឈ្មោះ',
          b: 'ប្រភេទឈាម ទីតាំង និងប្រវត្តិបរិច្ចាគ នៅពេលអ្នកចុះឈ្មោះជាអ្នកបរិច្ចាគ',
          c: 'រូបថតប្រវត្តិរូប (ស្រេចចិត្ត) ដែលអ្នកជ្រើសរើសផ្ទុកឡើង',
          d: 'ព័ត៌មានអ្នកជំងឺដែលផ្តល់ក្នុងទម្រង់ស្នើសុំឈាម',
        },
        technicalTitle: 'ទិន្នន័យបច្ចេកទេស',
        technical: {
          a: 'អាសយដ្ឋាន IP ប្រភេទកម្មវិធីរុករក និងព័ត៌មានឧបករណ៍ សម្រាប់កំណត់ត្រាសុវត្ថិភាព',
          b: 'សញ្ញាសម្គាល់វគ្គដែលប្រើសម្រាប់ផ្ទៀងផ្ទាត់ (រក្សាទុកដោយសុវត្ថិភាព មិនដែលនៅក្នុងខូគីទេ)',
          c: 'កំណត់ត្រាសំណើ API ដែលរក្សាទុក ៣០ ថ្ងៃ សម្រាប់សវនកម្មសុវត្ថិភាព',
        },
      },
      use: {
        title: 'របៀបដែលយើងប្រើទិន្នន័យរបស់អ្នក',
        intro: 'ទិន្នន័យរបស់អ្នកត្រូវបានប្រើតែសម្រាប់ដំណើរការវេទិកា និងធ្វើឱ្យលទ្ធផលនៃការបរិច្ចាគឈាមនៅកម្ពុជាកាន់តែប្រសើរប៉ុណ្ណោះ។',
        items: {
          a: 'ផ្គូផ្គងអ្នកបរិច្ចាគឈាមជាមួយអ្នកជំងឺដែលមានប្រភេទឈាមត្រូវគ្នា',
          b: 'ផ្ញើការរំលឹកការណាត់ជួប និងការបញ្ជាក់ការបរិច្ចាគ',
          c: 'បង្ហាញប្រវត្តិរូបអ្នកបរិច្ចាគរបស់អ្នកនៅក្នុងបញ្ជីអ្នកបរិច្ចាគសាធារណៈ (លុះត្រាតែអ្នកជ្រើសរើសថាទំនេរ)',
          d: 'បង្កើតស្ថិតិអនាមិកសម្រាប់របាយការណ៍សុខភាពសាធារណៈ',
          e: 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណរបស់អ្នក និងការពារសំណើក្លែងបន្លំ',
          f: 'កែលម្អវេទិកាតាមរយៈការវិភាគការប្រើប្រាស់ដែលសរុប និងអនាមិក',
        },
        never: 'យើងមិនដែលប្រើទិន្នន័យរបស់អ្នកសម្រាប់ការផ្សាយពាណិជ្ជកម្ម ការវិភាគទីផ្សារ ឬលក់វាទៅភាគីទីបីទេ។',
      },
      share: {
        title: 'ការចែករំលែកទិន្នន័យ',
        intro: 'យើងមិនលក់ ជួល ឬដោះដូរព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកទេ។ ទិន្នន័យអាចត្រូវបានចែករំលែកតែក្នុងករណីមានកំណត់ដូចខាងក្រោម៖',
        items: {
          hospitals: { label: 'មន្ទីរពេទ្យដៃគូ៖', text: 'ព័ត៌មានទំនាក់ទំនងរបស់អ្នកអាចត្រូវបានចែករំលែកជាមួយមន្ទីរពេទ្យដៃគូដែលបានផ្ទៀងផ្ទាត់ នៅពេលការផ្គូផ្គងឈាមត្រូវបានបញ្ជាក់ ហើយអ្នកបានយល់ព្រម' },
          legal: { label: 'កាតព្វកិច្ចផ្លូវច្បាប់៖', text: 'យើងអាចបង្ហាញទិន្នន័យ ប្រសិនបើច្បាប់កម្ពុជា ឬដីកាតុលាការតម្រូវ' },
          providers: { label: 'អ្នកផ្តល់សេវា៖', text: 'អ្នកផ្តល់ហេដ្ឋារចនាសម្ព័ន្ធពពក (MongoDB Atlas) ក្រោមកិច្ចព្រមព្រៀងដំណើរការទិន្នន័យដ៏តឹងរ៉ឹង' },
          ai: { label: 'ជំនួយការ AI៖', text: 'សារជជែកដែលផ្ញើទៅជំនួយការ AI ត្រូវបានដំណើរការដោយ Gemini API របស់ Google ហើយមិនត្រូវបានរក្សាទុកនៅលើម៉ាស៊ីនមេរបស់យើងទេ' },
        },
      },
      security: {
        title: 'សុវត្ថិភាព',
        intro: 'យើងអនុវត្តវិធានការបច្ចេកទេស និងរៀបចំស្តង់ដារឧស្សាហកម្ម ដើម្បីការពារទិន្នន័យរបស់អ្នក។',
        items: {
          a: 'ពាក្យសម្ងាត់ទាំងអស់ត្រូវបាន hash ដោយប្រើ bcrypt ជាមួយកម្រិតតម្លៃអប្បបរមា ១២',
          b: 'សញ្ញាសម្គាល់ផ្ទៀងផ្ទាត់ (JWT) ផុតកំណត់ក្រោយ ៨ ម៉ោង ហើយត្រូវបានចុះហត្ថលេខាដោយសោសម្ងាត់សុវត្ថិភាព',
          c: 'សំណើ API ទាំងអស់ត្រូវបានការពារពីការវាយប្រហារ NoSQL injection និង XSS',
          d: 'ការកំណត់អត្រាការពារការវាយប្រហារទាយពាក្យសម្ងាត់ (ចូល ១០ ដងក្នុង ១៥ នាទីក្នុងមួយ IP)',
          e: 'HTTPS ត្រូវបានតម្រូវក្នុងផលិតកម្ម ទិន្នន័យទាំងអស់ដែលកំពុងបញ្ជូនត្រូវបានអ៊ិនគ្រីបតាម TLS 1.2+',
          f: 'ឯកសារដែលផ្ទុកឡើងត្រូវបានពិនិត្យប្រភេទ និងទំហំ ហើយរក្សាទុកនៅក្រៅថតគេហទំព័រ',
          g: 'ក្បាលសុវត្ថិភាព (HSTS, X-Frame-Options, CSP) ត្រូវបានអនុវត្តតាម Helmet.js',
          h: 'កំណត់ត្រាសំណើម៉ាស៊ីនមេត្រូវបានពិនិត្យ និងលុបរៀងរាល់ ៣០ ថ្ងៃ',
        },
      },
      rights: {
        title: 'សិទ្ធិរបស់អ្នក',
        intro: 'អ្នកមានសិទ្ធិដូចខាងក្រោមទាក់ទងនឹងទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក៖',
        items: {
          access: { label: 'សិទ្ធិចូលមើល', text: 'ស្នើសុំច្បាប់ចម្លងនៃទិន្នន័យផ្ទាល់ខ្លួនទាំងអស់ដែលយើងមានអំពីអ្នក' },
          rectify: { label: 'សិទ្ធិកែតម្រូវ', text: 'កែតម្រូវទិន្នន័យផ្ទាល់ខ្លួនដែលមិនត្រឹមត្រូវ ឬមិនពេញលេញនៅពេលណាក៏បាន តាមការកំណត់ប្រវត្តិរូបរបស់អ្នក' },
          erase: { label: 'សិទ្ធិលុប', text: 'ស្នើសុំលុបគណនីរបស់អ្នក និងទិន្នន័យពាក់ព័ន្ធទាំងអស់' },
          port: { label: 'សិទ្ធិផ្ទេរទិន្នន័យ', text: 'ទទួលទិន្នន័យរបស់អ្នកជាទម្រង់ដែលម៉ាស៊ីនអានបាន (JSON) តាមការស្នើសុំ' },
          object: { label: 'សិទ្ធិជំទាស់', text: 'ជ្រើសរើសមិនឱ្យប្រវត្តិរូបអ្នកបរិច្ចាគរបស់អ្នកបង្ហាញនៅក្នុងបញ្ជីសាធារណៈ' },
          restrict: { label: 'សិទ្ធិដាក់កម្រិត', text: 'ស្នើសុំឱ្យយើងកម្រិតការដំណើរការទិន្នន័យរបស់អ្នកក្នុងកាលៈទេសៈមួយចំនួន' },
        },
        exercise: 'ដើម្បីប្រើសិទ្ធិណាមួយក្នុងចំណោមនេះ សូមទាក់ទងមកយើងតាម {email}។ យើងនឹងឆ្លើយតបក្នុងរយៈពេល ៣០ ថ្ងៃ។',
      },
      retention: {
        title: 'ការរក្សាទុកទិន្នន័យ',
        items: {
          a: 'គណនីអ្នកបរិច្ចាគ និងអ្នកប្រើដែលសកម្ម៖ រក្សាទុកខណៈពេលគណនីនៅសកម្ម',
          b: 'គណនីដែលបានលុប៖ ទិន្នន័យផ្ទាល់ខ្លួនទាំងអស់ត្រូវបានលុបក្នុងរយៈពេល ៣០ ថ្ងៃបន្ទាប់ពីសំណើលុប',
          c: 'កំណត់ត្រាសំណើឈាម៖ ធ្វើជាអនាមិក ហើយរក្សាទុក ២ ឆ្នាំសម្រាប់ស្ថិតិសុខភាពសាធារណៈ',
          d: 'កំណត់ត្រាចូលប្រើម៉ាស៊ីនមេ៖ រក្សាទុក ៣០ ថ្ងៃ បន្ទាប់មកលុបដោយស្វ័យប្រវត្តិ',
          e: 'រូបថតដែលបានផ្ទុកឡើង៖ លុបជាអចិន្ត្រៃយ៍នៅពេលបិទគណនី ឬដករូបថតចេញ',
        },
      },
      contact: {
        title: 'ទាក់ទងមកយើង',
        intro: 'ប្រសិនបើអ្នកមានសំណួរ កង្វល់ ឬសំណើណាមួយទាក់ទងនឹងគោលការណ៍ឯកជនភាពនេះ ឬទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក សូមទាក់ទងមក៖',
        controller: 'អ្នកគ្រប់គ្រងទិន្នន័យ BloodLife',
        org: 'សាកលវិទ្យាល័យវិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យាហាណូយ (HUST)',
        city: 'ហាណូយ វៀតណាម',
        email: 'អ៊ីមែល៖ {email}',
      },
    },
    terms: {
      title: 'លក្ខខណ្ឌប្រើប្រាស់',
      lead: 'តាមរយៈការប្រើ BloodLife អ្នកយល់ព្រមនឹងលក្ខខណ្ឌទាំងនេះ។ សូមអានវាដោយយកចិត្តទុកដាក់។',
      effective: 'មានប្រសិទ្ធភាព៖ សីហា ២០២៦',
      questions: 'មានសំណួរអំពីលក្ខខណ្ឌទាំងនេះ? ទាក់ទងមកយើងតាម {email}',
      sections: {
        acceptance: {
          title: '១. ការទទួលយកលក្ខខណ្ឌ',
          text: 'តាមរយៈការចូលប្រើ ឬប្រើវេទិកា BloodLife («សេវាកម្ម») អ្នកយល់ព្រមគោរពតាមលក្ខខណ្ឌប្រើប្រាស់ទាំងនេះ និងគោលការណ៍ឯកជនភាពរបស់យើង។ ប្រសិនបើអ្នកមិនយល់ព្រមនឹងលក្ខខណ្ឌទាំងនេះទេ សូមកុំប្រើសេវាកម្ម។ លក្ខខណ្ឌទាំងនេះអនុវត្តចំពោះអ្នកទស្សនា អ្នកបរិច្ចាគ និងអ្នកប្រើដែលបានចុះឈ្មោះទាំងអស់។',
        },
        eligibility: {
          title: '២. លក្ខណៈសម្បត្តិ',
          text: 'ដើម្បីចុះឈ្មោះជាអ្នកបរិច្ចាគនៅលើ BloodLife អ្នកត្រូវបំពេញលក្ខខណ្ឌដូចខាងក្រោម៖',
          items: {
            a: 'មានអាយុពី ១៨ ដល់ ៦០ ឆ្នាំ',
            b: 'មានទម្ងន់យ៉ាងហោចណាស់ ៤៥ គីឡូក្រាម',
            c: 'មិនបានបរិច្ចាគឈាមក្នុងរយៈពេល ៣ ខែចុងក្រោយ',
            d: 'មិនមានការឆ្លងមេរោគសកម្ម ជំងឺរ៉ាំរ៉ៃមួយចំនួន ឬជំងឺឆ្លង',
            e: 'ផ្តល់ព័ត៌មានត្រឹមត្រូវ និងពិតប្រាកដនៅពេលចុះឈ្មោះ',
          },
          after: 'BloodLife រក្សាសិទ្ធិដកចេញប្រវត្តិរូបអ្នកបរិច្ចាគណាដែលមិនបំពេញលក្ខខណ្ឌទាំងនេះ។',
        },
        responsibilities: {
          title: '៣. ទំនួលខុសត្រូវរបស់អ្នកប្រើ',
          items: {
            a: 'ផ្តល់ព័ត៌មានត្រឹមត្រូវ ទាន់សម័យ និងពេញលេញនៅពេលចុះឈ្មោះ ហើយធ្វើបច្ចុប្បន្នភាពជានិច្ច',
            b: 'រក្សាព័ត៌មានចូលគណនីរបស់អ្នកជាការសម្ងាត់ ហើយមិនចែករំលែកពាក្យសម្ងាត់',
            c: 'ប្រើវេទិកាតែសម្រាប់គោលបំណងបរិច្ចាគ និងស្នើសុំឈាមស្របច្បាប់ប៉ុណ្ណោះ',
            d: 'មិនដាក់សំណើឈាម ឬការចុះឈ្មោះអ្នកបរិច្ចាគក្លែងក្លាយ',
            e: 'មិនព្យាយាមទាញយកទិន្នន័យ វិស្វកម្មបញ្ច្រាស ឬរំលោភលើ API របស់វេទិកា',
          },
          warnings: {
            a: 'ការប្រើប្រាស់ប្រព័ន្ធស្នើសុំឈាមខុសគោលបំណងសម្រាប់ហេតុផលមិនមែនវេជ្ជសាស្ត្រ អាចនាំឱ្យមានការផ្អាកគណនីជាអចិន្ត្រៃយ៍ និងចំណាត់ការផ្លូវច្បាប់',
          },
        },
        medical: {
          title: '៤. ការបដិសេធផ្នែកវេជ្ជសាស្ត្រ',
          notice: 'BloodLife មិនមែនជាអ្នកផ្តល់សេវាវេជ្ជសាស្ត្រទេ។',
          text: 'វេទិកានេះជួយភ្ជាប់អ្នកបរិច្ចាគឈាម និងអ្នកជំងឺ ប៉ុន្តែមិនផ្តល់ដំបូន្មានវេជ្ជសាស្ត្រ ការធ្វើរោគវិនិច្ឆ័យ ឬការព្យាបាលទេ។ នីតិវិធីប្រមូល និងបញ្ចូលឈាមទាំងអស់ត្រូវធ្វើដោយអ្នកជំនាញវេជ្ជសាស្ត្រដែលមានលក្ខណៈសម្បត្តិ នៅកន្លែងដែលមានអាជ្ញាប័ណ្ណ។ BloodLife មិនទទួលខុសត្រូវចំពោះលទ្ធផលវេជ្ជសាស្ត្រណាមួយដែលកើតចេញពីការបរិច្ចាគ ឬបញ្ចូលឈាមដែលបានរៀបចំតាមរយៈវេទិកានេះទេ។',
        },
        ip: {
          title: '៥. កម្មសិទ្ធិបញ្ញា',
          text: 'មាតិកា ការរចនា កូដ និងពាណិជ្ជសញ្ញាទាំងអស់នៅលើវេទិកា BloodLife គឺជាកម្មសិទ្ធិបញ្ញារបស់ក្រុមអភិវឌ្ឍន៍នៅសាកលវិទ្យាល័យវិទ្យាសាស្ត្រ និងបច្ចេកវិទ្យាហាណូយ (HUST)។ អ្នកមិនអាចចម្លង កែប្រែ ចែកចាយ ឬប្រើផ្នែកណាមួយនៃវេទិកាដោយគ្មានការអនុញ្ញាតជាលាយលក្ខណ៍អក្សរជាមុនទេ លើកលែងតែមានការអនុញ្ញាតយ៉ាងច្បាស់ក្នុងលក្ខខណ្ឌទាំងនេះ។',
        },
        liability: {
          title: '៦. ការកម្រិតទំនួលខុសត្រូវ',
          warnings: {
            a: 'BloodLife ផ្តល់វេទិកា «តាមស្ថានភាពជាក់ស្តែង» ដោយគ្មានការធានាណាមួយ',
            b: 'យើងមិនទទួលខុសត្រូវចំពោះការខូចខាតផ្ទាល់ ប្រយោល ឬជាលទ្ធផលដែលកើតចេញពីការប្រើសេវាកម្មទេ',
            c: 'យើងមិនធានាថាវេទិកានឹងអាចប្រើបានជាបន្តបន្ទាប់ ដោយគ្មានការរំខានទេ',
            d: 'យើងមិនទទួលខុសត្រូវចំពោះភាពត្រឹមត្រូវនៃព័ត៌មានអ្នកបរិច្ចាគ ឬអ្នកជំងឺដែលអ្នកប្រើបានដាក់ស្នើទេ',
          },
        },
        termination: {
          title: '៧. ការបញ្ចប់',
          text: 'យើងរក្សាសិទ្ធិផ្អាក ឬបិទគណនីរបស់អ្នកនៅពេលណាក៏បាន ប្រសិនបើអ្នករំលោភលើលក្ខខណ្ឌទាំងនេះ។ អ្នកអាចលុបគណនីរបស់អ្នកនៅពេលណាក៏បាន តាមការកំណត់ប្រវត្តិរូប ឬដោយទាក់ទងមកយើង។ នៅពេលបញ្ចប់ ទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នកនឹងត្រូវបានលុបស្របតាមគោលការណ៍ឯកជនភាពរបស់យើង។',
        },
        changes: {
          title: '៨. ការផ្លាស់ប្តូរលក្ខខណ្ឌ',
          text: 'យើងអាចធ្វើបច្ចុប្បន្នភាពលក្ខខណ្ឌប្រើប្រាស់ទាំងនេះពីពេលមួយទៅពេលមួយ។ យើងនឹងជូនដំណឹងដល់អ្នកប្រើដែលបានចុះឈ្មោះអំពីការផ្លាស់ប្តូរសំខាន់ៗតាមអ៊ីមែល។ ការបន្តប្រើវេទិកាបន្ទាប់ពីការផ្លាស់ប្តូរត្រូវបានផ្សព្វផ្សាយ មានន័យថាអ្នកទទួលយកលក្ខខណ្ឌដែលបានធ្វើបច្ចុប្បន្នភាព។ កាលបរិច្ឆេទ «ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ» នៅខាងលើទំព័រនេះនឹងបង្ហាញការកែប្រែណាមួយ។',
        },
        law: {
          title: '៩. ច្បាប់គ្រប់គ្រង',
          text: 'លក្ខខណ្ឌទាំងនេះស្ថិតក្រោមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ វិវាទណាមួយដែលកើតចេញពីការប្រើ BloodLife នឹងត្រូវដោះស្រាយនៅតុលាការមានសមត្ថកិច្ចនៃរាជធានីភ្នំពេញ ប្រទេសកម្ពុជា។',
        },
      },
    },
  },
  vi: {
    privacy: {
      title: 'Chính sách quyền riêng tư',
      lead: 'Chúng tôi cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của bạn. Chính sách này giải thích cách BloodLife thu thập, sử dụng và bảo vệ thông tin của bạn.',
      updated: 'Cập nhật lần cuối: tháng 8 năm 2026',
      gdpr: 'Tuân thủ GDPR',
      contents: 'Mục lục',
      collect: {
        title: 'Dữ liệu chúng tôi thu thập',
        intro: 'Chúng tôi chỉ thu thập thông tin cần thiết để vận hành nền tảng BloodLife và hỗ trợ kết nối hiến máu.',
        personalTitle: 'Thông tin cá nhân',
        personal: {
          a: 'Họ tên, địa chỉ email và số điện thoại khi bạn đăng ký',
          b: 'Nhóm máu, địa điểm và lịch sử hiến máu khi bạn đăng ký làm người hiến máu',
          c: 'Ảnh hồ sơ (không bắt buộc) mà bạn chọn tải lên',
          d: 'Thông tin bệnh nhân được cung cấp trong biểu mẫu yêu cầu máu',
        },
        technicalTitle: 'Dữ liệu kỹ thuật',
        technical: {
          a: 'Địa chỉ IP, loại trình duyệt và thông tin thiết bị để ghi nhật ký bảo mật',
          b: 'Mã phiên dùng để xác thực (được lưu an toàn, không bao giờ trong cookie)',
          c: 'Nhật ký yêu cầu API được lưu 30 ngày để kiểm tra bảo mật',
        },
      },
      use: {
        title: 'Cách chúng tôi sử dụng dữ liệu',
        intro: 'Dữ liệu của bạn chỉ được dùng để vận hành nền tảng và cải thiện kết quả hiến máu tại Campuchia.',
        items: {
          a: 'Kết nối người hiến máu với bệnh nhân có nhóm máu tương thích',
          b: 'Gửi lời nhắc lịch hẹn và xác nhận hiến máu',
          c: 'Hiển thị hồ sơ người hiến máu của bạn trong danh bạ công khai (chỉ khi bạn chọn sẵn sàng)',
          d: 'Tạo số liệu thống kê ẩn danh cho báo cáo y tế công cộng',
          e: 'Xác minh danh tính và ngăn chặn yêu cầu gian lận',
          f: 'Cải thiện nền tảng qua phân tích sử dụng tổng hợp, ẩn danh',
        },
        never: 'Chúng tôi không bao giờ dùng dữ liệu của bạn cho quảng cáo, lập hồ sơ tiếp thị, hoặc bán cho bên thứ ba.',
      },
      share: {
        title: 'Chia sẻ dữ liệu',
        intro: 'Chúng tôi không bán, cho thuê hay trao đổi thông tin cá nhân của bạn. Dữ liệu chỉ có thể được chia sẻ trong các trường hợp hạn chế sau:',
        items: {
          hospitals: { label: 'Bệnh viện đối tác:', text: 'Thông tin liên hệ của bạn có thể được chia sẻ với bệnh viện đối tác đã xác minh khi việc kết nối máu được xác nhận và bạn đã đồng ý' },
          legal: { label: 'Nghĩa vụ pháp lý:', text: 'Chúng tôi có thể tiết lộ dữ liệu nếu luật pháp Campuchia hoặc lệnh tòa yêu cầu' },
          providers: { label: 'Nhà cung cấp dịch vụ:', text: 'Nhà cung cấp hạ tầng đám mây (MongoDB Atlas) theo các thỏa thuận xử lý dữ liệu nghiêm ngặt' },
          ai: { label: 'Trợ lý AI:', text: 'Tin nhắn gửi tới trợ lý AI được xử lý bởi Gemini API của Google và không được lưu trên máy chủ của chúng tôi' },
        },
      },
      security: {
        title: 'Bảo mật',
        intro: 'Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức theo tiêu chuẩn ngành để bảo vệ dữ liệu của bạn.',
        items: {
          a: 'Mọi mật khẩu đều được băm bằng bcrypt với hệ số chi phí tối thiểu là 12',
          b: 'Mã xác thực (JWT) hết hạn sau 8 giờ và được ký bằng khóa bí mật an toàn',
          c: 'Mọi yêu cầu API đều được bảo vệ khỏi tấn công NoSQL injection và XSS',
          d: 'Giới hạn tần suất ngăn chặn tấn công dò mật khẩu (10 lần đăng nhập mỗi 15 phút cho mỗi IP)',
          e: 'Bắt buộc HTTPS khi vận hành thực tế; mọi dữ liệu truyền đi đều được mã hóa qua TLS 1.2+',
          f: 'Tệp tải lên được kiểm tra loại và dung lượng; lưu bên ngoài thư mục web',
          g: 'Các header bảo mật (HSTS, X-Frame-Options, CSP) được áp dụng qua Helmet.js',
          h: 'Nhật ký yêu cầu máy chủ được xem xét và xóa mỗi 30 ngày',
        },
      },
      rights: {
        title: 'Quyền của bạn',
        intro: 'Bạn có các quyền sau đối với dữ liệu cá nhân của mình:',
        items: {
          access: { label: 'Quyền truy cập', text: 'Yêu cầu bản sao toàn bộ dữ liệu cá nhân chúng tôi lưu về bạn' },
          rectify: { label: 'Quyền chỉnh sửa', text: 'Sửa dữ liệu cá nhân không chính xác hoặc chưa đầy đủ bất cứ lúc nào trong phần cài đặt hồ sơ' },
          erase: { label: 'Quyền xóa', text: 'Yêu cầu xóa tài khoản và mọi dữ liệu liên quan' },
          port: { label: 'Quyền di chuyển dữ liệu', text: 'Nhận dữ liệu của bạn ở định dạng máy đọc được (JSON) khi yêu cầu' },
          object: { label: 'Quyền phản đối', text: 'Chọn không hiển thị hồ sơ người hiến máu của bạn trong danh bạ công khai' },
          restrict: { label: 'Quyền hạn chế', text: 'Yêu cầu chúng tôi hạn chế xử lý dữ liệu của bạn trong một số trường hợp' },
        },
        exercise: 'Để thực hiện bất kỳ quyền nào, hãy liên hệ với chúng tôi tại {email}. Chúng tôi sẽ phản hồi trong vòng 30 ngày.',
      },
      retention: {
        title: 'Lưu giữ dữ liệu',
        items: {
          a: 'Tài khoản người hiến máu và người dùng đang hoạt động: lưu giữ khi tài khoản còn hoạt động',
          b: 'Tài khoản đã xóa: mọi dữ liệu cá nhân được xóa trong vòng 30 ngày kể từ khi yêu cầu xóa',
          c: 'Hồ sơ yêu cầu máu: được ẩn danh và lưu 2 năm cho thống kê y tế công cộng',
          d: 'Nhật ký truy cập máy chủ: lưu 30 ngày, sau đó tự động xóa',
          e: 'Ảnh đã tải lên: xóa vĩnh viễn khi đóng tài khoản hoặc gỡ ảnh',
        },
      },
      contact: {
        title: 'Liên hệ',
        intro: 'Nếu bạn có câu hỏi, thắc mắc hoặc yêu cầu liên quan đến chính sách quyền riêng tư này hoặc dữ liệu cá nhân, vui lòng liên hệ:',
        controller: 'Bộ phận kiểm soát dữ liệu BloodLife',
        org: 'Đại học Bách khoa Hà Nội (HUST)',
        city: 'Hà Nội, Việt Nam',
        email: 'Thư điện tử: {email}',
      },
    },
    terms: {
      title: 'Điều khoản dịch vụ',
      lead: 'Khi sử dụng BloodLife, bạn đồng ý với các điều khoản này. Vui lòng đọc kỹ.',
      effective: 'Có hiệu lực: tháng 8 năm 2026',
      questions: 'Có câu hỏi về các điều khoản này? Liên hệ với chúng tôi tại {email}',
      sections: {
        acceptance: {
          title: '1. Chấp nhận điều khoản',
          text: 'Khi truy cập hoặc sử dụng nền tảng BloodLife (“Dịch vụ”), bạn đồng ý tuân theo các Điều khoản dịch vụ này và Chính sách quyền riêng tư của chúng tôi. Nếu bạn không đồng ý, vui lòng không sử dụng Dịch vụ. Các điều khoản này áp dụng cho mọi khách truy cập, người hiến máu và người dùng đã đăng ký.',
        },
        eligibility: {
          title: '2. Điều kiện',
          text: 'Để đăng ký làm người hiến máu trên BloodLife, bạn phải đáp ứng các tiêu chí sau:',
          items: {
            a: 'Từ 18 đến 60 tuổi',
            b: 'Cân nặng ít nhất 45 kg',
            c: 'Chưa hiến máu trong 3 tháng gần đây',
            d: 'Không mắc bệnh nhiễm trùng đang hoạt động, một số bệnh mãn tính hoặc bệnh truyền nhiễm',
            e: 'Cung cấp thông tin chính xác và trung thực khi đăng ký',
          },
          after: 'BloodLife có quyền gỡ bỏ bất kỳ hồ sơ người hiến máu nào không đáp ứng các điều kiện này.',
        },
        responsibilities: {
          title: '3. Trách nhiệm của người dùng',
          items: {
            a: 'Cung cấp thông tin chính xác, cập nhật và đầy đủ khi đăng ký, và luôn cập nhật thông tin',
            b: 'Giữ bí mật thông tin đăng nhập và không chia sẻ mật khẩu',
            c: 'Chỉ dùng nền tảng cho mục đích hiến máu và yêu cầu máu hợp pháp, chính đáng',
            d: 'Không gửi yêu cầu máu hoặc đăng ký người hiến máu giả mạo',
            e: 'Không cố thu thập dữ liệu tự động, dịch ngược hoặc lạm dụng API của nền tảng',
          },
          warnings: {
            a: 'Lạm dụng hệ thống yêu cầu máu cho mục đích phi y tế có thể dẫn đến khóa tài khoản vĩnh viễn và bị xử lý theo pháp luật',
          },
        },
        medical: {
          title: '4. Tuyên bố miễn trừ y khoa',
          notice: 'BloodLife không phải là đơn vị cung cấp dịch vụ y tế.',
          text: 'Nền tảng hỗ trợ kết nối người hiến máu và bệnh nhân nhưng không cung cấp tư vấn, chẩn đoán hay điều trị y khoa. Mọi quy trình lấy máu và truyền máu phải được thực hiện bởi nhân viên y tế có chuyên môn tại cơ sở được cấp phép. BloodLife không chịu trách nhiệm về bất kỳ kết quả y khoa nào phát sinh từ việc hiến hoặc truyền máu được sắp xếp qua nền tảng.',
        },
        ip: {
          title: '5. Sở hữu trí tuệ',
          text: 'Mọi nội dung, thiết kế, mã nguồn và nhãn hiệu trên nền tảng BloodLife là tài sản trí tuệ của nhóm phát triển tại Đại học Bách khoa Hà Nội (HUST). Bạn không được sao chép, chỉnh sửa, phân phối hoặc sử dụng bất kỳ phần nào của nền tảng khi chưa có sự cho phép bằng văn bản, trừ khi được các điều khoản này cho phép rõ ràng.',
        },
        liability: {
          title: '6. Giới hạn trách nhiệm',
          warnings: {
            a: 'BloodLife cung cấp nền tảng “nguyên trạng” mà không có bất kỳ bảo đảm nào',
            b: 'Chúng tôi không chịu trách nhiệm về thiệt hại trực tiếp, gián tiếp hoặc hệ quả phát sinh từ việc sử dụng Dịch vụ',
            c: 'Chúng tôi không bảo đảm nền tảng luôn hoạt động liên tục, không gián đoạn',
            d: 'Chúng tôi không chịu trách nhiệm về độ chính xác của thông tin người hiến máu hoặc bệnh nhân do người dùng gửi',
          },
        },
        termination: {
          title: '7. Chấm dứt',
          text: 'Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản của bạn bất cứ lúc nào nếu bạn vi phạm các điều khoản này. Bạn có thể xóa tài khoản bất cứ lúc nào trong phần cài đặt hồ sơ hoặc bằng cách liên hệ với chúng tôi. Khi chấm dứt, dữ liệu cá nhân của bạn sẽ được xóa theo Chính sách quyền riêng tư.',
        },
        changes: {
          title: '8. Thay đổi điều khoản',
          text: 'Chúng tôi có thể cập nhật các Điều khoản dịch vụ này theo thời gian và sẽ thông báo cho người dùng đã đăng ký về những thay đổi quan trọng qua email. Việc tiếp tục sử dụng nền tảng sau khi thay đổi được đăng đồng nghĩa với việc chấp nhận điều khoản mới. Ngày “Cập nhật lần cuối” ở đầu trang sẽ phản ánh mọi sửa đổi.',
        },
        law: {
          title: '9. Luật điều chỉnh',
          text: 'Các điều khoản này được điều chỉnh bởi pháp luật Vương quốc Campuchia. Mọi tranh chấp phát sinh từ việc sử dụng BloodLife sẽ được giải quyết tại tòa án có thẩm quyền ở Phnom Penh, Campuchia.',
        },
      },
    },
  },
};

export default messages;
