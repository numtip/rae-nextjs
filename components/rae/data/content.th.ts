/**
 * Thai content for RAE Institutional Website Template
 */
export const contentTH = {
  site: {
    name: "RAE",
    fullName: "Research Academy of Excellence",
    tagline: "ศูนย์ความเป็นเลิศด้านการวิจัยและนวัตกรรม",
    mission:
      "มุ่งมั่นสู่ความเป็นเลิศด้านการวิจัย สร้างนวัตกรรม และพัฒนาทรัพยากรมนุษย์ระดับสากล",
  },

  nav: {
    about: "เกี่ยวกับเรา",
    research: "การวิจัย",
    education: "การศึกษา",
    news: "ข่าวสาร",
    impact: "ผลกระทบ",
    contact: "ติดต่อ",
    applyNow: "สมัครเลย",
    langToggle: "EN",
  },

  hero: {
    title: "ศูนย์ความเป็นเลิศ",
    subtitle: "ด้านการวิจัยและนวัตกรรม",
    description:
      "เราผลักดันขอบเขตของความรู้ เร่งความก้าวหน้าทางวิทยาศาสตร์ และสร้างผลกระทบที่ยั่งยืนต่อสังคม",
    ctaPrimary: "สำรวจงานวิจัย",
    ctaSecondary: "สมัครเรียน",
    scrollHint: "เลื่อนลง",
  },

  ticker: {
    label: "ประกาศล่าสุด:",
    items: [
      "เปิดรับสมัครทุนวิจัยปีการศึกษา 2567 — สมัครภายใน 30 มิ.ย. 67",
      "ขอแสดงความยินดีกับทีม AI Lab ที่ได้รับรางวัลระดับนานาชาติ",
      "สัมมนา 'นวัตกรรมเพื่อความยั่งยืน' วันที่ 15 ก.ค. 67 ออนไลน์ + ออนไซต์",
      "เปิดใช้งานฐานข้อมูลงานวิจัยใหม่ — เข้าถึงงานวิจัยกว่า 50,000 ชิ้น",
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
        image: "/images/research/life-sci.jpg",
      },
      {
        id: "ai-data",
        tag: "เทคโนโลยี AI",
        tagColor: "blue",
        title: "ปัญญาประดิษฐ์และวิทยาศาสตร์ข้อมูล",
        desc: "การประยุกต์ใช้ Machine Learning และ Deep Learning เพื่อแก้ปัญหาที่ซับซ้อนในระดับสังคม",
        link: "/research/ai-data",
        image: "/images/research/ai-data.jpg",
      },
      {
        id: "sustain",
        tag: "ความยั่งยืน",
        tagColor: "green",
        title: "เทคโนโลยีและสิ่งแวดล้อมยั่งยืน",
        desc: "นวัตกรรมพลังงานสะอาด การจัดการทรัพยากร และโซลูชันสำหรับการเปลี่ยนแปลงสภาพภูมิอากาศ",
        link: "/research/sustainability",
        image: "/images/research/sustain.jpg",
      },
      {
        id: "social",
        tag: "นวัตกรรมสังคม",
        tagColor: "amber",
        title: "นวัตกรรมสังคมและนโยบาย",
        desc: "การวิจัยด้านนโยบายสาธารณะ เศรษฐกิจสร้างสรรค์ และการพัฒนาชุมชนอย่างยั่งยืน",
        link: "/research/social",
        image: "/images/research/social.jpg",
      },
    ],
  },

  news: {
    title: "ข่าวสารและกิจกรรม",
    subtitle: "Latest News & Events",
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
        title: "RAE คว้ารางวัล 'Most Innovative Research Institute' จาก NRCT",
        excerpt: "สถาบันวิจัยแห่งความเป็นเลิศได้รับการยกย่องจากสำนักงานคณะกรรมการส่งเสริมวิทยาศาสตร์",
        link: "/news/award-nrct-2567",
        image: "/images/news/award1.jpg",
      },
      {
        id: "n2",
        category: "event",
        date: "15 พ.ค. 2567",
        title: "สัมมนาระดับนานาชาติ 'Future of Research' ครั้งที่ 5",
        excerpt: "เชิญร่วมฟังบรรยายจากนักวิจัยระดับโลกกว่า 20 คน ในงานสัมมนาสำคัญแห่งปี",
        link: "/events/intl-seminar-2567",
        image: "/images/news/event1.jpg",
      },
      {
        id: "n3",
        category: "research",
        date: "10 เม.ย. 2567",
        title: "ทีมวิจัย AI Lab ตีพิมพ์งานวิจัยใน Nature Communications",
        excerpt: "การค้นพบใหม่ด้าน Deep Learning สำหรับการวิเคราะห์ยีนมะเร็งได้รับการยอมรับระดับโลก",
        link: "/news/nature-publication-2567",
        image: "/images/news/research1.jpg",
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
    title: "ฉันคือ...",
    subtitle: "I am a...",
    groups: [
      {
        id: "student",
        icon: "graduation-cap",
        title: "นักศึกษา",
        titleEn: "Student",
        desc: "ค้นหาโปรแกรม ทุน และทรัพยากรสำหรับนักศึกษา",
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
        desc: "เข้าถึงทรัพยากรวิจัย ทุน และเครือข่ายความร่วมมือ",
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
        desc: "ร่วมสร้างนวัตกรรมและถ่ายทอดเทคโนโลยีกับสถาบันของเรา",
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
        desc: "ทำความรู้จักกับสถาบันและดูข้อมูลสำหรับผู้ปกครอง",
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
      "มุ่งมั่นสู่ความเป็นเลิศด้านการวิจัยและนวัตกรรม เพื่อสร้างผลกระทบเชิงบวกต่อสังคมและโลก",
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
      title: "รับข่าวสาร",
      placeholder: "กรอกอีเมลของคุณ",
      button: "สมัครรับข่าว",
    },
    copyright: "© 2567 Research Academy of Excellence. สงวนลิขสิทธิ์ทุกประการ.",
  },
};
