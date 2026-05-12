/**
 * English content for RAE Institutional Website Template
 */
export const contentEN = {
  site: {
    name: "RAE",
    fullName: "Research Academy of Excellence",
    tagline: "Research hub for measurable innovation",
    mission:
      "Advancing research, innovation, and collaboration for measurable impact across society and industry.",
  },

  nav: {
    about: "About",
    research: "Research",
    education: "Education",
    news: "News",
    impact: "Impact",
    contact: "Contact",
    applyNow: "Apply",
    langToggle: "ภาษาไทย",
  },

  hero: {
    title: "Research Academy of Excellence",
    subtitle: "Advancing knowledge into measurable outcomes",
    description:
      "RAE connects researchers, industry partners, and society to deliver high-quality research, practical innovation, and measurable impact.",
    ctaPrimary: "Explore Research",
    ctaSecondary: "View Work and News",
    scrollHint: "Scroll down",
  },

  ticker: {
    label: "Latest:",
    items: [
      "New research grant applications are now open",
      "AI Lab team receives recognition at an international forum",
      "Seminar 'Innovation for Sustainability' is now open for registration",
      "New research database launched for researchers and students",
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
        image: "/rae-assets/research/life-sci.svg",
      },
      {
        id: "ai-data",
        tag: "AI Technology",
        tagColor: "blue",
        title: "Artificial Intelligence & Data Science",
        desc: "Applying Machine Learning and Deep Learning to solve complex societal challenges.",
        link: "/research/ai-data",
        image: "/rae-assets/research/ai-data.svg",
      },
      {
        id: "sustain",
        tag: "Sustainability",
        tagColor: "green",
        title: "Sustainable Technology & Environment",
        desc: "Clean energy innovation, resource management, and climate change solutions.",
        link: "/research/sustainability",
        image: "/rae-assets/research/sustain.svg",
      },
      {
        id: "social",
        tag: "Social Innovation",
        tagColor: "amber",
        title: "Social Innovation & Policy",
        desc: "Public policy research, creative economy, and sustainable community development.",
        link: "/research/social",
        image: "/rae-assets/research/social.svg",
      },
    ],
  },

  news: {
    title: "News & Events",
    subtitle: "Latest progress",
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
        title: "RAE Receives National Recognition for Research Innovation",
        excerpt: "The academy’s research and collaboration efforts are recognized at the national level.",
        link: "/news/award-nrct-2024",
        image: "/rae-assets/news/award1.svg",
      },
      {
        id: "n2",
        category: "event",
        date: "May 15, 2024",
        title: "International Seminar 'Future of Research' Opens for Registration",
        excerpt: "Hear from leading researchers and exchange ideas across disciplines.",
        link: "/events/intl-seminar-2024",
        image: "/rae-assets/news/event1.svg",
      },
      {
        id: "n3",
        category: "research",
        date: "Apr 10, 2024",
        title: "AI Lab Publishes Research in Nature Communications",
        excerpt: "A Deep Learning discovery for cancer gene analysis is published in a leading journal.",
        link: "/news/nature-publication-2024",
        image: "/rae-assets/news/research1.svg",
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
    title: "Find your path",
    subtitle: "Choose your path",
    groups: [
      {
        id: "student",
        icon: "graduation-cap",
        title: "Student",
        titleEn: "Student",
        desc: "Find programs, scholarships, and resources that support study and growth.",
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
        desc: "Access grants, labs, and research collaboration networks.",
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
        desc: "Co-create innovation, test ideas, and translate research into practice.",
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
        desc: "Learn about RAE and find key information for visitors.",
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
      "Advancing research and innovation through collaboration, evidence, and measurable impact for society.",
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
      title: "Stay informed",
      placeholder: "Enter email",
      button: "Subscribe",
    },
    copyright: "© 2024 Research Academy of Excellence. All rights reserved.",
  },
};
