/**
 * Thai content for RAE Institutional Website Template
 */
export const contentTH = {
  site: {
    name: "RAE",
    fullName: "Research Academy of Excellence",
    tagline: "ศูนย์กลางงานวิจัยและนวัตกรรมเพื่อผลลัพธ์ที่วัดได้",
    mission:
      "ขับเคลื่อนงานวิจัย นวัตกรรม และความร่วมมือสู่ผลลัพธ์ที่เกิดประโยชน์ต่อสังคมและเศรษฐกิจ",
  },

  nav: {
    about: "เกี่ยวกับเรา",
    research: "การวิจัย",
    education: "การศึกษา",
    news: "ข่าวสาร",
    impact: "ผลกระทบ",
    contact: "ติดต่อ",
    applyNow: "สมัคร",
    langToggle: "EN",
  },

  hero: {
    title: "ศูนย์ความเป็นเลิศด้านการวิจัยและนวัตกรรม",
    subtitle: "ขับเคลื่อนองค์ความรู้สู่ผลลัพธ์จริง",
    description:
      "RAE เชื่อมโยงนักวิจัย ภาคอุตสาหกรรม และสังคม เพื่อสร้างงานวิจัยคุณภาพ นวัตกรรมใช้งานได้จริง และผลกระทบที่วัดผลได้",
    ctaPrimary: "สำรวจงานวิจัย",
    ctaSecondary: "ดูผลงานและข่าวสาร",
    scrollHint: "เลื่อนลง",
  },

  ticker: {
    label: "อัปเดตล่าสุด:",
    items: [
      "เปิดรับสมัครทุนวิจัยรอบใหม่ — ตรวจสอบคุณสมบัติและกำหนดเวลาสมัคร",
      "ทีมวิจัย AI Lab ได้รับการยอมรับจากเวทีวิชาการนานาชาติ",
      "สัมมนา 'นวัตกรรมเพื่อความยั่งยืน' เปิดลงทะเบียนแล้ว",
      "เปิดใช้งานฐานข้อมูลงานวิจัยชุดใหม่สำหรับนักวิจัยและนักศึกษา",
    ],
  },

  services: {
    title: "บริการของเรา",
    subtitle: "เข้าถึงทรัพยากรและบริการที่คุณต้องการ",
    items: [
      { id: "research", icon: "flask", label: "Research Portal", desc: "ฐานข้อมูลงานวิจัย" },
      { id: "library", icon: "book-open", label: "E-Library", desc: "ห้องสมุดอิเล็กทรอนิกส์" },
      { id: "grants", icon: "dollar-sign", label: "Grant Applications", desc: "ระบบสมัครทุน" },
      { id: "calendar", icon: "calendar", label: "Academic Calendar", desc: "ปฏิทินวิชาการ" },
      { id: "student", icon: "user-graduate", label: "Student Portal", desc: "พอร์ทัลนักศึกษา" },
      { id: "lab", icon: "microscope", label: "Lab Booking", desc: "จองห้องปฏิบัติการ" },
      { id: "publication", icon: "file-text", label: "Publications DB", desc: "ฐานข้อมูลตีพิมพ์" },
      { id: "network", icon: "globe", label: "Collab Network", desc: "เครือข่ายความร่วมมือ" },
    ],
  },

  research: {
    title: "ความเป็นเลิศด้านการวิจัย",
    subtitle: "Areas of Excellence",
    viewAll: "ดูทั้งหมด",
    areas: [
      {
        id: "life-sci",
        tag: "ชีววิทยาการแพทย์",
        tagColor: "teal",
        title: "วิทยาศาสตร์ชีวภาพและการแพทย์",
        desc: "การวิจัยด้านจีโนมิกส์ พันธุศาสตร์ และการพัฒนายาใหม่เพื่อสุขภาพที่ดีขึ้นของมนุษย์",
        link: "/research/life-sciences",
        image: "/rae-assets/research/life-sci.svg",
      },
      {
        id: "ai-data",
        tag: "เทคโนโลยี AI",
        tagColor: "blue",
        title: "ปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล",
        desc: "การประยุกต์ใช้ Machine Learning และ Deep Learning เพื่อแก้ปัญหาที่ซับซ้อนในระดับสังคม",
        link: "/research/ai-data",
        image: "/rae-assets/research/ai-data.svg",
      },
      {
        id: "sustain",
        tag: "ความยั่งยืน",
        tagColor: "green",
        title: "เทคโนโลยีและสิ่งแวดล้อมยั่งยืน",
        desc: "นวัตกรรมพลังงานสะอาด การจัดการทรัพยากร และโซลูชันสำหรับการเปลี่ยนแปลงสภาพภูมิอากาศ",
        link: "/research/sustainability",
        image: "/rae-assets/research/sustain.svg",
      },
      {
        id: "social",
        tag: "นวัตกรรมสังคม",
        tagColor: "amber",
        title: "นวัตกรรมสังคมและนโยบาย",
        desc: "การวิจัยด้านนโยบายสาธารณะ เศรษฐกิจสร้างสรรค์ และการพัฒนาชุมชนอย่างยั่งยืน",
        link: "/research/social",
        image: "/rae-assets/research/social.svg",
      },
    ],
  },

  news: {
    title: "ข่าวสารและกิจกรรม",
    subtitle: "ความก้าวหน้าล่าสุด",
    viewAll: "ดูข่าวทั้งหมด",
    categories: {
      research: "วิจัย",
      event: "กิจกรรม",
      award: "รางวัล",
      announcement: "ประกาศ",
    },
    items: [
      {
        id: "n1",
        category: "award",
        date: "28 เม.ย. 2567",
        title: "RAE ได้รับรางวัลสถาบันวิจัยนวัตกรรมโดดเด่นจาก NRCT",
        excerpt: "ผลงานวิจัยและความร่วมมือของสถาบันได้รับการยอมรับในระดับประเทศ",
        link: "/news/award-nrct-2567",
        image: "/rae-assets/news/award1.svg",
      },
      {
        id: "n2",
        category: "event",
        date: "15 พ.ค. 2567",
        title: "สัมมนานานาชาติ Future of Research ครั้งที่ 5 เปิดเวทีแล้ว",
        excerpt: "พบการบรรยายและแลกเปลี่ยนประสบการณ์กับนักวิจัยชั้นนำจากหลายสาขา",
        link: "/events/intl-seminar-2567",
        image: "/rae-assets/news/event1.svg",
      },
      {
        id: "n3",
        category: "research",
        date: "10 เม.ย. 2567",
        title: "AI Lab เผยแพร่ผลงานวิจัยใน Nature Communications",
        excerpt: "การค้นพบด้าน Deep Learning สำหรับการวิเคราะห์ยีนมะเร็งได้รับการตีพิมพ์ในวารสารชั้นนำ",
        link: "/news/nature-publication-2567",
        image: "/rae-assets/news/research1.svg",
      },
    ],
  },

  kpi: {
    title: "ผลกระทบของเรา",
    subtitle: "Our Impact",
    stats: [
      { value: 500, suffix: "+", label: "ผลงานตีพิมพ์", labelEn: "Publications" },
      { value: 150, suffix: "+", label: "โครงการวิจัย", labelEn: "Research Projects" },
      { value: 50, suffix: "+", label: "พันธมิตรอุตสาหกรรม", labelEn: "Industry Partners" },
      { value: 30, suffix: "+", label: "ความร่วมมือนานาชาติ", labelEn: "Int'l Collaborations" },
    ],
  },

  audience: {
    title: "เลือกเส้นทางของคุณ",
    subtitle: "Find your path",
    groups: [
      {
        id: "student",
        icon: "graduation-cap",
        title: "นักศึกษา",
        titleEn: "Student",
        desc: "ค้นหาโปรแกรม ทุน และทรัพยากรที่สนับสนุนการเรียนและการเติบโต",
        links: [
          { label: "สมัครเรียน", href: "/apply" },
          { label: "ทุนการศึกษา", href: "/scholarships" },
          { label: "พอร์ทัลนักศึกษา", href: "/student-portal" },
        ],
      },
      {
        id: "researcher",
        icon: "flask",
        title: "นักวิจัย",
        titleEn: "Researcher",
        desc: "เข้าถึงทุน ห้องปฏิบัติการ และเครือข่ายความร่วมมือด้านวิจัย",
        links: [
          { label: "สมัครทุนวิจัย", href: "/grants" },
          { label: "จองห้องปฏิบัติการ", href: "/lab-booking" },
          { label: "ฐานข้อมูลวิจัย", href: "/research-db" },
        ],
      },
      {
        id: "industry",
        icon: "briefcase",
        title: "พันธมิตรอุตสาหกรรม",
        titleEn: "Industry Partner",
        desc: "ร่วมสร้างนวัตกรรม ทดสอบแนวคิด และต่อยอดสู่การใช้งานจริง",
        links: [
          { label: "โอกาสความร่วมมือ", href: "/partnership" },
          { label: "ถ่ายทอดเทคโนโลยี", href: "/tech-transfer" },
          { label: "ติดต่อทีมธุรกิจ", href: "/business-contact" },
        ],
      },
      {
        id: "visitor",
        icon: "users",
        title: "ผู้ปกครองและผู้เยี่ยมชม",
        titleEn: "Parent & Visitor",
        desc: "ทำความรู้จัก RAE และค้นหาข้อมูลสำคัญสำหรับผู้เยี่ยมชม",
        links: [
          { label: "เกี่ยวกับสถาบัน", href: "/about" },
          { label: "Virtual Tour", href: "/virtual-tour" },
          { label: "ข้อมูลการเดินทาง", href: "/directions" },
        ],
      },
    ],
  },

  footer: {
    mission:
      "ขับเคลื่อนงานวิจัยและนวัตกรรมที่เชื่อมโยงความร่วมมือ สร้างผลลัพธ์เชิงประจักษ์ และส่งต่อคุณค่าแก่สังคม",
    quickLinks: {
      title: "ลิงก์ด่วน",
      links: [
        { label: "เกี่ยวกับเรา", href: "/about" },
        { label: "โปรแกรมวิจัย", href: "/research" },
        { label: "การศึกษา", href: "/education" },
        { label: "ข่าวสาร", href: "/news" },
        { label: "ติดต่อ", href: "/contact" },
      ],
    },
    resources: {
      title: "ทรัพยากรวิชาการ",
      links: [
        { label: "ห้องสมุดดิจิทัล", href: "/library" },
        { label: "ฐานข้อมูลงานวิจัย", href: "/research-db" },
        { label: "วารสารวิชาการ", href: "/journals" },
        { label: "รายงานประจำปี", href: "/annual-reports" },
      ],
    },
    contact: {
      title: "ติดต่อเรา",
      address: "123 ถนนวิจัย เขตนวัตกรรม กรุงเทพฯ 10110",
      phone: "+66 2 123 4567",
      email: "info@rae.ac.th",
      mapLink: "https://maps.google.com",
    },
    newsletter: {
      title: "ติดตามความเคลื่อนไหว",
      placeholder: "กรอกอีเมล",
      button: "สมัครรับข่าว",
    },
    copyright: "© 2567 Research Academy of Excellence. สงวนลิขสิทธิ์.",
  },
};
