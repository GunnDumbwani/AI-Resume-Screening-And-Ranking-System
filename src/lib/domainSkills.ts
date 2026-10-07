/**
 * Comprehensive Multi-Domain Skill & Competency Knowledge Base
 * Covering Tech, Sales, Marketing, Finance, HR, Operations, Design, Healthcare, Legal, etc.
 */

export interface SkillDefinition {
  canonical: string;
  category: string;
  aliases: string[];
}

export const DOMAIN_SKILLS: SkillDefinition[] = [
  // --- SOFTWARE & WEB DEVELOPMENT ---
  { canonical: 'JavaScript', category: 'Software', aliases: ['js', 'es6', 'es2020', 'ecmascript'] },
  { canonical: 'TypeScript', category: 'Software', aliases: ['ts'] },
  { canonical: 'Python', category: 'Software', aliases: ['py', 'python3', 'python 3'] },
  { canonical: 'React', category: 'Software', aliases: ['reactjs', 'react.js', 'react js', 'react framework'] },
  { canonical: 'Next.js', category: 'Software', aliases: ['nextjs', 'next js'] },
  { canonical: 'Vue.js', category: 'Software', aliases: ['vue', 'vuejs', 'vue 3'] },
  { canonical: 'Angular', category: 'Software', aliases: ['angularjs', 'angular 2+'] },
  { canonical: 'Node.js', category: 'Software', aliases: ['nodejs', 'node', 'node js'] },
  { canonical: 'Express.js', category: 'Software', aliases: ['express', 'expressjs'] },
  { canonical: 'Java', category: 'Software', aliases: ['core java', 'j2ee', 'java 8', 'java 11', 'java 17'] },
  { canonical: 'Spring Boot', category: 'Software', aliases: ['spring', 'spring framework', 'springboot'] },
  { canonical: 'C++', category: 'Software', aliases: ['cpp', 'c/c++'] },
  { canonical: 'C#', category: 'Software', aliases: ['csharp', '.net', 'asp.net', '.net core', 'dotnet'] },
  { canonical: 'Go', category: 'Software', aliases: ['golang'] },
  { canonical: 'Rust', category: 'Software', aliases: [] },
  { canonical: 'Ruby on Rails', category: 'Software', aliases: ['rails', 'ruby'] },
  { canonical: 'PHP', category: 'Software', aliases: ['laravel', 'symfony'] },
  { canonical: 'HTML5', category: 'Software', aliases: ['html'] },
  { canonical: 'CSS3', category: 'Software', aliases: ['css', 'sass', 'scss', 'less'] },
  { canonical: 'Tailwind CSS', category: 'Software', aliases: ['tailwind', 'tailwindcss'] },
  { canonical: 'REST API', category: 'Software', aliases: ['restful', 'rest apis', 'rest services', 'restful apis'] },
  { canonical: 'GraphQL', category: 'Software', aliases: ['apollo', 'graphql api'] },
  { canonical: 'Microservices', category: 'Software', aliases: ['microservice architecture', 'distributed systems'] },
  { canonical: 'System Design', category: 'Software', aliases: ['system architecture', 'software architecture'] },

  // --- CLOUD, DEVOPS & INFRASTRUCTURE ---
  { canonical: 'AWS', category: 'DevOps', aliases: ['amazon web services', 'amazon aws', 'ec2', 's3', 'lambda'] },
  { canonical: 'Azure', category: 'DevOps', aliases: ['microsoft azure', 'azure cloud'] },
  { canonical: 'Google Cloud Platform', category: 'DevOps', aliases: ['gcp', 'google cloud'] },
  { canonical: 'Docker', category: 'DevOps', aliases: ['containerization', 'containers', 'dockerfile'] },
  { canonical: 'Kubernetes', category: 'DevOps', aliases: ['k8s', 'kube', 'container orchestration'] },
  { canonical: 'Terraform', category: 'DevOps', aliases: ['infrastructure as code', 'iac'] },
  { canonical: 'CI/CD', category: 'DevOps', aliases: ['continuous integration', 'github actions', 'jenkins', 'gitlab ci', 'circleci'] },
  { canonical: 'Linux', category: 'DevOps', aliases: ['unix', 'bash', 'shell scripting', 'ubuntu', 'centos'] },
  { canonical: 'Git', category: 'DevOps', aliases: ['github', 'gitlab', 'version control'] },
  { canonical: 'Monitoring & Observability', category: 'DevOps', aliases: ['datadog', 'prometheus', 'grafana', 'new relic', 'splunk'] },

  // --- DATA, DATABASES & AI/ML ---
  { canonical: 'SQL', category: 'Data', aliases: ['relational database', 'rdbms', 'structured query language'] },
  { canonical: 'PostgreSQL', category: 'Data', aliases: ['postgres', 'psql'] },
  { canonical: 'MySQL', category: 'Data', aliases: ['mariadb'] },
  { canonical: 'MongoDB', category: 'Data', aliases: ['mongo', 'nosql'] },
  { canonical: 'Redis', category: 'Data', aliases: ['caching', 'in-memory database'] },
  { canonical: 'Snowflake', category: 'Data', aliases: ['snowflake data warehouse'] },
  { canonical: 'BigQuery', category: 'Data', aliases: ['google bigquery'] },
  { canonical: 'Apache Spark', category: 'Data', aliases: ['spark', 'pyspark'] },
  { canonical: 'Data Modeling', category: 'Data', aliases: ['etl', 'elt', 'data pipeline', 'data warehousing'] },
  { canonical: 'Machine Learning', category: 'AI/Data', aliases: ['ml', 'predictive modeling', 'statistical learning'] },
  { canonical: 'Deep Learning', category: 'AI/Data', aliases: ['neural networks', 'cnn', 'rnn', 'transformers'] },
  { canonical: 'PyTorch', category: 'AI/Data', aliases: ['torch'] },
  { canonical: 'TensorFlow', category: 'AI/Data', aliases: ['tf', 'keras'] },
  { canonical: 'Natural Language Processing', category: 'AI/Data', aliases: ['nlp', 'large language models', 'llm', 'llms', 'genai', 'generative ai'] },
  { canonical: 'Tableau', category: 'Data', aliases: ['tableau desktop', 'tableau server'] },
  { canonical: 'Power BI', category: 'Data', aliases: ['powerbi', 'dax'] },
  { canonical: 'Data Analysis', category: 'Data', aliases: ['quantitative analysis', 'business intelligence', 'bi'] },

  // --- SALES, ACCOUNT MANAGEMENT & REVENUE ---
  { canonical: 'Salesforce', category: 'Sales', aliases: ['sfdc', 'salesforce crm'] },
  { canonical: 'CRM Management', category: 'Sales', aliases: ['crm', 'hubspot', 'zoho', 'pipedrive'] },
  { canonical: 'B2B Sales', category: 'Sales', aliases: ['business-to-business sales', 'enterprise sales', 'b2b'] },
  { canonical: 'Cold Calling', category: 'Sales', aliases: ['outbound sales', 'cold outreach', 'prospecting'] },
  { canonical: 'Lead Generation', category: 'Sales', aliases: ['lead gen', 'inbound leads', 'lead qualification'] },
  { canonical: 'Account Management', category: 'Sales', aliases: ['client management', 'key accounts', 'retention'] },
  { canonical: 'Pipeline Management', category: 'Sales', aliases: ['sales pipeline', 'funnel optimization', 'quota attainment'] },
  { canonical: 'Negotiation', category: 'Sales', aliases: ['contract negotiation', 'closing deals', 'deal closing'] },
  { canonical: 'Customer Relationship Management', category: 'Sales', aliases: ['relationship building', 'client relations'] },
  { canonical: 'Sales Presentations', category: 'Sales', aliases: ['pitching', 'product demos', 'client presentations'] },

  // --- MARKETING & GROWTH ---
  { canonical: 'Search Engine Optimization', category: 'Marketing', aliases: ['seo', 'on-page seo', 'technical seo', 'keyword research'] },
  { canonical: 'Search Engine Marketing', category: 'Marketing', aliases: ['sem', 'google ads', 'adwords', 'ppc', 'paid search'] },
  { canonical: 'Content Marketing', category: 'Marketing', aliases: ['content strategy', 'copywriting', 'blogging', 'editorial'] },
  { canonical: 'Social Media Marketing', category: 'Marketing', aliases: ['social media management', 'smm', 'instagram marketing', 'linkedin marketing'] },
  { canonical: 'Email Marketing', category: 'Marketing', aliases: ['mailchimp', 'klaviyo', 'email campaigns', 'drip campaigns'] },
  { canonical: 'Google Analytics', category: 'Marketing', aliases: ['ga4', 'google analytics 4', 'web analytics'] },
  { canonical: 'Growth Strategy', category: 'Marketing', aliases: ['growth marketing', 'conversion rate optimization', 'cro', 'funnel analytics'] },
  { canonical: 'Brand Strategy', category: 'Marketing', aliases: ['brand management', 'public relations', 'pr', 'brand positioning'] },

  // --- FINANCE, ACCOUNTING & AUDIT ---
  { canonical: 'Financial Modeling', category: 'Finance', aliases: ['dcf', 'financial models', 'lbo', 'valuation'] },
  { canonical: 'Financial Analysis', category: 'Finance', aliases: ['fp&a', 'financial planning and analysis', 'variance analysis'] },
  { canonical: 'GAAP', category: 'Finance', aliases: ['generally accepted accounting principles', 'ifrs'] },
  { canonical: 'Accounting', category: 'Finance', aliases: ['general ledger', 'month-end close', 'bookkeeping', 'journal entries'] },
  { canonical: 'Accounts Payable', category: 'Finance', aliases: ['ap', 'invoicing', 'vendor payments'] },
  { canonical: 'Accounts Receivable', category: 'Finance', aliases: ['ar', 'collections', 'billing'] },
  { canonical: 'QuickBooks', category: 'Finance', aliases: ['quickbooks online', 'qbo'] },
  { canonical: 'Budgeting & Forecasting', category: 'Finance', aliases: ['annual budgets', 'cash flow forecasting', 'budget management'] },
  { canonical: 'Tax Preparation & Compliance', category: 'Finance', aliases: ['tax filing', 'corporate tax', 'sales tax'] },
  { canonical: 'Internal Audit', category: 'Finance', aliases: ['external audit', 'sox compliance', 'risk management', 'internal controls'] },
  { canonical: 'Microsoft Excel', category: 'General', aliases: ['excel', 'advanced excel', 'vlookup', 'pivot tables', 'macros'] },

  // --- HUMAN RESOURCES & RECRUITING ---
  { canonical: 'Talent Acquisition', category: 'HR', aliases: ['recruiting', 'recruitment', 'full-cycle recruiting', 'sourcing'] },
  { canonical: 'Technical Recruiting', category: 'HR', aliases: ['tech recruiting', 'engineering sourcing'] },
  { canonical: 'HRIS', category: 'HR', aliases: ['workday', 'bamboohr', 'adp', 'gusto', 'greenhouse', 'lever'] },
  { canonical: 'Employee Relations', category: 'HR', aliases: ['conflict resolution', 'hr compliance', 'labor laws'] },
  { canonical: 'Onboarding & Offboarding', category: 'HR', aliases: ['new hire orientation', 'employee lifecycle'] },
  { canonical: 'Performance Management', category: 'HR', aliases: ['kpis', 'okrs', 'annual reviews', 'performance appraisals'] },
  { canonical: 'Compensation & Benefits', category: 'HR', aliases: ['total rewards', 'payroll administration', 'benefits administration'] },

  // --- PRODUCT & PROJECT MANAGEMENT ---
  { canonical: 'Product Management', category: 'Product', aliases: ['product roadmap', 'product lifecycle', 'product strategy'] },
  { canonical: 'Agile Methodology', category: 'Product', aliases: ['agile', 'scrum', 'kanban', 'sprint planning', 'scrum master'] },
  { canonical: 'JIRA', category: 'Product', aliases: ['confluence', 'atlassian'] },
  { canonical: 'User Stories', category: 'Product', aliases: ['product backlog', 'acceptance criteria', 'prds'] },
  { canonical: 'A/B Testing', category: 'Product', aliases: ['experimentation', 'split testing', 'multivariate testing'] },
  { canonical: 'Project Management', category: 'Product', aliases: ['pmp', 'project planning', 'resource allocation', 'gantt charts'] },
  { canonical: 'Stakeholder Management', category: 'Product', aliases: ['cross-functional collaboration', 'stakeholder communication'] },

  // --- UI/UX & CREATIVE DESIGN ---
  { canonical: 'Figma', category: 'Design', aliases: ['figma components', 'figma design system'] },
  { canonical: 'UI/UX Design', category: 'Design', aliases: ['user interface', 'user experience', 'ux design', 'ui design'] },
  { canonical: 'User Research', category: 'Design', aliases: ['usability testing', 'user interviews', 'persona creation'] },
  { canonical: 'Wireframing & Prototyping', category: 'Design', aliases: ['wireframes', 'interactive prototypes', 'mockups'] },
  { canonical: 'Design Systems', category: 'Design', aliases: ['component libraries', 'atomic design'] },
  { canonical: 'Adobe Creative Suite', category: 'Design', aliases: ['photoshop', 'illustrator', 'indesign', 'after effects'] },

  // --- OPERATIONS, LOGISTICS & SUPPLY CHAIN ---
  { canonical: 'Supply Chain Management', category: 'Operations', aliases: ['supply chain', 'procurement', 'vendor management'] },
  { canonical: 'Logistics & Distribution', category: 'Operations', aliases: ['freight', 'shipping', 'warehouse management', 'wms'] },
  { canonical: 'Inventory Management', category: 'Operations', aliases: ['stock control', 'demand forecasting'] },
  { canonical: 'Process Improvement', category: 'Operations', aliases: ['lean', 'six sigma', 'kaizen', 'workflow optimization'] },
  { canonical: 'ERP Systems', category: 'Operations', aliases: ['sap', 'oracle netsuite', 'netsuite', 'microsoft dynamics'] },

  // --- HEALTHCARE & CLINICAL ---
  { canonical: 'Patient Care', category: 'Healthcare', aliases: ['bedside manner', 'patient assessment', 'direct patient care'] },
  { canonical: 'Electronic Health Records', category: 'Healthcare', aliases: ['ehr', 'emr', 'epic systems', 'cerner'] },
  { canonical: 'Clinical Assessment', category: 'Healthcare', aliases: ['vital signs', 'triage', 'patient triage'] },
  { canonical: 'HIPAA Compliance', category: 'Healthcare', aliases: ['hipaa', 'patient privacy', 'medical records compliance'] },
  { canonical: 'Basic Life Support', category: 'Healthcare', aliases: ['bls', 'acls', 'cpr certified'] },
  { canonical: 'Medication Administration', category: 'Healthcare', aliases: ['pharmacology', 'dosage calculation', 'iv therapy'] },

  // --- CUSTOMER SERVICE & SUPPORT ---
  { canonical: 'Customer Support', category: 'Support', aliases: ['customer service', 'help desk', 'technical support', 'tier 1 support', 'tier 2 support'] },
  { canonical: 'Ticketing Systems', category: 'Support', aliases: ['zendesk', 'freshdesk', 'service now', 'jira service desk'] },
  { canonical: 'Call Center Operations', category: 'Support', aliases: ['inbound calls', 'csat', 'first contact resolution', 'sla management'] },

  // --- LEGAL & COMPLIANCE ---
  { canonical: 'Contract Negotiation', category: 'Legal', aliases: ['contract drafting', 'commercial agreements', 'ndas'] },
  { canonical: 'Regulatory Compliance', category: 'Legal', aliases: ['compliance audits', 'risk assessment', 'gdpr', 'data privacy'] },
  { canonical: 'Legal Research', category: 'Legal', aliases: ['westlaw', 'lexisnexis', 'statutory interpretation'] },

  // --- CORE PROFESSIONAL COMPETENCIES ---
  { canonical: 'Leadership', category: 'Professional', aliases: ['team leadership', 'people management', 'mentorship'] },
  { canonical: 'Cross-Functional Collaboration', category: 'Professional', aliases: ['teamwork', 'partner management', 'interpersonal skills'] },
  { canonical: 'Problem Solving', category: 'Professional', aliases: ['analytical thinking', 'root cause analysis', 'troubleshooting'] },
  { canonical: 'Written & Verbal Communication', category: 'Professional', aliases: ['public speaking', 'presentation skills', 'documentation'] },
  { canonical: 'Time Management', category: 'Professional', aliases: ['prioritization', 'multi-tasking', 'organizational skills'] },
];

/**
 * Fast normalize helper
 */
export function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Build fast lookup map for alias -> canonical skill
 */
const SKILL_MAP: Map<string, string> = new Map();
DOMAIN_SKILLS.forEach(item => {
  SKILL_MAP.set(normalizeKey(item.canonical), item.canonical);
  item.aliases.forEach(alias => {
    SKILL_MAP.set(normalizeKey(alias), item.canonical);
  });
});

/**
 * Check if a word or phrase corresponds to a standardized skill
 */
export function matchCanonicalSkill(input: string): string | null {
  const norm = normalizeKey(input);
  if (!norm || norm.length < 2) return null;
  return SKILL_MAP.get(norm) || null;
}
