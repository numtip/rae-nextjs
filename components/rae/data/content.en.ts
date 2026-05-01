/**
 * English content for RAE Institutional Website Template
 */
export const contentEN = {
  site: {
    name: "RAE",
    fullName: "Research Academy of Excellence",
    tagline: "Research Academy of Excellence",
    mission:
      "Committed to research excellence, innovation, and developing world-class human capital.",
  },

  nav: {
    about: "About",
    research: "Research",
    education: "Education",
    news: "News",
    impact: "Impact",
    contact: "Contact",
    applyNow: "Apply Now",
    langToggle: "ภาษาไทย",
  },

  hero: {
    title: "Research Academy",
    subtitle: "of Excellence",
    description:
      "We push the boundaries of knowledge, accelerate scientific progress, and create lasting impact for society.",
    ctaPrimary: "Explore Research",
    ctaSecondary: "Apply Now",
    scrollHint: "Scroll down",
  },

  ticker: {
    label: "Latest:",
    items: [
      "Research Grant Applications Open for 2024 — Deadline June 30",
      "Congratulations to AI Lab Team for winning International Award",
      "Seminar 'Innovation for Sustainability' — July 15, Online + Onsite",
      "New Research Database launched — Access 50,000+ research papers",
    ],
  },

  services: {
    title: "Our Services",
    subtitle: "Access the resources and services you need",
    items: [
      { id: "research", icon: "flask", label: "Research Portal", desc: "Research Database" },
      { id: "library", icon: "book-open", label: "E-Library", desc: "Digital Library" },
      { id: "grants", icon: "dollar-sign", label: "Grant Applications", desc: "Apply for Funding" },
      { id: "calendar", icon: "calendar", label: "Academic Calendar", desc: "Important Dates" },
      { id: "student", icon: "user-graduate", label: "Student Portal", desc: "Student Resources" },
      { id: "lab", icon: "microscope", label: "Lab Booking", desc: "Reserve Lab Space" },
      { id: "publication", icon: "file-text", label: "Publications DB", desc: "Published Works" },
      { id: "network", icon: "globe", label: "Collab Network", desc: "Partner Network" },
    ],
  },

  research: {
    title: "Areas of Excellence",
    subtitle: "ความเป็นเลิศด้านการวิจัย",
    viewAll: "View All",
    areas: [
      {
        id: "life-sci",
        tag: "Biomedical",
        tagColor: "teal",
        title: "Life Sciences & Biomedical Research",
        desc: "Genomics, genetics, and drug discovery research to improve human health outcomes globally.",
        link: "/research/life-sciences",
        image: "/images/research/life-sci.jpg",
      },
      {
        id: "ai-data",
        tag: "AI Technology",
        tagColor: "blue",
        title: "Artificial Intelligence & Data Science",
        desc: "Applying Machine Learning and Deep Learning to solve complex societal challenges.",
        link: "/research/ai-data",
        image: "/images/research/ai-data.jpg",
      },
      {
        id: "sustain",
        tag: "Sustainability",
        tagColor: "green",
        title: "Sustainable Technology & Environment",
        desc: "Clean energy innovation, resource management, and climate change solutions.",
        link: "/research/sustainability",
        image: "/images/research/sustain.jpg",
      },
      {
        id: "social",
        tag: "Social Innovation",
        tagColor: "amber",
        title: "Social Innovation & Policy",
        desc: "Public policy research, creative economy, and sustainable community development.",
        link: "/research/social",
        image: "/images/research/social.jpg",
      },
    ],
  },

  news: {
    title: "News & Events",
    subtitle: "ข่าวสารและกิจกรรม",
    viewAll: "View All News",
    categories: {
      research: "Research",
      event: "Event",
      award: "Award",
      announcement: "Announcement",
    },
    items: [
      {
        id: "n1",
        category: "award",
        date: "Apr 28, 2024",
        title: "RAE Wins 'Most Innovative Research Institute' from NRCT",
        excerpt: "The Research Academy of Excellence is recognized by the National Research Council of Thailand.",
        link: "/news/award-nrct-2024",
        image: "/images/news/award1.jpg",
      },
      {
        id: "n2",
        category: "event",
        date: "May 15, 2024",
        title: "International Seminar 'Future of Research' — 5th Edition",
        excerpt: "Join 20+ world-class researchers for the most important academic seminar of the year.",
        link: "/events/intl-seminar-2024",
        image: "/images/news/event1.jpg",
      },
      {
        id: "n3",
        category: "research",
        date: "Apr 10, 2024",
        title: "AI Lab Team Publishes Breakthrough in Nature Communications",
        excerpt: "Novel Deep Learning discovery for cancer gene analysis receives worldwide recognition.",
        link: "/news/nature-publication-2024",
        image: "/images/news/research1.jpg",
      },
    ],
  },

  kpi: {
    title: "Our Impact",
    subtitle: "ผลกระทบของเรา",
    stats: [
      { value: 500, suffix: "+", label: "Publications", labelEn: "Publications" },
      { value: 150, suffix: "+", label: "Research Projects", labelEn: "Research Projects" },
      { value: 50, suffix: "+", label: "Industry Partners", labelEn: "Industry Partners" },
      { value: 30, suffix: "+", label: "Int'l Collaborations", labelEn: "Int'l Collaborations" },
    ],
  },

  audience: {
    title: "I am a...",
    subtitle: "ฉันคือ...",
    groups: [
      {
        id: "student",
        icon: "graduation-cap",
        title: "Student",
        titleEn: "Student",
        desc: "Find programs, scholarships, and resources for students.",
        links: [
          { label: "Apply Now", href: "/apply" },
          { label: "Scholarships", href: "/scholarships" },
          { label: "Student Portal", href: "/student-portal" },
        ],
      },
      {
        id: "researcher",
        icon: "flask",
        title: "Researcher",
        titleEn: "Researcher",
        desc: "Access research resources, funding, and collaboration networks.",
        links: [
          { label: "Apply for Grants", href: "/grants" },
          { label: "Book a Lab", href: "/lab-booking" },
          { label: "Research Database", href: "/research-db" },
        ],
      },
      {
        id: "industry",
        icon: "briefcase",
        title: "Industry Partner",
        titleEn: "Industry Partner",
        desc: "Co-create innovation and transfer technology with our institute.",
        links: [
          { label: "Partnership Opportunities", href: "/partnership" },
          { label: "Technology Transfer", href: "/tech-transfer" },
          { label: "Contact Business Team", href: "/business-contact" },
        ],
      },
      {
        id: "visitor",
        icon: "users",
        title: "Parent & Visitor",
        titleEn: "Parent & Visitor",
        desc: "Get to know our institute and find information for parents.",
        links: [
          { label: "About RAE", href: "/about" },
          { label: "Virtual Tour", href: "/virtual-tour" },
          { label: "Directions", href: "/directions" },
        ],
      },
    ],
  },

  footer: {
    mission:
      "Committed to research excellence and innovation, creating positive impact for society and the world.",
    quickLinks: {
      title: "Quick Links",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Research Programs", href: "/research" },
        { label: "Education", href: "/education" },
        { label: "News", href: "/news" },
        { label: "Contact", href: "/contact" },
      ],
    },
    resources: {
      title: "Academic Resources",
      links: [
        { label: "Digital Library", href: "/library" },
        { label: "Research Database", href: "/research-db" },
        { label: "Academic Journals", href: "/journals" },
        { label: "Annual Reports", href: "/annual-reports" },
      ],
    },
    contact: {
      title: "Contact Us",
      address: "123 Research Road, Innovation District, Bangkok 10110",
      phone: "+66 2 123 4567",
      email: "info@rae.ac.th",
      mapLink: "https://maps.google.com",
    },
    newsletter: {
      title: "Stay Updated",
      placeholder: "Enter your email",
      button: "Subscribe",
    },
    copyright: "© 2024 Research Academy of Excellence. All rights reserved.",
  },
};
