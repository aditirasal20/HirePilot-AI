import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PASSWORD = "Password@123";

const hoursFromNow = (hours) => new Date(Date.now() + hours * 3600 * 1000);
const daysFromNow = (days) => hoursFromNow(days * 24);

const avatarUrl = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

const resumePdfUrl = (slug) =>
  `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf?seed=${slug}`;

const companiesData = [
  {
    name: "Google India",
    website: "https://careers.google.com",
    logo: "https://www.google.com/favicon.ico",
    location: "Bengaluru, Karnataka, India",
    industry: "Technology & Internet",
    description:
      "Google India is a global technology leader focused on search, cloud computing, AI/ML, and mobile products. Its Bengaluru and Hyderabad engineering centers drive products used by billions of people across the globe, including Search, Maps, Workspace, and Cloud.",
    companySize: 100000,
    isVerified: true,
  },
  {
    name: "BrowserStack",
    website: "https://www.browserstack.com",
    logo: "https://www.browserstack.com/favicon.ico",
    location: "Mumbai, Maharashtra, India",
    industry: "Developer Tools / Software Testing",
    description:
      "BrowserStack is the world's leading software testing platform, helping developers test on 3,000+ real devices and browsers. Trusted by more than 50,000 customers including Fortune 500 companies, the platform powers reliable, high-quality web and mobile experiences.",
    companySize: 1000,
    isVerified: true,
  },
  {
    name: "Razorpay",
    website: "https://razorpay.com",
    logo: "https://razorpay.com/favicon.ico",
    location: "Bengaluru, Karnataka, India",
    industry: "Fintech / Financial Services",
    description:
      "Razorpay is a full-stack financial services company that helps Indian businesses accept, process, and disburse payments. With payment gateway, recurring billing, corporate credit cards, and lending products, Razorpay is the preferred payments partner for over 2 million businesses.",
    companySize: 2500,
    isVerified: true,
  },
];

const recruitersData = [
  {
    key: "rahul",
    fullName: "Rahul Sharma",
    email: "rahul@google-test.com",
    designation: "Senior Technical Recruiter",
    company: "Google India",
  },
  {
    key: "priya",
    fullName: "Priya Mehta",
    email: "priya@browserstack-test.com",
    designation: "Talent Acquisition Lead",
    company: "BrowserStack",
  },
  {
    key: "arjun",
    fullName: "Arjun Patel",
    email: "arjun@razorpay-test.com",
    designation: "Engineering Recruiter",
    company: "Razorpay",
  },
];

const jobsData = [
  {
    key: "backend-google",
    title: "Backend Developer",
    company: "Google India",
    recruiter: "rahul",
    location: "Bengaluru, India",
    salaryMin: 2500000,
    salaryMax: 4500000,
    yearsOfExperience: 3,
    employmentType: "FULL_TIME",
    requiredSkills: ["Go", "Java", "Node.js", "Distributed Systems", "SQL", "Redis", "Kafka"],
    description:
      "We are looking for a Backend Developer to build highly scalable, low-latency services that power Google's core products. You will design robust APIs, optimize database performance, and collaborate with cross-functional teams across search and cloud. Strong fundamentals in distributed systems, caching, and event-driven architecture are essential.",
  },
  {
    key: "frontend-google",
    title: "Frontend Developer",
    company: "Google India",
    recruiter: "rahul",
    location: "Hyderabad, India",
    salaryMin: 1800000,
    salaryMax: 3200000,
    yearsOfExperience: 2,
    employmentType: "FULL_TIME",
    requiredSkills: ["React", "TypeScript", "Next.js", "CSS", "Web Performance"],
    description:
      "Join the frontend team crafting delightful, accessible, and fast user experiences for Google products. You will own UI components, drive web performance initiatives, and raise the bar for quality with rigorous testing and code reviews. Experience with React, TypeScript, and modern build tooling is required.",
  },
  {
    key: "sde1-google",
    title: "SDE-1",
    company: "Google India",
    recruiter: "rahul",
    location: "Bengaluru, India",
    salaryMin: 2000000,
    salaryMax: 3200000,
    yearsOfExperience: 1,
    employmentType: "FULL_TIME",
    requiredSkills: ["Data Structures", "Algorithms", "Java", "SQL", "System Design"],
    description:
      "Kick-start your engineering career at Google as an SDE-1. You will work on production-grade systems, write clean and well-tested code, and grow under the mentorship of senior engineers. A strong grasp of data structures, algorithms, and problem solving is what we care about most.",
  },
  {
    key: "fullstack-google",
    title: "Full Stack Engineer",
    company: "Google India",
    recruiter: "rahul",
    location: "Remote, India",
    salaryMin: 3000000,
    salaryMax: 5000000,
    yearsOfExperience: 4,
    employmentType: "CONTRACT",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "AWS", "TypeScript", "Docker"],
    description:
      "We are hiring a Full Stack Engineer on a contract basis to build internal tools that improve engineering productivity at Google. You will work across the stack - from React frontends to Node.js services and PostgreSQL-backed data layers. Experience deploying on AWS with containerized workloads is a big plus.",
  },
  {
    key: "node-browserstack",
    title: "Node.js Developer",
    company: "BrowserStack",
    recruiter: "priya",
    location: "Mumbai, India",
    salaryMin: 2000000,
    salaryMax: 3500000,
    yearsOfExperience: 2,
    employmentType: "FULL_TIME",
    requiredSkills: ["Node.js", "Express", "Redis", "MongoDB", "Docker", "REST APIs"],
    description:
      "Build the backend services that power real-device and browser testing at scale. As a Node.js Developer at BrowserStack, you will design high-throughput APIs, manage queues and caching layers, and ensure low-latency test execution for developers worldwide.",
  },
  {
    key: "react-browserstack",
    title: "React Developer",
    company: "BrowserStack",
    recruiter: "priya",
    location: "Mumbai, India",
    salaryMin: 1500000,
    salaryMax: 2500000,
    yearsOfExperience: 1,
    employmentType: "FULL_TIME",
    requiredSkills: ["React", "Redux", "TypeScript", "Tailwind CSS", "JavaScript"],
    description:
      "Join BrowserStack's web team to build intuitive dashboards that help developers visualize and debug their test runs. You will ship pixel-perfect React features, integrate with REST APIs, and contribute to our design system. Deep understanding of React state management is essential.",
  },
  {
    key: "intern-browserstack",
    title: "Software Engineer",
    company: "BrowserStack",
    recruiter: "priya",
    location: "Mumbai, India",
    salaryMin: 400000,
    salaryMax: 800000,
    yearsOfExperience: 0,
    employmentType: "INTERNSHIP",
    requiredSkills: ["JavaScript", "Data Structures", "Problem Solving", "HTML", "CSS"],
    description:
      "A 6-month internship for motivated engineers to work alongside senior developers at BrowserStack. You will contribute to real features, participate in code reviews, and gain hands-on exposure to a product used by millions. Pre-final year students and fresh graduates are welcome to apply.",
  },
  {
    key: "fullstack-razorpay",
    title: "Full Stack Engineer",
    company: "Razorpay",
    recruiter: "arjun",
    location: "Bengaluru, India",
    salaryMin: 3000000,
    salaryMax: 5000000,
    yearsOfExperience: 3,
    employmentType: "FULL_TIME",
    requiredSkills: ["React", "Node.js", "Microservices", "PostgreSQL", "AWS", "TypeScript"],
    description:
      "Build the merchant-facing platform that enables over 2 million businesses to accept payments. As a Full Stack Engineer at Razorpay, you will design and ship features across our dashboard and APIs, working with microservices, event-driven architecture, and high-scale databases.",
  },
  {
    key: "backend-razorpay",
    title: "Backend Developer",
    company: "Razorpay",
    recruiter: "arjun",
    location: "Pune, India",
    salaryMin: 2500000,
    salaryMax: 4500000,
    yearsOfExperience: 3,
    employmentType: "FULL_TIME",
    requiredSkills: ["Java", "Kotlin", "Spring Boot", "Kafka", "PostgreSQL", "Payments"],
    description:
      "Join Razorpay's payments platform team to build reliable, secure, and highly available payment processing systems. You will work on Java/Kotlin microservices, streaming pipelines with Kafka, and integrations with banks and payment networks. Experience in the fintech domain is preferred.",
  },
  {
    key: "frontend-razorpay",
    title: "Frontend Developer",
    company: "Razorpay",
    recruiter: "arjun",
    location: "Remote, India",
    salaryMin: 1200000,
    salaryMax: 2000000,
    yearsOfExperience: 2,
    employmentType: "PART_TIME",
    requiredSkills: ["React", "TypeScript", "Accessibility", "Testing", "JavaScript"],
    description:
      "Part-time Frontend Developer role focused on making Razorpay's dashboards accessible and delightful. You will build accessible React components, improve performance, and write comprehensive tests. A strong eye for detail and experience with WCAG accessibility guidelines are required.",
  },
];

const candidatesData = [
  {
    key: "aditya",
    fullName: "Aditya Test",
    email: "aditya.test@hirepilot.ai",
    phone: "+91 98765 43210",
    bio: "Frontend developer with 3+ years of experience building fast, accessible web applications. Passionate about component design, web performance, and clean, maintainable code.",
    location: "Bengaluru, India",
    yearsOfExperience: 3,
    currentPosition: "Frontend Developer",
    expectedSalary: 1800000,
    githubUrl: "https://github.com/adityatest",
    linkedinUrl: "https://linkedin.com/in/adityatest",
    portfolioUrl: "https://adityatest.dev",
    resume: {
      slug: "aditya-test-resume",
      title: "Aditya Test - Frontend Developer",
      originalFileName: "Aditya_Test_Resume.pdf",
      aiScore: 84.5,
      extractedSkills: ["React", "TypeScript", "JavaScript", "Redux", "Tailwind CSS", "Next.js", "REST APIs"],
      summary:
        "Frontend developer with 3+ years of experience crafting responsive, accessible interfaces for SaaS products. Proficient in React, TypeScript, and modern styling approaches, with a track record of improving page load times by 40% through code-splitting and asset optimization.",
      strengths: [
        "Strong React and TypeScript proficiency",
        "Deep understanding of web performance optimization",
        "Clean, reusable component architecture",
        "Excellent cross-browser and accessibility practices",
      ],
      weaknesses: [
        "Limited exposure to backend systems and APIs",
        "Documentation of design decisions could be more thorough",
      ],
      missingSkills: ["Node.js", "GraphQL", "Docker"],
      recommendedSkills: ["Node.js", "GraphQL", "Docker", "PostgreSQL"],
      experienceLevel: "Mid-Level",
      atsCompatibility: 82.0,
      grammarScore: 91.0,
      formatScore: 88.0,
      keywordScore: 80.0,
      jobReadinessScore: 78.0,
      careerLevel: "Mid-Level Frontend Developer",
      industryFit: "Web Development",
      parsedText:
        "Aditya Test\nFrontend Developer | Bengaluru, India | +91 98765 43210\nExperienced frontend developer with 3 years building React and TypeScript applications. Skills: React, TypeScript, JavaScript, Redux, Tailwind CSS, Next.js, REST APIs. Experience at TechNova and FlipKartLabs building dashboards and e-commerce storefronts.",
    },
  },
  {
    key: "rohan",
    fullName: "Rohan Sharma",
    email: "rohan.sharma@hirepilot.ai",
    phone: "+91 98123 45678",
    bio: "Backend engineer with 5+ years of experience designing distributed systems and high-throughput APIs. Enjoy working with Node.js, PostgreSQL, and cloud infrastructure.",
    location: "Gurugram, India",
    yearsOfExperience: 5,
    currentPosition: "Backend Engineer",
    expectedSalary: 2800000,
    githubUrl: "https://github.com/rohansharma",
    linkedinUrl: "https://linkedin.com/in/rohansharma",
    portfolioUrl: "https://rohansharma.dev",
    resume: {
      slug: "rohan-sharma-resume",
      title: "Rohan Sharma - Backend Engineer",
      originalFileName: "Rohan_Sharma_Resume.pdf",
      aiScore: 87.0,
      extractedSkills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "Kafka"],
      summary:
        "Backend engineer with 5+ years of experience architecting scalable microservices and REST APIs. Proven ability to design database schemas, optimize query performance, and build event-driven pipelines serving millions of requests per day.",
      strengths: [
        "Strong Node.js and API design skills",
        "Experience designing scalable microservices",
        "Solid grasp of database indexing and query optimization",
        "Comfortable with AWS and containerized deployments",
      ],
      weaknesses: [
        "Limited frontend exposure",
        "Occasionally over-engineers solutions for simple problems",
      ],
      missingSkills: ["TypeScript", "GraphQL", "Kubernetes"],
      recommendedSkills: ["TypeScript", "GraphQL", "Kubernetes", "Go"],
      experienceLevel: "Senior",
      atsCompatibility: 85.0,
      grammarScore: 88.0,
      formatScore: 90.0,
      keywordScore: 84.0,
      jobReadinessScore: 86.0,
      careerLevel: "Senior Backend Engineer",
      industryFit: "Backend Engineering",
      parsedText:
        "Rohan Sharma\nBackend Engineer | Gurugram, India | +91 98123 45678\n5 years building distributed systems with Node.js, PostgreSQL, Redis, and Kafka. Experience at Zomato and Swiggy optimizing payment and order pipelines. Skills: Node.js, Express, PostgreSQL, MongoDB, Redis, Docker, AWS, Kafka.",
    },
  },
  {
    key: "neha",
    fullName: "Neha Verma",
    email: "neha.verma@hirepilot.ai",
    phone: "+91 97654 32109",
    bio: "Full stack developer with 4+ years of experience shipping end-to-end features across the web. Comfortable moving between React frontends and Node.js backend services.",
    location: "Pune, India",
    yearsOfExperience: 4,
    currentPosition: "Full Stack Developer",
    expectedSalary: 2200000,
    githubUrl: "https://github.com/nehaverma",
    linkedinUrl: "https://linkedin.com/in/nehaverma",
    portfolioUrl: "https://nehaverma.dev",
    resume: {
      slug: "neha-verma-resume",
      title: "Neha Verma - Full Stack Developer",
      originalFileName: "Neha_Verma_Resume.pdf",
      aiScore: 89.2,
      extractedSkills: ["React", "Node.js", "Express", "MongoDB", "PostgreSQL", "TypeScript", "AWS", "Docker"],
      summary:
        "Full stack developer with 4+ years of experience building products from database to UI. Delivered multiple greenfield features end-to-end, improved API response times, and mentored junior developers in a fast-paced startup environment.",
      strengths: [
        "Full stack proficiency across the entire product stack",
        "Excellent API design and schema modeling skills",
        "Strong communication and stakeholder collaboration",
        "Experience with CI/CD and containerized deployments",
      ],
      weaknesses: [
        "Less exposure to low-level systems programming",
        "Can spend too long polishing edge cases",
      ],
      missingSkills: ["Kafka", "GraphQL", "Kubernetes"],
      recommendedSkills: ["Kafka", "GraphQL", "Kubernetes", "Redis"],
      experienceLevel: "Senior",
      atsCompatibility: 90.0,
      grammarScore: 93.0,
      formatScore: 89.0,
      keywordScore: 86.0,
      jobReadinessScore: 88.0,
      careerLevel: "Senior Full Stack Developer",
      industryFit: "Full Stack Engineering",
      parsedText:
        "Neha Verma\nFull Stack Developer | Pune, India | +91 97654 32109\n4+ years building web products with React, Node.js, and PostgreSQL. Experience at Infosys and a fintech startup shipping payments dashboards. Skills: React, Node.js, Express, MongoDB, PostgreSQL, TypeScript, AWS, Docker.",
    },
  },
  {
    key: "sneha",
    fullName: "Sneha Gupta",
    email: "sneha.gupta@hirepilot.ai",
    phone: "+91 96543 21098",
    bio: "React developer with 2 years of experience building responsive and accessible user interfaces. Eager to grow into a full stack role and contribute to product-driven teams.",
    location: "Hyderabad, India",
    yearsOfExperience: 2,
    currentPosition: "React Developer",
    expectedSalary: 1200000,
    githubUrl: "https://github.com/snehagupta",
    linkedinUrl: "https://linkedin.com/in/snehagupta",
    portfolioUrl: "https://snehagupta.dev",
    resume: {
      slug: "sneha-gupta-resume",
      title: "Sneha Gupta - React Developer",
      originalFileName: "Sneha_Gupta_Resume.pdf",
      aiScore: 76.8,
      extractedSkills: ["React", "JavaScript", "HTML", "CSS", "Redux", "Tailwind CSS"],
      summary:
        "React developer with 2 years of experience creating polished, responsive interfaces for web applications. Focused on reusable component design, semantic HTML, and translating design mockups into pixel-perfect UI.",
      strengths: [
        "Clean, semantic HTML and modern CSS",
        "Solid React and state management fundamentals",
        "Strong eye for design fidelity and detail",
      ],
      weaknesses: [
        "Limited backend and API integration experience",
        "Resume lacks quantified impact metrics",
        "Less exposure to testing frameworks",
      ],
      missingSkills: ["TypeScript", "Next.js", "Jest"],
      recommendedSkills: ["TypeScript", "Next.js", "Jest", "Node.js"],
      experienceLevel: "Mid-Level",
      atsCompatibility: 74.0,
      grammarScore: 85.0,
      formatScore: 79.0,
      keywordScore: 71.0,
      jobReadinessScore: 68.0,
      careerLevel: "Mid-Level Frontend Developer",
      industryFit: "Web Development",
      parsedText:
        "Sneha Gupta\nReact Developer | Hyderabad, India | +91 96543 21098\n2 years of experience building React interfaces with Redux and Tailwind CSS. Experience at a SaaS startup building marketing sites and admin dashboards. Skills: React, JavaScript, HTML, CSS, Redux, Tailwind CSS.",
    },
  },
  {
    key: "aman",
    fullName: "Aman Singh",
    email: "aman.singh@hirepilot.ai",
    phone: "+91 95432 10987",
    bio: "Node.js developer with 3+ years of experience building REST APIs, background jobs, and real-time services. Enjoy performance tuning and working with Redis-backed caching layers.",
    location: "Noida, India",
    yearsOfExperience: 3,
    currentPosition: "Node.js Developer",
    expectedSalary: 1600000,
    githubUrl: "https://github.com/amansingh",
    linkedinUrl: "https://linkedin.com/in/amansingh",
    portfolioUrl: "https://amansingh.dev",
    resume: {
      slug: "aman-singh-resume",
      title: "Aman Singh - Node.js Developer",
      originalFileName: "Aman_Singh_Resume.pdf",
      aiScore: 82.1,
      extractedSkills: ["Node.js", "Express", "JavaScript", "MongoDB", "Redis", "REST APIs"],
      summary:
        "Node.js developer with 3+ years of experience building backend services for high-traffic consumer applications. Strong in REST API design, caching strategies, and real-time communication with WebSockets.",
      strengths: [
        "Proficient in Node.js and Express application development",
        "Good experience with Redis caching and queue workers",
        "Solid understanding of REST API best practices",
      ],
      weaknesses: [
        "Limited experience with SQL databases",
        "Testing coverage could be more comprehensive",
      ],
      missingSkills: ["TypeScript", "PostgreSQL", "Docker"],
      recommendedSkills: ["TypeScript", "PostgreSQL", "Docker", "AWS"],
      experienceLevel: "Mid-Level",
      atsCompatibility: 80.0,
      grammarScore: 87.0,
      formatScore: 84.0,
      keywordScore: 78.0,
      jobReadinessScore: 75.0,
      careerLevel: "Mid-Level Backend Developer",
      industryFit: "Backend Engineering",
      parsedText:
        "Aman Singh\nNode.js Developer | Noida, India | +91 95432 10987\n3+ years building backend services with Node.js, Express, MongoDB, and Redis. Experience at Paytm building notification and messaging services. Skills: Node.js, Express, JavaScript, MongoDB, Redis, REST APIs.",
    },
  },
  {
    key: "karan",
    fullName: "Karan Patel",
    email: "karan.patel@hirepilot.ai",
    phone: "+91 94321 09876",
    bio: "Software engineer with 6+ years of experience across backend services and full stack products. Strong in system design, Java and Node.js ecosystems, and mentoring engineering teams.",
    location: "Mumbai, India",
    yearsOfExperience: 6,
    currentPosition: "Software Engineer",
    expectedSalary: 3200000,
    githubUrl: "https://github.com/karanpatel",
    linkedinUrl: "https://linkedin.com/in/karanpatel",
    portfolioUrl: "https://karanpatel.dev",
    resume: {
      slug: "karan-patel-resume",
      title: "Karan Patel - Software Engineer",
      originalFileName: "Karan_Patel_Resume.pdf",
      aiScore: 91.4,
      extractedSkills: ["Java", "Spring Boot", "Node.js", "React", "PostgreSQL", "Kafka", "AWS", "System Design"],
      summary:
        "Software engineer with 6+ years of experience designing and building resilient backend platforms and full stack products. Led the migration of a monolithic payments service into event-driven microservices, cutting p99 latency by 45%.",
      strengths: [
        "Strong system design and architecture skills",
        "Proficient across Java and Node.js ecosystems",
        "Experience leading technical migrations and mentoring juniors",
        "Deep knowledge of Kafka and event-driven architecture",
      ],
      weaknesses: [
        "Occasionally takes on too much scope",
        "Less hands-on with mobile development",
      ],
      missingSkills: ["Kubernetes", "Terraform", "Go"],
      recommendedSkills: ["Kubernetes", "Terraform", "Go", "GraphQL"],
      experienceLevel: "Senior",
      atsCompatibility: 92.0,
      grammarScore: 90.0,
      formatScore: 93.0,
      keywordScore: 89.0,
      jobReadinessScore: 91.0,
      careerLevel: "Senior Software Engineer",
      industryFit: "Backend Engineering",
      parsedText:
        "Karan Patel\nSoftware Engineer | Mumbai, India | +91 94321 09876\n6+ years building scalable backend platforms with Java, Spring Boot, Node.js, and Kafka. Experience at Flipkart leading payments platform engineering. Skills: Java, Spring Boot, Node.js, React, PostgreSQL, Kafka, AWS, System Design.",
    },
  },
];

const applicationsData = [
  { candidate: "aditya", job: "react-browserstack", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 288, recruiterNotes: "Strong React fundamentals. Shortlisted for technical round." },
  { candidate: "aditya", job: "frontend-google", status: "SHORTLISTED", appliedHoursAgo: 216, recruiterNotes: "Impressive portfolio. Moving to interview stage." },
  { candidate: "aditya", job: "frontend-razorpay", status: "REVIEWING", appliedHoursAgo: 48, recruiterNotes: null },
  { candidate: "rohan", job: "backend-google", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 192, recruiterNotes: "Excellent distributed systems background." },
  { candidate: "rohan", job: "backend-razorpay", status: "SHORTLISTED", appliedHoursAgo: 120, recruiterNotes: "Great fit for payments platform team." },
  { candidate: "rohan", job: "node-browserstack", status: "APPLIED", appliedHoursAgo: 3, recruiterNotes: null },
  { candidate: "neha", job: "fullstack-razorpay", status: "HIRED", appliedHoursAgo: 480, recruiterNotes: "Joined as Full Stack Engineer II." },
  { candidate: "neha", job: "fullstack-google", status: "REJECTED", appliedHoursAgo: 360, recruiterNotes: "Solid candidate but team moved forward with others." },
  { candidate: "neha", job: "node-browserstack", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 96, recruiterNotes: "Great communication, scheduling screening call." },
  { candidate: "sneha", job: "react-browserstack", status: "APPLIED", appliedHoursAgo: 1, recruiterNotes: null },
  { candidate: "sneha", job: "frontend-google", status: "REVIEWING", appliedHoursAgo: 144, recruiterNotes: "Portfolio under review by hiring team." },
  { candidate: "sneha", job: "frontend-razorpay", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 72, recruiterNotes: "Shortlisted for frontend coding assessment." },
  { candidate: "aman", job: "node-browserstack", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 168, recruiterNotes: "Strong Node.js experience, moving to onsite." },
  { candidate: "aman", job: "backend-google", status: "APPLIED", appliedHoursAgo: 48, recruiterNotes: null },
  { candidate: "aman", job: "backend-razorpay", status: "REVIEWING", appliedHoursAgo: 144, recruiterNotes: "Resume shared with engineering team." },
  { candidate: "karan", job: "sde1-google", status: "INTERVIEW_SCHEDULED", appliedHoursAgo: 240, recruiterNotes: "Senior profile, scheduling interview loop." },
  { candidate: "karan", job: "intern-browserstack", status: "REJECTED", appliedHoursAgo: 336, recruiterNotes: "Role is entry-level; candidate is overqualified." },
  { candidate: "karan", job: "fullstack-razorpay", status: "HIRED", appliedHoursAgo: 432, recruiterNotes: "Accepted offer as Senior Full Stack Engineer." },
];

const interviewsData = [
  {
    candidate: "aditya",
    job: "react-browserstack",
    interviewType: "ONLINE",
    scheduledHoursFromNow: 120,
    durationMinutes: 45,
    timezone: "Asia/Kolkata",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    notes: "Technical round covering React internals and component design.",
    status: "SCHEDULED",
  },
  {
    candidate: "rohan",
    job: "backend-google",
    interviewType: "ONSITE",
    scheduledHoursFromNow: 168,
    durationMinutes: 60,
    timezone: "Asia/Kolkata",
    meetingLink: null,
    notes: "Onsite loop at Bengaluru office: DSA, system design, and behavioral rounds.",
    status: "SCHEDULED",
  },
  {
    candidate: "neha",
    job: "node-browserstack",
    interviewType: "PHONE",
    scheduledHoursFromNow: 72,
    durationMinutes: 30,
    timezone: "Asia/Kolkata",
    meetingLink: null,
    notes: "Initial phone screening with the hiring manager.",
    status: "SCHEDULED",
  },
  {
    candidate: "sneha",
    job: "frontend-razorpay",
    interviewType: "ONLINE",
    scheduledHoursFromNow: 144,
    durationMinutes: 45,
    timezone: "Asia/Kolkata",
    meetingLink: "https://meet.google.com/klm-nopq-rst",
    notes: "Frontend coding assessment - build an accessible component.",
    status: "SCHEDULED",
  },
  {
    candidate: "aman",
    job: "node-browserstack",
    interviewType: "ONSITE",
    scheduledHoursFromNow: 240,
    durationMinutes: 60,
    timezone: "Asia/Kolkata",
    meetingLink: null,
    notes: "Technical and culture-fit round at the Mumbai office.",
    status: "SCHEDULED",
  },
  {
    candidate: "karan",
    job: "sde1-google",
    interviewType: "ONLINE",
    scheduledHoursFromNow: 192,
    durationMinutes: 60,
    timezone: "Asia/Kolkata",
    meetingLink: "https://meet.google.com/uvw-xyza-bcd",
    notes: "Google interview loop - coding and system design.",
    status: "SCHEDULED",
  },
  {
    candidate: "karan",
    job: "fullstack-razorpay",
    interviewType: "ONLINE",
    scheduledHoursFromNow: -240,
    durationMinutes: 60,
    timezone: "Asia/Kolkata",
    meetingLink: "https://meet.google.com/efg-hijk-lmn",
    notes: "System design and code review round.",
    status: "COMPLETED",
    feedback: "Strong problem solving and system design skills. Recommended for hire.",
    score: 8.9,
  },
  {
    candidate: "neha",
    job: "fullstack-razorpay",
    interviewType: "ONLINE",
    scheduledHoursFromNow: -288,
    durationMinutes: 45,
    timezone: "Asia/Kolkata",
    meetingLink: "https://meet.google.com/opq-rstu-vwx",
    notes: "Full stack technical interview covering React and Node.js.",
    status: "COMPLETED",
    feedback: "Excellent full stack fundamentals and communication. Offer extended.",
    score: 8.6,
  },
];

const jobMatchesData = [
  { candidate: "aditya", job: "fullstack-google", overallScore: 82.0, recommendation: "HIGH" },
  { candidate: "aditya", job: "node-browserstack", overallScore: 71.0, recommendation: "MEDIUM" },
  { candidate: "rohan", job: "fullstack-razorpay", overallScore: 84.0, recommendation: "HIGH" },
  { candidate: "rohan", job: "fullstack-google", overallScore: 76.0, recommendation: "MEDIUM" },
  { candidate: "neha", job: "backend-google", overallScore: 87.0, recommendation: "HIGH" },
  { candidate: "neha", job: "react-browserstack", overallScore: 80.0, recommendation: "HIGH" },
  { candidate: "sneha", job: "backend-google", overallScore: 85.0, recommendation: "HIGH" },
  { candidate: "sneha", job: "fullstack-google", overallScore: 68.0, recommendation: "MEDIUM" },
  { candidate: "aman", job: "sde1-google", overallScore: 86.0, recommendation: "HIGH" },
  { candidate: "aman", job: "frontend-google", overallScore: 70.0, recommendation: "MEDIUM" },
  { candidate: "karan", job: "backend-google", overallScore: 89.0, recommendation: "HIGH" },
  { candidate: "karan", job: "backend-razorpay", overallScore: 82.0, recommendation: "HIGH" },
];

const matchSummary = (candidateName, jobTitle, score) =>
  `${candidateName}'s profile aligns well with the requirements for ${jobTitle}. The candidate matches ${score}% of the core requirements, with particularly strong coverage of the primary technical stack. Recommended if the remaining gaps can be addressed through onboarding.`;

const coverLetter = (candidateName, jobTitle, companyName, skills) =>
  `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${jobTitle} role at ${companyName}. With hands-on experience in ${skills.join(", ")}, I believe I can make an immediate impact on your team.\n\nThroughout my career I have focused on delivering high-quality, production-ready work while collaborating closely with designers, product managers, and fellow engineers. I am excited about the opportunity to bring my skills to ${companyName} and grow alongside a team that values craftsmanship and ownership.\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to ${companyName}.\n\nBest regards,\n${candidateName}`;

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    throw new Error(
      `Database already contains ${existingUsers} users. Run "prisma migrate reset --force" to reset and reseed.`
    );
  }

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  console.log("Seeding HirePilot AI database...");

  // ---------- Companies ----------
  const companies = {};
  for (const data of companiesData) {
    companies[data.name] = await prisma.company.create({ data });
  }
  console.log(`Created ${companiesData.length} companies`);

  // ---------- Recruiters ----------
  const recruiters = {};
  for (const data of recruitersData) {
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: "RECRUITER",
        isEmailVerified: true,
        avatar: avatarUrl(data.fullName),
      },
    });
    const profile = await prisma.recruiterProfile.create({
      data: {
        userId: user.id,
        designation: data.designation,
        isVerified: true,
        companyId: companies[data.company].id,
      },
    });
    recruiters[data.key] = { user, profile };
  }
  console.log(`Created ${recruitersData.length} recruiters`);

  // ---------- Jobs ----------
  const jobs = {};
  const jobCompanyName = {};
  const jobRecruiterKey = {};
  for (const data of jobsData) {
    jobs[data.key] = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        yearsOfExperience: data.yearsOfExperience,
        employmentType: data.employmentType,
        requiredSkills: data.requiredSkills,
        status: "OPEN",
        companyId: companies[data.company].id,
        recruiterId: recruiters[data.recruiter].profile.id,
        createdAt: daysFromNow(-20),
      },
    });
    jobCompanyName[data.key] = data.company;
    jobRecruiterKey[data.key] = data.recruiter;
  }
  console.log(`Created ${jobsData.length} jobs`);

  // ---------- Candidates, profiles, resumes ----------
  const candidates = {};
  for (const data of candidatesData) {
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        role: "CANDIDATE",
        isEmailVerified: true,
        avatar: avatarUrl(data.fullName),
      },
    });

    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        phone: data.phone,
        bio: data.bio,
        location: data.location,
        yearsOfExperience: data.yearsOfExperience,
        currentPosition: data.currentPosition,
        expectedSalary: data.expectedSalary,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
      },
    });

    const resume = await prisma.resume.create({
      data: {
        candidateProfileId: profile.id,
        title: data.resume.title,
        fileUrl: resumePdfUrl(data.resume.slug),
        publicId: `seed/resumes/${data.resume.slug}`,
        originalFileName: data.resume.originalFileName,
        aiScore: data.resume.aiScore,
        extractedSkills: data.resume.extractedSkills,
        isDefault: true,
        analysisStatus: "COMPLETED",
        analysisStartedAt: daysFromNow(-15),
        analysisCompletedAt: daysFromNow(-14),
        summary: data.resume.summary,
        strengths: data.resume.strengths,
        weaknesses: data.resume.weaknesses,
        missingSkills: data.resume.missingSkills,
        recommendedSkills: data.resume.recommendedSkills,
        experienceLevel: data.resume.experienceLevel,
        atsCompatibility: data.resume.atsCompatibility,
        grammarScore: data.resume.grammarScore,
        formatScore: data.resume.formatScore,
        keywordScore: data.resume.keywordScore,
        jobReadinessScore: data.resume.jobReadinessScore,
        careerLevel: data.resume.careerLevel,
        industryFit: data.resume.industryFit,
        parsedText: data.resume.parsedText,
        lastAnalyzedAt: daysFromNow(-14),
        analysisVersion: "1.0.0",
      },
    });

    candidates[data.key] = { user, profile, resume };
  }
  console.log(`Created ${candidatesData.length} candidates with profiles and resumes`);

  // ---------- Applications ----------
  const applicationByKey = {};
  const recruiterUserByKey = Object.fromEntries(
    Object.entries(recruiters).map(([key, value]) => [key, value.user])
  );

  for (const data of applicationsData) {
    const candidate = candidates[data.candidate];
    const job = jobs[data.job];
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.profile.id,
        jobId: job.id,
        resumeId: candidate.resume.id,
        status: data.status,
        appliedAt: hoursFromNow(-data.appliedHoursAgo),
        recruiterNotes: data.recruiterNotes,
      },
    });
    applicationByKey[`${data.candidate}::${data.job}`] = {
      application,
      candidate,
      job,
      companyName: companies[jobCompanyName[data.job]].name,
      recruiterUser: recruiterUserByKey[jobRecruiterKey[data.job]],
    };
  }
  console.log(`Created ${applicationsData.length} applications`);

  // ---------- Interviews ----------
  for (const data of interviewsData) {
    const entry = applicationByKey[`${data.candidate}::${data.job}`];
    const scheduledAt = hoursFromNow(data.scheduledHoursFromNow);
    const isCompleted = data.status === "COMPLETED";

    await prisma.interview.create({
      data: {
        applicationId: entry.application.id,
        interviewType: data.interviewType,
        scheduledAt,
        durationMinutes: data.durationMinutes,
        timezone: data.timezone,
        meetingLink: data.meetingLink,
        notes: data.notes,
        status: data.status,
        feedback: data.feedback,
        score: data.score,
        completedAt: isCompleted
          ? new Date(scheduledAt.getTime() + data.durationMinutes * 60000)
          : null,
      },
    });
  }
  console.log(`Created ${interviewsData.length} interviews`);

  // ---------- Job matches ----------
  const matchByCandidate = {};
  for (const data of jobMatchesData) {
    const candidate = candidates[data.candidate];
    const job = jobs[data.job];
    const skills = candidate.resume.extractedSkills;
    const matchedSkills = skills.slice(0, 3);
    const missingSkills = job.requiredSkills.filter((skill) => !skills.includes(skill)).slice(0, 2);
    const missingSkillsDisplay =
      missingSkills.length > 0 ? missingSkills : ["Advanced domain-specific tooling"];

    const match = await prisma.jobMatch.create({
      data: {
        candidateId: candidate.profile.id,
        resumeId: candidate.resume.id,
        jobId: job.id,
        analysisStatus: "COMPLETED",
        overallScore: data.overallScore,
        matchedSkills,
        missingSkills: missingSkillsDisplay,
        strengths: [
          `${candidate.fullName} matches ${matchedSkills.join(", ")} strongly`,
          "Relevant industry experience aligned with the role",
          "Consistent career progression and practical exposure",
        ],
        weaknesses: [
          `Missing ${missingSkillsDisplay.join(", ")}`,
          "Limited experience with the company's specific product domain",
        ],
        summary: matchSummary(candidate.fullName, job.title, data.overallScore),
        recommendation: data.recommendation,
        analysisStartedAt: daysFromNow(-6),
        analysisCompletedAt: daysFromNow(-5),
      },
    });

    if (!matchByCandidate[data.candidate]) matchByCandidate[data.candidate] = [];
    matchByCandidate[data.candidate].push({ match, job });
  }
  console.log(`Created ${jobMatchesData.length} job matches`);

  // ---------- Cover letters ----------
  const coverLettersData = [
    { candidate: "aditya", job: "frontend-google" },
    { candidate: "rohan", job: "backend-google" },
    { candidate: "neha", job: "fullstack-razorpay" },
    { candidate: "sneha", job: "frontend-razorpay" },
    { candidate: "aman", job: "node-browserstack" },
    { candidate: "karan", job: "fullstack-razorpay" },
  ];

  for (const data of coverLettersData) {
    const entry = applicationByKey[`${data.candidate}::${data.job}`];
    const job = entry.job;
    await prisma.coverLetter.create({
      data: {
        candidateId: entry.candidate.profile.id,
        resumeId: entry.candidate.resume.id,
        jobId: job.id,
        content: coverLetter(
          entry.candidate.user.fullName,
          job.title,
          entry.companyName,
          entry.candidate.resume.extractedSkills.slice(0, 4)
        ),
        status: "COMPLETED",
        generatedAt: daysFromNow(-4),
      },
    });
  }
  console.log(`Created ${coverLettersData.length} cover letters`);

  // ---------- Notifications ----------
  const notificationPromises = [];
  const createNotification = async (userId, data) => {
    notificationPromises.push(
      prisma.notification.create({
        data: {
          userId,
          createdAt: hoursFromNow(-data.hoursAgo),
          isRead: data.isRead,
          ...data.fields,
        },
      })
    );
  };

  for (const [candidateKey, candidate] of Object.entries(candidates)) {
    const c = candidate.user;
    const entries = Object.values(applicationByKey).filter(
      (e) => e.candidate.user.id === c.id
    );

    await createNotification(c.id, {
      hoursAgo: 24,
      isRead: false,
      fields: {
        title: "AI Resume Analysis Complete",
        message: `AI analysis completed for '${candidate.resume.title}'. Overall ATS Score: ${candidate.resume.aiScore}%.`,
        type: "AI",
        entityId: candidate.resume.id,
        entityType: "Resume",
        metadata: { aiScore: candidate.resume.aiScore },
      },
    });

    entries.forEach((entry, index) => {
      const job = entry.job;
      const appliedAtHoursAgo = (Date.now() - entry.application.appliedAt.getTime()) / 3600000;

      createNotification(c.id, {
        hoursAgo: Math.max(1, Math.round(appliedAtHoursAgo)),
        isRead: index % 2 === 0,
        fields: {
          title: "Application Submitted Successfully",
          message: `Your application for '${job.title}' at ${entry.companyName} has been received.`,
          type: "APPLICATION",
          entityId: job.id,
          entityType: "Job",
        },
      });

      if (entry.application.status === "INTERVIEW_SCHEDULED") {
        createNotification(c.id, {
          hoursAgo: 12,
          isRead: false,
          fields: {
            title: "Interview Scheduled",
            message: `An interview for '${job.title}' has been scheduled for the coming days.`,
            type: "INTERVIEW",
            entityId: entry.application.id,
            entityType: "Application",
          },
        });
      }

      if (entry.application.status === "HIRED") {
        createNotification(c.id, {
          hoursAgo: 20,
          isRead: true,
          fields: {
            title: "Congratulations, You're Hired!",
            message: `Great news! You have been hired for '${job.title}' at ${entry.companyName}. Welcome aboard!`,
            type: "APPLICATION",
            entityId: entry.application.id,
            entityType: "Application",
          },
        });
      }

      if (entry.application.status === "REJECTED") {
        createNotification(c.id, {
          hoursAgo: 96,
          isRead: true,
          fields: {
            title: "Application Update",
            message: `Thank you for applying for '${job.title}' at ${entry.companyName}. The status of your application has been updated.`,
            type: "APPLICATION",
            entityId: entry.application.id,
            entityType: "Application",
          },
        });
      }
    });

    const matches = matchByCandidate[candidateKey] || [];
    if (matches.length > 0) {
      const { match, job } = matches[0];
      createNotification(c.id, {
        hoursAgo: 30,
        isRead: false,
        fields: {
          title: "AI Job Match Recommendation",
          message: `You have a ${match.overallScore}% match score for '${job.title}'.`,
          type: "AI",
          entityId: job.id,
          entityType: "Job",
          metadata: { matchScore: match.overallScore },
        },
      });
    }
  }

  for (const recruiter of Object.values(recruiters)) {
    const r = recruiter.user;

    for (const entry of Object.values(applicationByKey)) {
      if (entry.recruiterUser.id !== r.id) continue;

      const hoursAgo = Math.max(
        1,
        Math.round((Date.now() - entry.application.appliedAt.getTime()) / 3600000)
      );

      createNotification(r.id, {
        hoursAgo,
        isRead: hoursAgo > 24,
        fields: {
          title: "New Job Application Received",
          message: `A candidate has submitted an application for '${entry.job.title}'.`,
          type: "APPLICATION",
          entityId: entry.job.id,
          entityType: "Job",
          metadata: { candidateName: entry.candidate.user.fullName },
        },
      });
    }

    createNotification(r.id, {
      hoursAgo: 8,
      isRead: false,
      fields: {
        title: "Interview Confirmed",
        message: `Interview for one of your job postings has been scheduled for the coming days.`,
        type: "INTERVIEW",
      },
    });

    createNotification(r.id, {
      hoursAgo: 72,
      isRead: true,
      fields: {
        title: "Welcome to HirePilot AI",
        message: "Your recruiter account is ready. Post jobs and review applicants in one place.",
        type: "SYSTEM",
      },
    });
  }

  await Promise.all(notificationPromises);
  console.log(`Created ${notificationPromises.length} notifications`);

  const summary = {
    companies: companiesData.length,
    recruiters: recruitersData.length,
    candidates: candidatesData.length,
    jobs: jobsData.length,
    applications: applicationsData.length,
    interviews: interviewsData.length,
    jobMatches: jobMatchesData.length,
    coverLetters: coverLettersData.length,
    notifications: notificationPromises.length,
  };

  console.log("\nSeed completed successfully.");
  console.table(summary);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
