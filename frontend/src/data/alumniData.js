/**
 * Centralized Alumni Community Data Layer for BIT Connect
 * Extracted and structured directly from the official Bannari Amman Institute of Technology Alumni Website:
 * https://www.bitsathy.ac.in/alumni/
 *
 * Prepared as an API-ready data service layer for future dynamic Admin CMS integration.
 */

export const alumniAssociationInfo = {
  name: "Bannari Amman Institute of Technology Alumni Association (AABIT)",
  parentInstitution: "Bannari Amman Institute of Technology",
  tagline: "Stay Ahead • Connect. Inspire. Empower.",
  establishedYear: 1996,
  headquarters: "BIT Campus, Alathukombai Post, Sathyamangalam - 638 401, Erode District, Tamil Nadu, India",
  email: "alumni@bitsathy.ac.in",
  intercom: "04295 226124",
  phone: "+91 4295 226000",
  mobile: "+91 99429 21289",
  website: "https://www.bitsathy.ac.in/alumni/",
  description:
    "The Bannari Amman Institute of Technology Alumni Association (AABIT) serves as a vital bridge uniting more than 33,000 graduates across the globe with their alma mater. It fosters lifelong relationships, facilitates professional networking and knowledge exchange, supports student mentorship and scholarships, and contributes to the continuous institutional advancement of BIT.",
  welfareInitiatives: [
    {
      title: "Alumni Welfare & Support Fund",
      description: "Dedicated welfare initiatives providing financial, medical, and career contingency support to alumni members in need.",
      icon: "HeartHandshake"
    },
    {
      title: "Student Mentorship & Industry Readiness",
      description: "Alumni-led bootcamps, tech talks, resume reviews, and pre-placement guidance for current BIT undergraduates.",
      icon: "GraduationCap"
    },
    {
      title: "Entrepreneurship & Startup Incubation",
      description: "Collaboration with the BIT Technology Business Incubator (TBI) to fund and mentor alumni-founded innovation startups.",
      icon: "Rocket"
    },
    {
      title: "Annual Sports & Cultural Carnivals",
      description: "Yearly athletic tournaments and cultural gatherings bringing alumni batches together on campus.",
      icon: "Trophy"
    }
  ]
};

export const alumniObjectives = [
  {
    id: 1,
    title: "Unified Alumni & Student Forum",
    description: "To bring old students of Bannari Amman Institute of Technology under one forum for exchange of experience, knowledge, and talents amongst members and the students of the college."
  },
  {
    id: 2,
    title: "Socio-Cultural & Educational Advancement",
    description: "To promote social, cultural, and educational relations among the members educated from BIT with a view to develop the institution and those who pass out from it."
  },
  {
    id: 3,
    title: "Member Welfare & Contingency Support",
    description: "To safeguard and promote the interest of the members by constitutional means and to setup a welfare fund for the welfare of the members under the rules and bye-laws framed thereof for the operation of the fund."
  },
  {
    id: 4,
    title: "Institutional Growth & Campus Initiatives",
    description: "To voluntarily associate those who pass out from BIT in any program that calls for development and technological elevation of the Institution."
  },
  {
    id: 5,
    title: "Lifelong Alumni Identity & Record Maintenance",
    description: "To maintain accurate, authenticated digital records and identity profiles of all alumni who graduate from BIT."
  },
  {
    id: 6,
    title: "Global Chapter Networking & Holistic Development",
    description: "To provide a structured platform for alumni to meet, collaborate, and undertake initiatives promoting their overall professional and personal development."
  },
  {
    id: 7,
    title: "Conducive Acts for Community Progress",
    description: "To execute all such other acts and things as are incidental or conducive to the attainment of the above objectives for the BIT community."
  }
];

export const alumniStatistics = {
  totalAlumni: 33778,
  totalAlumniDisplay: "33,778+",
  batchCoverage: "1996 - 2026",
  totalChapters: 15,
  globalChapters: 4,
  nationalChapters: 3,
  stateChapters: 5,
  globalAlumniMeets: 4,
  nationalMeets: 3,
  interstateMeets: 5,
  chapterMeets: 12,
  annualSportsMeet: "Every Year"
};

export const alumniChapters = [
  // International Chapters
  {
    id: "germany",
    name: "Germany Chapter",
    category: "INTERNATIONAL",
    country: "Germany",
    city: "Frankfurt & Munich Region",
    established: "2018",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Germany.jpeg",
    description: "Uniting BIT engineers and researchers across Europe for collaborative industry insights, academic research, and regional meetups.",
    email: "alumni.germany@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "uk",
    name: "United Kingdom Chapter",
    category: "INTERNATIONAL",
    country: "United Kingdom",
    city: "London & Birmingham",
    established: "2017",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/UK.jpeg",
    description: "Connecting our vibrant community of tech architects, consultants, and leaders across England, Scotland, and Wales.",
    email: "alumni.uk@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "singapore",
    name: "Singapore Chapter",
    category: "INTERNATIONAL",
    country: "Singapore",
    city: "Singapore",
    established: "2016",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Sin1.jpeg",
    description: "A strong network of alumni driving fintech, manufacturing, and software engineering excellence in Southeast Asia.",
    email: "alumni.singapore@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "uae-dubai",
    name: "UAE & Gulf Chapter",
    category: "INTERNATIONAL",
    country: "United Arab Emirates",
    city: "Dubai & Abu Dhabi",
    established: "2019",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Gulf.jpeg",
    description: "Bringing together BIT graduates excelling across civil infrastructure, petroleum, energy, and digital transformation in the Middle East.",
    email: "alumni.gulf@bitsathy.ac.in",
    status: "Active"
  },

  // National Chapters
  {
    id: "mumbai",
    name: "Mumbai Chapter",
    category: "NATIONAL",
    country: "India",
    city: "Mumbai, Maharashtra",
    established: "2015",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/MUmbai.jpeg",
    description: "Financial hub chapter driving enterprise tech, corporate banking, and industrial supply chain networks.",
    email: "alumni.mumbai@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "hyderabad",
    name: "Hyderabad Chapter",
    category: "NATIONAL",
    country: "India",
    city: "Hyderabad, Telangana",
    established: "2016",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Hyderabad.jpeg",
    description: "Dynamic community of AI researchers, cloud developers, and semiconductor engineers in Cyberabad.",
    email: "alumni.hyderabad@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "bangalore",
    name: "Bangalore Chapter",
    category: "NATIONAL",
    country: "India",
    city: "Bengaluru, Karnataka",
    established: "2014",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/BLR1.jpeg",
    description: "Our largest national chapter representing thousands of tech leaders, startup founders, and software pioneers in India's Silicon Valley.",
    email: "alumni.blr@bitsathy.ac.in",
    status: "Active"
  },

  // State / Regional Chapters
  {
    id: "parent-chapter",
    name: "Parent Chapter (Sathyamangalam)",
    category: "STATE",
    country: "India",
    city: "BIT Campus, Sathyamangalam",
    established: "1996",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg",
    description: "The founding alma mater chapter hosting Global Meets, Silver Jubilees, sports fests, and student mentorship programs.",
    email: "alumni@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "chennai",
    name: "Chennai Chapter",
    category: "STATE",
    country: "India",
    city: "Chennai, Tamil Nadu",
    established: "2013",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Chennai.jpeg",
    description: "Key coastal chapter engaging automobile, IT/ITeS, marine, and administrative professionals.",
    email: "alumni.chennai@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "coimbatore",
    name: "Coimbatore Chapter",
    category: "STATE",
    country: "India",
    city: "Coimbatore, Tamil Nadu",
    established: "2014",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/CBE1.jpeg",
    description: "Close-knit regional chapter connecting manufacturing industrialists, textile entrepreneurs, and tech leaders.",
    email: "alumni.cbe@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "karur",
    name: "Karur Chapter",
    category: "STATE",
    country: "India",
    city: "Karur, Tamil Nadu",
    established: "2017",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Karur.jpeg",
    description: "Promoting textile exports, banking, and agribusiness leadership across central Tamil Nadu.",
    email: "alumni.karur@bitsathy.ac.in",
    status: "Active"
  },
  {
    id: "salem",
    name: "Salem Chapter",
    category: "STATE",
    country: "India",
    city: "Salem, Tamil Nadu",
    established: "2018",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Salem.jpeg",
    description: "Active regional chapter uniting steel, manufacturing, and energy sector alumni.",
    email: "alumni.salem@bitsathy.ac.in",
    status: "Active"
  }
];

export const alumniEvents = [
  {
    id: "gam-2026",
    title: "Global Alumni Meet (GAM 2026)",
    category: "GLOBAL_MEET",
    date: "December 26 - 27, 2026",
    time: "09:30 AM IST",
    location: "Main Auditorium, BIT Campus, Sathyamangalam",
    mode: "In-Person & Hybrid Live Stream",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_2.jpg",
    description: "The premier biennial homecoming for all BIT batches worldwide. Includes keynote addresses, campus tours, Distinguished Alumni Awards, and networking dinner.",
    registrationLink: "/register",
    status: "Upcoming"
  },
  {
    id: "batch-2011-eie",
    title: "2011 Batch - EIE Alumni Reunion",
    category: "DEPARTMENT_REUNION",
    date: "11 July 2026",
    time: "10:00 AM IST",
    location: "Department of EIE, BIT Campus",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/alumni_image-1.jpg",
    description: "Special milestone 15-year celebration for Electronics and Instrumentation Engineering graduates with faculty meet and lab visits.",
    status: "Upcoming"
  },
  {
    id: "batch-2011-bt",
    title: "2011 Batch - Biotechnology Alumni Meet",
    category: "DEPARTMENT_REUNION",
    date: "16 May 2026",
    time: "10:30 AM IST",
    location: "Biotechnology Seminar Hall, BIT Campus",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/alumni_image-1.jpg",
    description: "Homecoming reunion for Biotechnology alumni sharing career experiences in biopharma, research, and healthcare innovations.",
    status: "Upcoming"
  },
  {
    id: "batch-2008-txt",
    title: "2008 Batch - Textile Alumni Meet",
    category: "DEPARTMENT_REUNION",
    date: "04 April 2026",
    time: "10:30 AM IST",
    location: "BIT Campus, Sathyamangalam",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Karur1.jpeg",
    description: "Textile Technology batch gathering focusing on sustainable apparel manufacturing, exports, and technical textiles.",
    status: "Upcoming"
  },
  {
    id: "uk-meet-2025",
    title: "UK Alumni Chapter Annual Gathering",
    category: "CHAPTER_MEET",
    date: "November 15, 2025",
    time: "06:30 PM GMT",
    location: "Central London, United Kingdom",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/UKMeet.jpeg",
    description: "Annual meeting of BITians based in London and surrounding regions with dinner, family reconnects, and student mentorship panel.",
    status: "Past"
  },
  {
    id: "blr-meet-2025",
    title: "Bangalore Chapter Tech Conclave",
    category: "CHAPTER_MEET",
    date: "August 23, 2025",
    time: "10:00 AM IST",
    location: "Whitefield, Bengaluru",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/BLR2.jpeg",
    description: "Engaging panel sessions on Generative AI, Cloud Infrastructure, and startup pitches with over 200 alumni delegates.",
    status: "Past"
  },
  {
    id: "sports-meet-annual",
    title: "Annual Alumni Trophy & Sports Carnival",
    category: "SPORTS_MEET",
    date: "January 24 - 25, 2026",
    time: "08:00 AM IST",
    location: "BIT Sports Complex & Stadium",
    mode: "In-Person",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_7-scaled.jpg",
    description: "Annual inter-batch cricket, badminton, football, basketball, and track tournaments with commemorative trophies and family games.",
    status: "Past"
  }
];

export const distinguishedAlumni = [
  {
    id: "shri-devasenapathi-ias",
    name: "Shri K C Devasenapathi IAS",
    role: "Joint Secretary",
    organization: "Ministry of Home Affairs, Government of India",
    category: "CIVIL_SERVICES",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Mr-Devasenapathy-K-C-.jpg",
    achievement: "Distinguished Indian Administrative Service (IAS) officer steering critical national public administration and governance policies.",
    batch: "Alumnus"
  },
  {
    id: "vanmathi-ias",
    name: "IAS Officer Vanmathi C",
    role: "Joint Commissioner (Enforcement)",
    organization: "State Commercial Taxes Department",
    category: "CIVIL_SERVICES",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Ms-Vanmathi-C-.jpg",
    achievement: "Esteemed IAS officer leading enforcement and public financial integrity initiatives.",
    batch: "Alumna"
  },
  {
    id: "rohinipriyadarshini-ips",
    name: "Smt. P Rohinipriyadarshini IPS",
    role: "Deputy Commissioner of Police",
    organization: "Indian Police Service (IPS)",
    category: "CIVIL_SERVICES",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Ms-Rohini-Priyadarshini-P-.jpg",
    achievement: "Senior police commander leading law enforcement, cybercrime prevention, and public safety.",
    batch: "Alumna"
  },
  {
    id: "mahesh-kumar-isro",
    name: "Mr. Mahesh Kumar S",
    role: "Scientist / Engineer-SE",
    organization: "ISRO (Indian Space Research Organisation)",
    category: "RESEARCH_SCIENCE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Mr-Mahesh-Kumar-S.jpg",
    achievement: "Lead aerospace scientist contributing to India's premier satellite and space exploration missions.",
    batch: "Alumnus"
  },
  {
    id: "lashmanan-aerb",
    name: "Mr. Lashmanan S P",
    role: "Scientific Officer",
    organization: "Atomic Energy Regulatory Board (AERB)",
    category: "RESEARCH_SCIENCE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/LASHMANAN-S-P-scaled.jpg",
    achievement: "Senior nuclear regulatory scientist ensuring radiation safety standards and atomic plant governance.",
    batch: "Alumnus"
  },
  {
    id: "rajivi-prashanth-army",
    name: "Major M Rajivi Prashanth",
    role: "Major",
    organization: "Indian Army",
    category: "DEFENSE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Mr.-M.-Rajivi-Prashanth.jpg",
    achievement: "Decorated military commander serving the nation with valor and strategic operational command.",
    batch: "Alumnus"
  },
  {
    id: "ravichandran-iaf",
    name: "Squadron Leader R Ravichandran",
    role: "Squadron Leader",
    organization: "Indian Air Force (IAF)",
    category: "DEFENSE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Sqn-Ldr-Ravichandran-R-.jpg",
    achievement: "IAF aviation leader safeguarding national airspace with exemplary aerial defense service.",
    batch: "Alumnus"
  },
  {
    id: "vijay-viswanathan-coastguard",
    name: "Commandant Vijay Viswanathan",
    role: "Commandant",
    organization: "Indian Coast Guard",
    category: "DEFENSE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Vijay-Viswanathan.jpg",
    achievement: "Commanding officer overseeing maritime security, coastal surveillance, and search-and-rescue.",
    batch: "Alumnus"
  },
  {
    id: "abinaya-nishanthini-idad",
    name: "Smt. Abinaya Nishanthini B",
    role: "Joint Controller of Defence Accounts",
    organization: "Indian Defence Accounts Department (IDAS)",
    category: "CIVIL_SERVICES",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Ms-Abinaya-Nishanthini-B-.jpg",
    achievement: "Senior administrative controller managing defense budget auditing and financial logistics.",
    batch: "Alumna"
  },
  {
    id: "hemappriyaa-incometax",
    name: "Ms. Hemappriyaa G V",
    role: "Office Superintendent",
    organization: "Income Tax Department, Government of India",
    category: "CIVIL_SERVICES",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Hemappriyaa-G-V.jpg",
    achievement: "Leading administrative officer supporting revenue assessment and compliance governance.",
    batch: "Alumna"
  },
  {
    id: "shanmuga-sundaram-ccri",
    name: "Dr. Shanmuga Sundaram O L",
    role: "Director",
    organization: "Central Coir Research Institute (CCRI)",
    category: "RESEARCH_SCIENCE",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Dr-Shanmuga-Sundaram-O-L.jpg",
    achievement: "Pioneering research scientist directing national natural fiber technology developments.",
    batch: "Alumnus"
  },
  {
    id: "bhuvaneswari-subramani",
    name: "Ms. Bhuvaneswari Subramani",
    role: "Chief Cloud Evangelist",
    organization: "Intuitive.Cloud",
    category: "CORPORATE_LEADERS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Ms-Bhuvaneswari-Subramani-.jpg",
    achievement: "Internationally recognized AWS Community Hero and cloud architecture thought leader.",
    batch: "Alumna"
  },
  {
    id: "saravana-kumar-bosch",
    name: "Dr. Saravana Kumar M",
    role: "Senior Manager",
    organization: "Bosch Global Software Technologies",
    category: "CORPORATE_LEADERS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/SARAVANA-KUMAR-M-.jpg",
    achievement: "Automotive software engineering director driving embedded systems and IoT innovation.",
    batch: "Alumnus"
  },
  {
    id: "karthikeyan-jergens",
    name: "Mr. Karthikeyan D",
    role: "Director - Channel Sales & Marketing",
    organization: "Jergens India Private Limited",
    category: "CORPORATE_LEADERS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/KARTHIKEYAN-D.jpg",
    achievement: "Executive director pioneering precision tooling and manufacturing channel distributions.",
    batch: "Alumnus"
  },
  {
    id: "ram-prakash-vela",
    name: "Mr. Ram Prakash M",
    role: "Managing Partner",
    organization: "Vela Filaments Co.",
    category: "ENTREPRENEURS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/RAM-PRAKASH-M.jpg",
    achievement: "Prominent entrepreneur leading industrial synthetic filament and textile manufacturing.",
    batch: "Alumnus"
  },
  {
    id: "madhana-manokaran-lotus",
    name: "Mr. Madhana Manokaran S",
    role: "Managing Director",
    organization: "Lotus Global Sourcing Inc.",
    category: "ENTREPRENEURS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/MADHANA-MANOKARAN-S.jpg",
    achievement: "Global supply chain entrepreneur orchestrating cross-border apparel and merchandise trade.",
    batch: "Alumnus"
  },
  {
    id: "srijayanthan-barathi",
    name: "Mr. Srijayanthan P",
    role: "Proprietor",
    organization: "Barathi Motors",
    category: "ENTREPRENEURS",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/SRIJAYANTHAN-P.jpg",
    achievement: "Automotive retail and commercial transport entrepreneur.",
    batch: "Alumnus"
  }
];

export const photoGallery = [
  {
    id: "gallery-1",
    title: "Global Alumni Meet - Main Auditorium Gathering",
    category: "GLOBAL_MEETS",
    year: "2026",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_2.jpg",
    caption: "Alumni across batches assembling at the BIT Main Auditorium for the Global Alumni Homecoming."
  },
  {
    id: "gallery-2",
    title: "Campus Reconnect & Heritage Walkway",
    category: "CAMPUS_REUNIONS",
    year: "2026",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_1.jpg",
    caption: "Alumni revisiting academic blocks and learning centres during the campus tour."
  },
  {
    id: "gallery-3",
    title: "Silver Jubilee Celebration & Tree Planting",
    category: "CAMPUS_REUNIONS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_3.jpg",
    caption: "Alumni batches engaging in commemorative plantation and green campus initiatives."
  },
  {
    id: "gallery-4",
    title: "UK Chapter International Meet - London",
    category: "INTERNATIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/UK.jpeg",
    caption: "United Kingdom alumni chapter delegates during the annual London gathering."
  },
  {
    id: "gallery-5",
    title: "Germany Chapter Meetup - Frankfurt",
    category: "INTERNATIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Germany.jpeg",
    caption: "European alumni delegation exchanging engineering innovations and academic research."
  },
  {
    id: "gallery-6",
    title: "Singapore Chapter Conclave",
    category: "INTERNATIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Sin1.jpeg",
    caption: "Southeast Asian alumni chapter meet discussing fintech and digital cloud advancements."
  },
  {
    id: "gallery-7",
    title: "Gulf & UAE Chapter Gathering - Dubai",
    category: "INTERNATIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Gulf.jpeg",
    caption: "Middle East alumni professionals meeting for collaborative industry networking."
  },
  {
    id: "gallery-8",
    title: "Bangalore Chapter Tech Conclave",
    category: "REGIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/BLR1.jpeg",
    caption: "Over 200 software engineers and startup founders attending the Bengaluru Chapter Meet."
  },
  {
    id: "gallery-9",
    title: "Hyderabad Chapter Meet - Cyberabad",
    category: "REGIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Hyderabad.jpeg",
    caption: "Tech and pharmaceutical leaders gathered at the Hyderabad alumni conclave."
  },
  {
    id: "gallery-10",
    title: "Mumbai Chapter Annual Dinner",
    category: "REGIONAL_CHAPTERS",
    year: "2025",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/MUmbai.jpeg",
    caption: "Financial capital alumni delegation networking at the Mumbai meet."
  },
  {
    id: "gallery-11",
    title: "Chennai Chapter Alumni Meet",
    category: "REGIONAL_CHAPTERS",
    year: "2024",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/slider3/Chennai.jpeg",
    caption: "Tamil Nadu state chapter meeting with corporate leaders and entrepreneurs."
  },
  {
    id: "gallery-12",
    title: "Annual Alumni Sports Tournament - Cricket & Track",
    category: "SPORTS_MEETS",
    year: "2026",
    image: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni_home_banner_7-scaled.jpg",
    caption: "Inter-batch sports tournament and prize distribution at the BIT Stadium."
  }
];

export const alumniNewsletters = [
  {
    id: "vol-10-no-2-2026",
    title: "AABIT Newsletter Vol. 10 No. 2",
    period: "January 2026",
    year: "2026",
    volume: "Volume 10 • Issue 2",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/AABIT-Newsletter-Vol-10-No.-2-1.pdf",
    coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    description: "Features Global Meet highlights, institutional accolades, research breakthroughs, and startup investments by alumni."
  },
  {
    id: "vol-10-no-1-2025",
    title: "AABIT Newsletter Vol. 10 No. 1",
    period: "July 2025",
    year: "2025",
    volume: "Volume 10 • Issue 1",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/AABIT-Newsletter-V-10-No.-1.pdf",
    coverImage: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop&q=80",
    description: "Highlights international chapter meets in the UK and Germany, Distinguished Alumni profiles, and student scholarships."
  },
  {
    id: "vol-9-no-2-2025",
    title: "AABIT Newsletter Vol. 9 No. 2",
    period: "January 2025",
    year: "2025",
    volume: "Volume 9 • Issue 2",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/AABIT-Newsletter-Vol-9-No-2.pdf",
    coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    description: "Coverage of the annual sports meet, industry-academic MOUs, and alumni keynote addresses."
  },
  {
    id: "vol-9-no-1-2024",
    title: "AABIT Newsletter Vol. 9 No. 1",
    period: "July 2024",
    year: "2024",
    volume: "Volume 9 • Issue 1",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/Newsletter-vol-9.-No.-1.pdf",
    coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
    description: "Bangalore Chapter Conclave highlights, department reunions, and technology patents filed by alumni."
  },
  {
    id: "vol-8-no-2-2024",
    title: "AABIT Newsletter Vol. 8 No. 2",
    period: "January 2024",
    year: "2024",
    volume: "Volume 8 • Issue 2",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/Newsletter-Vol-8.-No.2_compressed.pdf",
    coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    description: "Silver Jubilee batch celebrations, alumni welfare fund distributions, and career mentoring sessions."
  },
  {
    id: "vol-8-no-1-2023",
    title: "AABIT Newsletter Vol. 8 No. 1",
    period: "July 2023",
    year: "2023",
    volume: "Volume 8 • Issue 1",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/Newsletter-Vol.8-No.-1.pdf",
    coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
    description: "Regional chapter expansions in Singapore and Dubai, campus infrastructure developments, and alumni guest lectures."
  },
  {
    id: "vol-7-no-2-2023",
    title: "Alumni Association Newsletter Jan 2023",
    period: "January 2023",
    year: "2023",
    volume: "Volume 7 • Issue 2",
    pdfUrl: "https://www.bitsathy.ac.in/wp-content/uploads/Alumni-Association-News-Letter-Jan-2023.pdf",
    coverImage: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=600&auto=format&fit=crop&q=80",
    description: "Comprehensive review of 2022 alumni activities, NIRF and NAAC A+ accreditation celebrations, and graduate placements."
  }
];

export const graduationResources = {
  title: "Official Graduation Day Registration",
  institution: "Bannari Amman Institute of Technology",
  description: "Official registration and credential distribution portal for graduates attending the upcoming Graduation Day Convocation ceremony.",
  officialPortalUrl: "https://www.bitsathy.ac.in/graduation-day-2025/",
  instructions: [
    "Graduands who have successfully cleared all degree requirements and Anna University provisional/degree audits are eligible.",
    "Registration is mandatory for attending the ceremonial convocation and obtaining official robes on campus.",
    "Verify that your registered contact number and email in BIT Connect match your institutional records.",
    "Strict formal dress code and convocation etiquette must be adhered to during the ceremony.",
    "For degree certificate dispatch or transcript verification requests, please utilize the DirectVerify genuineness portal."
  ],
  importantContacts: [
    { label: "Office of the Controller of Examinations", value: "coe@bitsathy.ac.in" },
    { label: "Alumni Relations Office", value: "alumni@bitsathy.ac.in" },
    { label: "Administrative Enquiry", value: "+91 4295 226000" }
  ]
};

export const officialInstitutionalLinks = [
  {
    title: "Genuineness Verification & Transcripts",
    description: "Official online verification of degree certificates and transcript processing for employers and universities worldwide.",
    url: "https://bitsathy.directverify.in/myeasydocs_new/student/index.html#",
    category: "ACADEMIC_VERIFICATION",
    icon: "ShieldCheck"
  },
  {
    title: "NBA Accreditation Alumni Survey",
    description: "Official National Board of Accreditation feedback survey form for engineering alumni (EEE, EIE, ME, MC, IT).",
    url: "https://forms.gle/CZrqndUDenTMBjzz5",
    category: "SURVEYS",
    icon: "ClipboardCheck"
  },
  {
    title: "BIT Technology Business Incubator (TBI)",
    description: "DST-supported startup incubation and seed funding centre empowering alumni-led technology startups.",
    url: "https://bittbi.com/",
    category: "INNOVATION",
    icon: "Rocket"
  },
  {
    title: "Centre of Excellence & Collaborative Labs",
    description: "Explore BIT's cutting-edge industry collaborative laboratories, AI centres, and specialized R&D infrastructure.",
    url: "https://www.bitsathy.ac.in/centre-of-excellence-2/",
    category: "RESEARCH",
    icon: "Cpu"
  },
  {
    title: "AICTE Mandatory Disclosure",
    description: "Official statutory regulatory disclosures, faculty records, governance, and institutional audit documents.",
    url: "https://www.bitsathy.ac.in/wp-content/uploads/aicte-mandatory-disclosure.pdf",
    category: "STATUTORY",
    icon: "FileCheck"
  },
  {
    title: "BIT Careers & Faculty Openings",
    description: "Explore academic, research, and technical staff opportunities at Bannari Amman Institute of Technology.",
    url: "https://www.bitsathy.ac.in/careers/",
    category: "CAREERS",
    icon: "Briefcase"
  }
];
