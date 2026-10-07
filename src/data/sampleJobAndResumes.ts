import { JobDescription, ExtractedResume } from '../types';

export const SAMPLE_JOB_DESCRIPTION: JobDescription = {
  title: 'Senior Full-Stack Cloud Engineer',
  raw_text: `Job Title: Senior Full-Stack Cloud Engineer
Department: Platform & Cloud Engineering
Location: San Francisco, CA (Hybrid / Remote)

About the Role:
We are seeking an experienced Senior Full-Stack Cloud Engineer to design, build, and deploy high-concurrency web applications and distributed cloud services. You will architect robust microservices, craft intuitive frontend interfaces, and maintain automated cloud infrastructure.

Core Requirements & Qualifications:
- 4+ years of professional full-stack software development experience.
- Bachelor's degree or higher in Computer Science, Software Engineering, or a related technical discipline.
- Core technical skills required:
  * React & modern frontend frameworks
  * Node.js / TypeScript backend development
  * PostgreSQL or relational database design and optimization
  * AWS cloud architecture (EC2, S3, Lambda, RDS)
  * Docker containerization and CI/CD pipelines
- Nice to have (preferred):
  * Kubernetes (K8s) orchestration
  * GraphQL API development
  * Terraform or Infrastructure as Code

Key Responsibilities:
- Lead the architecture and implementation of full-stack services using React and Node.js.
- Build and optimize relational schemas and SQL queries on PostgreSQL.
- Containerize services with Docker and manage AWS cloud resources.
- Participate in code reviews, technical roadmapping, and mentorship.`,
  required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
  preferred_skills: ['Kubernetes', 'GraphQL', 'CI/CD'],
  min_experience_years: 4,
  education_requirement: "Bachelor's degree or higher in Computer Science or related discipline",
  responsibilities: [
    'Lead the architecture and implementation of full-stack services using React and Node.js',
    'Build and optimize relational schemas and SQL queries on PostgreSQL',
    'Containerize services with Docker and manage AWS cloud resources',
    'Participate in code reviews, technical roadmapping, and mentorship'
  ]
};

export const SAMPLE_CANDIDATES: ExtractedResume[] = [
  {
    id: 'sample_cand_1',
    filename: 'Elena_Rostova_Resume.pdf',
    name: 'Elena Rostova',
    contact: 'elena.rostova@techcraft.io | (415) 890-1234 | San Francisco, CA',
    email: 'elena.rostova@techcraft.io',
    phone: '4158901234',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes', 'GraphQL', 'CI/CD', 'Redis', 'Python'],
    education: 'M.S. in Computer Science, UC Berkeley (2019)',
    education_level: 'Master',
    experience_years: 7,
    experience_summary: '7+ years leading full-stack microservices at ScaleGrid. Spearheaded React and Node.js migration, designed PostgreSQL sharded database, built automated Docker/Kubernetes deployment pipelines on AWS.',
    certifications: ['AWS Certified Solutions Architect - Professional', 'Certified Kubernetes Administrator (CKA)'],
    parse_status: 'success',
    raw_text: `ELENA ROSTOVA
Senior Cloud & Full-Stack Architect
Email: elena.rostova@techcraft.io | Phone: (415) 890-1234 | San Francisco, CA

PROFESSIONAL SUMMARY:
Lead Full-Stack and Cloud Engineer with 7 years of deep production experience building fault-tolerant cloud platforms using React, Node.js, and TypeScript on AWS. Specialized in PostgreSQL performance tuning and Docker container orchestration.

TECHNICAL EXPERTISE:
- Languages: TypeScript, JavaScript, Python, SQL
- Frontend: React, Redux, Next.js, Tailwind CSS
- Backend: Node.js, Express, Fastify, REST, GraphQL
- Cloud & DevOps: AWS (EC2, ECS, Lambda, RDS, S3), Docker, Kubernetes, CI/CD, Terraform
- Databases: PostgreSQL, Redis, DynamoDB

PROFESSIONAL EXPERIENCE:
Lead Platform Architect | CloudScale Inc. (2021 – Present)
- Led team of 8 engineers building enterprise SaaS on React and Node.js with TypeScript.
- Architected AWS cloud infrastructure saving $180k annually in compute costs.
- Designed PostgreSQL high-throughput transactional database supporting 50M records.
- Containerized 24 microservices using Docker and deployed via automated CI/CD pipelines.

Senior Full-Stack Engineer | Apex Software (2018 – 2021)
- Developed responsive client portals in React and TypeScript with real-time WebSocket feeds.
- Engineered resilient Node.js microservices interfacing with PostgreSQL and Redis.

EDUCATION & CERTIFICATIONS:
- Master of Science in Computer Science | University of California, Berkeley (2017 – 2019)
- Bachelor of Science in Software Engineering | San Jose State University (2013 – 2017)
- AWS Certified Solutions Architect - Professional
- Certified Kubernetes Administrator (CKA)`
  },
  {
    id: 'sample_cand_2',
    filename: 'Marcus_Chen_FullStack.docx',
    name: 'Marcus Chen',
    contact: 'marcus.chen.dev@gmail.com | (206) 555-0192 | Seattle, WA',
    email: 'marcus.chen.dev@gmail.com',
    phone: '2065550192',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'REST API', 'Tailwind CSS'],
    education: 'B.S. in Computer Science, University of Washington (2020)',
    education_level: 'Bachelor',
    experience_years: 5,
    experience_summary: '5 years of professional software engineering experience developing full-stack web applications with React, TypeScript, and Node.js. Experienced in Docker containerization and AWS cloud deployments.',
    certifications: ['AWS Certified Developer - Associate'],
    parse_status: 'success',
    raw_text: `MARCUS CHEN
Full-Stack Software Engineer
Email: marcus.chen.dev@gmail.com | Seattle, WA

EXPERIENCE OVERVIEW:
Full-stack software developer with 5 years experience crafting robust web applications with TypeScript, React, and Node.js backend services. Experienced with relational database design in PostgreSQL and Docker container deployments on AWS.

CORE SKILLS:
React, TypeScript, Node.js, Express, PostgreSQL, Docker, AWS, Git, REST APIs, Tailwind CSS

EMPLOYMENT HISTORY:
Senior Software Engineer | Veloce Systems (2022 - Present)
- Developed scalable web client applications in React and TypeScript.
- Built backend REST APIs in Node.js connected to PostgreSQL relational databases.
- Containerized microservices using Docker and orchestrated deployments on AWS ECS.

Software Engineer | Northwest Digital (2020 - 2022)
- Created reusable React UI components and managed application state.
- Integrated third-party APIs and managed schema migrations in PostgreSQL.

EDUCATION:
- B.S. in Computer Science | University of Washington (2016 - 2020)
- AWS Certified Developer - Associate`
  },
  {
    id: 'sample_cand_3',
    filename: 'Priya_Sharma_Resume.pdf',
    name: 'Priya Sharma',
    contact: 'priya.sharma@outlook.com | (408) 555-7821 | Austin, TX',
    email: 'priya.sharma@outlook.com',
    phone: '4085557821',
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'SQL', 'Redux', 'Jest'],
    education: 'B.Tech in Information Technology, National Institute of Technology (2022)',
    education_level: 'Bachelor',
    experience_years: 3,
    experience_summary: '3 years of experience specializing in React and TypeScript frontend engineering with Node.js backend integrations and SQL databases. Strong UI/UX architecture and testing fundamentals.',
    certifications: ['Meta Certified Front-End Developer'],
    parse_status: 'success',
    raw_text: `PRIYA SHARMA
Frontend / Full-Stack Engineer
Email: priya.sharma@outlook.com | Austin, TX

SUMMARY:
Software engineer with 3 years hands-on experience building performant user interfaces with React and TypeScript. Comfortable developing Node.js backend services and writing SQL queries. Seeking to expand cloud infrastructure skills.

SKILLS:
Frontend: React, TypeScript, JavaScript, Redux Toolkit, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, SQL, REST APIs
Testing & Tools: Jest, Git, Webpack

WORK HISTORY:
Frontend Software Engineer | StreamLine Tech (2022 – Present)
- Engineered responsive dashboards in React and TypeScript utilized by 150k monthly active users.
- Built modular Node.js API endpoints for internal tools with SQL database integrations.
- Increased frontend test coverage to 88% using Jest and React Testing Library.

Junior Developer | PixelWave Labs (2021 – 2022)
- Built interactive UI components in React and optimized bundle size.

EDUCATION:
- Bachelor of Technology in Information Technology | NIT (2018 - 2022)`
  },
  {
    id: 'sample_cand_4',
    filename: 'David_Miller_CloudDevOps.pdf',
    name: 'David Miller',
    contact: 'dmiller.cloud@protonmail.com | (303) 555-3490 | Denver, CO',
    email: 'dmiller.cloud@protonmail.com',
    phone: '3035553490',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'Linux', 'Terraform', 'PostgreSQL', 'CI/CD', 'Bash', 'Networking'],
    education: 'B.S. in Computer Information Systems, Colorado State University (2019)',
    education_level: 'Bachelor',
    experience_years: 6,
    experience_summary: '6 years of systems and cloud infrastructure experience managing AWS environments, Docker containers, Kubernetes clusters, and PostgreSQL database maintenance. Basic familiarity with frontend code.',
    certifications: ['AWS Certified Solutions Architect', 'HashiCorp Certified Terraform Associate'],
    parse_status: 'success',
    raw_text: `DAVID MILLER
Cloud Infrastructure & DevOps Engineer
Denver, CO | Email: dmiller.cloud@protonmail.com

PROFILE:
Cloud Engineer with 6 years experience architecting multi-region AWS environments, Dockerizing services, and managing Kubernetes infrastructure. Strong automation skills with Python and Terraform.

TECHNICAL SKILLS:
Cloud: AWS (VPC, EC2, ECS, EKS, RDS, S3, IAM)
Containers: Docker, Docker Compose, Kubernetes (K8s)
Databases: PostgreSQL, MySQL, Redis
Scripting & Infra: Python, Bash, Terraform, Linux Administration, CI/CD (GitHub Actions, Jenkins)

WORK EXPERIENCE:
Senior Cloud Engineer | Peak Infrastructure (2021 - Present)
- Automated AWS cloud provisioning using Terraform and Docker containers.
- Managed high-availability PostgreSQL clusters on AWS RDS with automated backups.
- Deployed CI/CD deployment pipelines for engineering teams.

DevOps Systems Admin | FrontRange Data (2018 - 2021)
- Managed Linux server fleets and Docker container deployments.
- Maintained monitoring and telemetry using Prometheus and Grafana.

EDUCATION:
- B.S. in Computer Information Systems | Colorado State University (2014 - 2018)`
  },
  {
    id: 'sample_cand_5',
    filename: 'Aisha_AlMansoor_JuniorDev.docx',
    name: 'Aisha Al-Mansoor',
    contact: 'aisha.almansoor@gmail.com | (646) 555-4819 | New York, NY',
    email: 'aisha.almansoor@gmail.com',
    phone: '6465554819',
    skills: ['JavaScript', 'HTML5', 'CSS3', 'React', 'Git', 'Basic Python'],
    education: 'B.S. in Computer Science, City University of New York (2024)',
    education_level: 'Bachelor',
    experience_years: 1,
    experience_summary: '1 year of experience as a junior web developer working on frontend web pages with React and JavaScript. Passionate learner eager to develop cloud and backend capabilities.',
    certifications: [],
    parse_status: 'success',
    raw_text: `AISHA AL-MANSOOR
Junior Web Developer
New York, NY | aisha.almansoor@gmail.com

OBJECTIVE:
Recent Computer Science graduate with 1 year junior development experience building responsive web interfaces in React and modern JavaScript.

SKILLS:
JavaScript, React, HTML5, CSS3, Git, GitHub, Basic Python

PROJECTS & EXPERIENCE:
Junior Web Developer | Urban Creative (2024 – Present)
- Built interactive web pages using React and CSS frameworks.
- Assisted senior engineers with frontend bug fixes and responsive styling.

Capstone Project: Campus Event Portal
- Developed a React web application allowing students to register for campus clubs.

EDUCATION:
- Bachelor of Science in Computer Science | CUNY (Graduated 2024)`
  },
  {
    id: 'sample_cand_6',
    filename: 'Lucas_Vance_DataAnalyst.pdf',
    name: 'Lucas Vance',
    contact: 'lucas.vance@analytics.org | (312) 555-8910 | Chicago, IL',
    email: 'lucas.vance@analytics.org',
    phone: '3125558910',
    skills: ['Python', 'SQL', 'Tableau', 'Pandas', 'NumPy', 'Power BI', 'Statistics', 'R', 'Excel'],
    education: 'M.S. in Applied Statistics, Northwestern University (2021)',
    education_level: 'Master',
    experience_years: 4,
    experience_summary: '4 years experience as a Data Analyst generating business intelligence reports, statistical models, and SQL data queries using Python and Tableau. Not focused on web application engineering.',
    certifications: ['Tableau Desktop Certified Professional'],
    parse_status: 'success',
    raw_text: `LUCAS VANCE
Senior Data Analyst
Chicago, IL | Email: lucas.vance@analytics.org

PROFESSIONAL SUMMARY:
Data Analyst with 4 years of experience analyzing complex datasets, building predictive statistical models, and delivering executive dashboards using Python, SQL, and Tableau.

CORE COMPETENCIES:
Python, SQL, Pandas, NumPy, Tableau, Power BI, Statistics, Quantitative Modeling, Excel

EXPERIENCE:
Data Analyst | Midwest Analytics Group (2021 - Present)
- Queried large data warehouses using SQL to extract customer retention metrics.
- Developed automated Python ETL pipelines using Pandas for financial reporting.
- Created Tableau executive dashboards monitored weekly by leadership.

EDUCATION:
- Master of Science in Applied Statistics | Northwestern University (2019 - 2021)
- Bachelor of Science in Mathematics | University of Illinois (2015 - 2019)`
  },
  {
    id: 'sample_cand_7',
    filename: 'Elena_Rostova_Resume_Copy.pdf',
    name: 'Elena Rostova (Duplicate)',
    contact: 'elena.rostova@techcraft.io | (415) 890-1234 | San Francisco, CA',
    email: 'elena.rostova@techcraft.io',
    phone: '4158901234',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes'],
    education: 'M.S. in Computer Science, UC Berkeley (2019)',
    education_level: 'Master',
    experience_years: 7,
    experience_summary: 'Duplicate submission test candidate with identical email and qualifications.',
    certifications: ['AWS Certified Solutions Architect'],
    parse_status: 'success',
    raw_text: `ELENA ROSTOVA
Duplicate resume file uploaded in batch.
Email: elena.rostova@techcraft.io | Phone: (415) 890-1234`
  },
  {
    id: 'sample_cand_8',
    filename: 'Scanned_Doc_Unreadable.pdf',
    name: 'Unparsed Scanned Doc',
    contact: 'N/A',
    email: '',
    phone: '',
    skills: [],
    education: '',
    education_level: 'Unknown',
    experience_years: 0,
    experience_summary: '',
    certifications: [],
    parse_status: 'failed',
    parse_error: 'Scanned or image-only PDF: No extractable text layer detected. OCR required.',
    raw_text: ''
  }
];
