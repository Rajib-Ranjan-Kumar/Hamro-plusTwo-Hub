export interface TranslationSection {
  [key: string]: string;
}

export interface TranslationLocale {
  [section: string]: TranslationSection;
}

export interface TranslationDictionary {
  [locale: string]: TranslationLocale;
}

export const translations: TranslationDictionary = {
  en: {
    navbar: {
      home: "Home",
      about: "About",
      contact: "Contact",
      faq: "FAQ",
      privacy: "Privacy Policy",
      pyqs: "PYQs",
      notes: "Notes",
      syllabus: "Syllabus",
      chat: "Chat",
      membership: "Membership",
      login: "Log In"
    },
    hero: {
      title: "Your Hard Work,\nOur Support",
      subtitle: "PYQs, Notes & Study Materials\nfor Your Success...",
      getStarted: "🚀 Get Started",
      exploreNow: "▶ Explore Now"
    },
    about: {
      tag: "Watch How Hamro +2 Works",
      title: "Why Hamro +2?",
      desc: "We provide a complete study companion for +2 science and management students in Nepal. Easily access question banks, notes, exam patterns, and complete resources for your term prep.",
      feature1Title: "Smart Learning",
      feature1Desc: "Access high-quality revision files, subject guides, and verified reference documents.",
      feature2Title: "Free Resources",
      feature2Desc: "No subscriptions required. Free updates on notes and solutions from top colleges.",
      feature3Title: "Easy Access",
      feature3Desc: "Clean navigation and simple downloads for preparation on the go."
    },
    features: {
      tag: "Everything You Need",
      desc: "All the tools and resources you need to excel in your +2 examinations.",
      card1Title: "Previous Year Questions",
      card1Desc: "Detailed past papers with step-by-step solution breakdowns for revision.",
      card2Title: "Structured Notes",
      card2Desc: "Handwritten and typed notes from top teachers in Kathmandu Valley.",
      card3Title: "Contribute Notes",
      card3Desc: "Share your own class notes to help peers and get recognized on our platform.",
      card4Title: "Student Leaderboard",
      card4Desc: "Earn reputation badges for verified notes uploads and correct solutions.",
      card5Title: "Peer Discussions",
      card5Desc: "Ask doubts and get answers from fellow +2 students across Nepal.",
      card6Title: "Syllabus Compliance",
      card6Desc: "100% updated according to the latest NEB board exam patterns."
    },
    subjects: {
      title: "Access Course Subjects",
      desc: "Choose your course and access curated notes, questions, and guides.",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Biology",
      math: "Mathematics",
      cs: "Computer Science",
      english: "English",
      filesCount: "Files"
    },
    feedback: {
      title: "Student Feedback",
      desc: "Hear what students and contributors from colleges across Nepal say.",
      student1Role: "St. Xavier's College",
      student1Review: "The mathematics notes solved references are amazing. Saved a lot of time before my board terminals.",
      student2Role: "Trinity International",
      student2Review: "Direct downloads and neat interface. Highly recommend for NEB board exams preparation notes.",
      student3Role: "KMC Lalitpur",
      student3Review: "Contributing notes is highly motivating. The leaderboard badge adds a fun competitive touch."
    },
    faq: {
      title: "Frequently Asked Questions",
      desc: "Quick answers to the common questions about Hamro +2 Hub.",
      q1: "Is Hamro +2 Hub completely free to use?",
      a1: "Yes, access to all note files, term papers, and solutions is 100% free with no hidden charges.",
      q2: "How can I contribute my study materials?",
      a2: "Register/Login with Google, click the Contribute tab in your dashboard, and upload your PDF files.",
      q3: "Are the resources aligned with NEB board?",
      a3: "Yes, all materials are verified according to the latest syllabus of Nepal National Examinations Board (NEB).",
      q4: "How does the student leaderboard badge system work?",
      a4: "You earn repute points each time your contributed document is downloaded or approved by admin."
    },
    footer: {
      tagline: "Nepal's collaborative platform for high school students. Quality resources, syllabus references, and term guides.",
      quickLinks: "Quick Links",
      dashboard: "Study Dashboard",
      contribute: "Contribute File",
      syllabus: "Course Syllabus",
      contactUs: "Contact Us",
      followUs: "Follow Us",
      copyright: "Hamro +2 Hub. Made with love in Nepal. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions"
    }
  },
  ne: {
    navbar: {
      home: "गृहपृष्ठ",
      about: "हाम्रो बारेमा",
      contact: "सम्पर्क",
      faq: "प्रश्नोत्तर",
      privacy: "गोपनीयता नीति",
      pyqs: "पुरानो प्रश्नहरू",
      notes: "नोटहरू",
      syllabus: "पाठ्यक्रम",
      chat: "च्याट",
      membership: "सदस्यता",
      login: "लगइन"
    },
    hero: {
      title: "तपाईँको मेहनत,\nहाम्रो सहयोग",
      subtitle: "पुरानो प्रश्नहरू, नोटहरू र अध्ययन सामग्रीहरू\nतपाईँको सफलताको लागि...",
      getStarted: "🚀 सुरु गर्नुहोस्",
      exploreNow: "▶ अन्वेषण गर्नुहोस्"
    },
    about: {
      tag: "हाम्रो +२ कसरी काम गर्छ हेर्नुहोस्",
      title: "किन हाम्रो +२?",
      desc: "हामी नेपालमा +२ विज्ञान र व्यवस्थापनका विद्यार्थीहरूको लागि पूर्ण अध्ययन साथी प्रदान गर्दछौं। तपाईँको परीक्षाको तयारीको लागि प्रश्न संग्रह, नोटहरू, परीक्षा ढाँचा र पूर्ण स्रोतहरू सजिलै पहुँच गर्नुहोस्।",
      feature1Title: "स्मार्ट सिकाइ",
      feature1Desc: "उच्च गुणस्तरका संशोधन फाइलहरू, विषय निर्देशिकाहरू, र प्रमाणित सन्दर्भ कागजातहरू पहुँच गर्नुहोस्।",
      feature2Title: "नि: शुल्क स्रोतहरू",
      feature2Desc: "कुनै सदस्यता आवश्यक छैन। शीर्ष कलेजहरूबाट नोटहरू र समाधानहरूमा नि: शुल्क अपडेटहरू।",
      feature3Title: "सजिलो पहुँच",
      feature3Desc: "यात्राको क्रममा तयारीको लागि सफा नेभिगेसन र सरल डाउनलोडहरू।"
    },
    features: {
      tag: "तपाईँलाई चाहिने सबै थोक",
      desc: "तपाईँको +२ परीक्षामा उत्कृष्ट हुन आवश्यक पर्ने सबै उपकरण र स्रोतहरू।",
      card1Title: "पुरानो वर्षका प्रश्नहरू",
      card1Desc: "संशोधनको लागि चरण-दर-चरण समाधान विवरणहरू सहित विस्तृत पुराना प्रश्नपत्रहरू।",
      card2Title: "व्यवस्थित नोटहरू",
      card2Desc: "काठमाडौं उपत्यकाका उत्कृष्ट शिक्षकहरूबाट हस्तलिखित र टाइप गरिएका नोटहरू।",
      card3Title: "नोटहरू योगदान गर्नुहोस्",
      card3Desc: "साथीहरूलाई मयत गर्न आफ्नै कक्षाका नोटहरू साझा गर्नुहोस् र हाम्रो प्लेटफर्ममा मान्यता पाउनुहोस्।",
      card4Title: "विद्यार्थी लिडरबोर्ड",
      card4Desc: "प्रमाणित नोटहरू अपलोड र सही समाधानहरूको लागि प्रतिष्ठा ब्याजहरू कमाउनुहोस्।",
      card5Title: "साथीहरू बीच छलफल",
      card5Desc: "नेपालभरिका सहपाठी +२ विद्यार्थीहरूबाट शंकाहरू सोध्नुहोस् र जवाफहरू प्राप्त गर्नुहोस्।",
      card6Title: "पाठ्यक्रम अनुकूलता",
      card6Desc: "नवीनतम NEB बोर्ड परीक्षा ढाँचा अनुसार १००% अपडेट गरिएको।"
    },
    subjects: {
      title: "पाठ्यक्रमका विषयहरू पहुँच गर्नुहोस्",
      desc: "आफ्नो पाठ्यक्रम छनौट गर्नुहोस् र क्युरेट गरिएका नोटहरू, प्रश्नहरू, र निर्देशिकाहरू पहुँच गर्नुहोस्।",
      physics: "भौतिक विज्ञान",
      chemistry: "रसायन विज्ञान",
      biology: "जीवविज्ञान",
      math: "गणित",
      cs: "कम्प्युटर विज्ञान",
      english: "अंग्रेजी",
      filesCount: "फाइलहरू"
    },
    feedback: {
      title: "विद्यार्थीहरूको प्रतिक्रिया",
      desc: "नेपालभरिका कलेजका विद्यार्थी र योगदानकर्ताहरूले के भन्छन् सुन्नुहोस्।",
      student1Role: "सेन्ट जेभियर्स कलेज",
      student1Review: "गणितको नोटहरू समाधान गरिएका सन्दर्भहरू अद्भुत छन्। मेरो बोर्ड परीक्षा अघि धेरै समय बचायो।",
      student2Role: "ट्रिनिटी इन्टरनेशनल",
      student2Review: "प्रत्यक्ष डाउनलोड र सफा इन्टरफेस। NEB बोर्ड परीक्षा तयारी नोटहरूको लागि दृढताका साथ सिफारिस गर्दछु।",
      student3Role: "केएमसी ललितपुर",
      student3Review: "नोटहरू योगदान गर्नु अत्यन्तै प्रेरणादायी छ। लिडरबोर्ड ब्याजले एक रमाइलो प्रतिस्पर्धात्मक भावना थप्छ।"
    },
    faq: {
      title: "बारम्बार सोधिने प्रश्नहरू",
      desc: "हाम्रो +२ हबको बारेमा साझा प्रश्नहरूको द्रुत जवाफ।",
      q1: "के हाम्रो +२ हब प्रयोग गर्न पूर्ण रूपमा नि:शुल्क छ?",
      a1: "हो, सबै नोट फाइलहरू, टर्मिनल परीक्षाहरू र समाधानहरूमा पहुँच कुनै लुकेको शुल्क बिना १००% नि:शुल्क छ।",
      q2: "मैले आफ्नो अध्ययन सामग्री कसरी योगदान गर्न सक्छु?",
      a2: "गुगल मार्फत दर्ता/लगइन गर्नुहोस्, आफ्नो ड्यासबोर्डमा रहेको योगदान (Contribute) ट्याबमा क्लिक गर्नुहोस् र आफ्ना पीडीएफ फाइलहरू अपलोड गर्नुहोस्।",
      q3: "के स्रोतहरू NEB बोर्डसँग मिल्दाजुल्दा छन्?",
      a3: "हो, सबै सामग्रीहरू नेपाल राष्ट्रिय परीक्षा बोर्ड (NEB) को पछिल्लो पाठ्यक्रम अनुसार प्रमाणित छन्।",
      q4: "विद्यार्थी लिडरबोर्ड ब्याज प्रणालीले कसरी काम गर्छ?",
      a4: "तपाईँले योगदान गर्नुभएको कागजात डाउनलोड हुँदा वा एडमिनद्वारा स्वीकृत हुँदा तपाईँले प्रतिष्ठा अंकहरू कमाउनुहुन्छ।"
    },
    footer: {
      tagline: "उच्च माध्यमिक विद्यार्थीहरूको लागि नेपालको सहयोगी प्लेटफर्म। गुणस्तरीय स्रोतहरू, पाठ्यक्रम सन्दर्भहरू, र परीक्षा निर्देशिकाहरू।",
      quickLinks: "द्रुत लिङ्कहरू",
      dashboard: "अध्ययन ड्यासबोर्ड",
      contribute: "फाइल योगदान गर्नुहोस्",
      syllabus: "पाठ्यक्रम",
      contactUs: "सम्पर्क गर्नुहोस्",
      followUs: "हामीलाई पछ्याउनुहोस्",
      copyright: "Hamro +2 Hub। नेपालमा मायाका साथ बनाइएको। सबै अधिकार सुरक्षित।",
      privacy: "गोपनीयता नीति",
      terms: "नियम र सर्तहरू"
    }
  }
};
