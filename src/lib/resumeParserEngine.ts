/**
 * High-Speed Multi-Domain ATS Parser & Information Extraction Engine
 * Provides accurate entity extraction, date analysis, and robust skill detection
 * across all formats (C++, C#, .NET, Node.js, Python, Healthcare, Finance, etc.)
 */

import { JobDescription, ExtractedResume, EducationLevel } from '../types';
import { DOMAIN_SKILLS, matchCanonicalSkill } from './domainSkills';

/**
 * Clean and normalize text from documents
 */
export function cleanDocumentText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function escapeRegex(string: string): string {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Robust skill presence checker in text that reliably handles special chars
 * like C++, C#, .NET, Node.js, CI/CD, React.js, and prevents false positives
 * (e.g., 'Java' in 'JavaScript' or single letters like 'R' and 'Go')
 */
export function matchesSkillInText(skill: string, text: string): boolean {
  if (!skill || !text) return false;
  const s = skill.trim();
  if (s.length === 0) return false;

  // Single letter skills require strict word/punctuation isolation
  if (s.toUpperCase() === 'R') {
    return /\b[Rr]\b(?!\w|\/|#|\+)/.test(text) && !/r&d|r\s*&\s*d/i.test(text);
  }
  if (s.toUpperCase() === 'C') {
    return /\b[Cc]\b(?!\w|\/|#|\+)/.test(text);
  }
  if (s.toLowerCase() === 'go') {
    return /\b(?:Golang|Go\s+language|Go\s+developer|Go\s+backend)\b/i.test(text) ||
      /(?<=\bprogramming\s+in\s+|\bskills?:\s*.*?\b)Go(?=[,\s]|$)/i.test(text);
  }

  // Skills ending with symbols like C++ or C#
  if (/(\+\+|#)$/.test(s)) {
    const escaped = escapeRegex(s);
    const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?=[^a-zA-Z0-9_#+]|$)`, 'i');
    return pattern.test(text);
  }

  // Skills starting with symbols like .NET
  if (/^\./.test(s)) {
    const escaped = escapeRegex(s);
    const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?=[^a-zA-Z0-9_]|$)|\\bdotnet\\b`, 'i');
    return pattern.test(text);
  }

  // Standard skills with boundary
  const escaped = escapeRegex(s);
  const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?=[^a-zA-Z0-9_]|$)`, 'i');
  return pattern.test(text);
}

/**
 * Extract Job Title from JD text
 */
function extractJobTitle(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Look for explicit title tags: "Job Title: Senior Product Manager"
  for (const line of lines.slice(0, 10)) {
    const titleMatch = line.match(/(?:job title|position|role|title)\s*[:\-–]\s*(.+)/i);
    if (titleMatch && titleMatch[1].trim().length > 3) {
      return titleMatch[1].trim().substring(0, 70);
    }
  }

  // 2. Look at top 3 lines if clean and concise
  for (const line of lines.slice(0, 4)) {
    if (
      line.length >= 4 &&
      line.length <= 60 &&
      !/summary|about us|company|description|responsibilities|qualifications|http/i.test(line)
    ) {
      return line;
    }
  }

  return 'Target Job Role';
}

/**
 * Extract minimum required years of experience
 */
function extractMinExperience(text: string): number {
  const clean = text.toLowerCase();
  
  const patterns = [
    /(?:minimum|at least)\s+(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/i,
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience|\s+working|\s+in\s+)/i,
    /experience\s*[:\-–]\s*(\d+)\+?\s*(?:years?|yrs?)/i
  ];

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 25) {
        return num;
      }
    }
  }

  return 0;
}

/**
 * Extract education requirement
 */
function extractEducationRequirement(text: string): string {
  const clean = text.toLowerCase();
  if (/ph\.?d|doctorate|doctoral/i.test(clean)) {
    return "Ph.D. or Doctorate in relevant field";
  }
  if (/master'?s|m\.?s|m\.?tech|mba|mca|post-?graduate/i.test(clean)) {
    return "Master's degree (M.S. / MBA / M.Tech) or equivalent";
  }
  if (/bachelor'?s|b\.?s|b\.?tech|bca|b\.?e|undergraduate|degree/i.test(clean)) {
    return "Bachelor's degree or equivalent practical experience";
  }
  if (/associate|diploma/i.test(clean)) {
    return "Associate Degree or Technical Diploma";
  }
  if (/high school/i.test(clean)) {
    return "High School Diploma or equivalent";
  }
  return "Bachelor's degree in related field or equivalent experience";
}

/**
 * Dynamically extract skills from any Job Description across all domains
 */
export function extractSkillsFromJD(text: string): { required: string[]; preferred: string[] } {
  const detectedSkills = new Set<string>();
  const preferredSkills = new Set<string>();
  const cleanText = text.toLowerCase();

  // 1. Scan against the comprehensive multi-domain skill dictionary
  for (const skillDef of DOMAIN_SKILLS) {
    let matched = matchesSkillInText(skillDef.canonical, text);

    if (!matched) {
      for (const alias of skillDef.aliases) {
        if (alias.length < 2) continue;
        if (matchesSkillInText(alias, text)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      const skillIdx = cleanText.indexOf(skillDef.canonical.toLowerCase());
      const precedingText = skillIdx > 0 ? cleanText.substring(Math.max(0, skillIdx - 200), skillIdx) : '';
      
      if (/preferred|nice to have|plus|bonus|optional|advantageous/i.test(precedingText)) {
        preferredSkills.add(skillDef.canonical);
      } else {
        detectedSkills.add(skillDef.canonical);
      }
    }
  }

  // 2. Dynamic extraction from bullet points in "Requirements" or "Qualifications"
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let isInReqSection = false;
  let isInPrefSection = false;

  for (const line of lines) {
    if (/requirements|qualifications|what you need|must have|skills required|technical skills/i.test(line)) {
      isInReqSection = true;
      isInPrefSection = false;
      continue;
    }
    if (/preferred|nice to have|bonus points|optional/i.test(line)) {
      isInPrefSection = true;
      isInReqSection = false;
      continue;
    }
    if (/benefits|about us|perks|compensation|how to apply|location/i.test(line)) {
      isInReqSection = false;
      isInPrefSection = false;
    }

    if (isInReqSection || isInPrefSection) {
      const bulletMatch = line.match(/^[-*•]\s*(.+)/);
      if (bulletMatch) {
        const item = bulletMatch[1].trim();
        const words = item.split(/[,;&\/]|\band\b/i).map(w => w.trim());
        for (const w of words) {
          const canonical = matchCanonicalSkill(w);
          if (canonical) {
            if (isInPrefSection) preferredSkills.add(canonical);
            else detectedSkills.add(canonical);
          } else if (w.length >= 3 && w.length <= 25 && /^[A-Z][a-zA-Z0-9\s.+#]+$/.test(w)) {
            if (isInPrefSection) preferredSkills.add(w);
            else detectedSkills.add(w);
          }
        }
      }
    }
  }

  const reqList = Array.from(detectedSkills);
  const prefList = Array.from(preferredSkills).filter(s => !detectedSkills.has(s));

  if (reqList.length === 0) {
    const candidateTerms = lines
      .filter(l => l.length > 10 && l.length < 80)
      .slice(0, 6)
      .map(l => l.replace(/^[-*•0-9.)\s]+/, '').trim());
    
    return {
      required: candidateTerms.length > 0 ? candidateTerms.slice(0, 5) : ['Core Professional Expertise', 'Technical Competence'],
      preferred: prefList
    };
  }

  return {
    required: reqList.slice(0, 14),
    preferred: prefList.slice(0, 6)
  };
}

/**
 * Parse full Job Description directly from text with high domain fidelity
 */
export function parseJobDescriptionLocally(text: string): JobDescription {
  const clean = cleanDocumentText(text);
  const title = extractJobTitle(clean);
  const minExp = extractMinExperience(clean);
  const eduReq = extractEducationRequirement(clean);
  const { required, preferred } = extractSkillsFromJD(clean);

  const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 25);
  const responsibilities = lines.slice(0, 5);

  return {
    title,
    raw_text: text,
    required_skills: required,
    preferred_skills: preferred,
    min_experience_years: minExp,
    education_requirement: eduReq,
    responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute core deliverables for this position']
  };
}

/**
 * Extract Candidate Name from resume text or filename
 */
function extractCandidateName(text: string, filename: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines.slice(0, 6)) {
    if (
      /^(curriculum vitae|resume|cv|contact|email|phone|profile|summary|address|page \d|http)/i.test(line) ||
      line.includes('@') ||
      line.includes('www.') ||
      line.length > 45 ||
      line.length < 3
    ) {
      continue;
    }

    const cleanLine = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
    const words = cleanLine.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => w.length >= 2)) {
      return cleanLine;
    }
  }

  // Fallback: derive cleanly from filename
  const baseName = filename
    .replace(/\.(pdf|docx|txt)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b(resume|cv|curriculum|vitae|updated|latest|profile|final|2023|2024|2025|2026)\b/gi, '')
    .trim();

  if (baseName.length >= 3) {
    return baseName
      .split(/\s+/)
      .slice(0, 3)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Candidate';
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : '';
}

/**
 * Extract candidate education level and degree summary
 */
function extractCandidateEducation(text: string): { education: string; level: EducationLevel } {
  const clean = text.toLowerCase();

  if (/ph\.?d|doctorate|doctoral/i.test(clean)) {
    return { education: 'Doctor of Philosophy (Ph.D.)', level: 'PhD' };
  }
  if (/master'?s|m\.?s\b|m\.?tech|mba\b|mca\b|m\.?sc\b|m\.?e\b|post graduate/i.test(clean)) {
    return { education: "Master's Degree (M.S. / MBA / M.Tech)", level: 'Master' };
  }
  if (/bachelor|b\.?s\b|b\.?tech|bca\b|b\.?e\b|b\.?sc\b|b\.?com|bba|undergraduate|degree in/i.test(clean)) {
    return { education: "Bachelor's Degree", level: 'Bachelor' };
  }
  if (/associate|diploma|polytechnic/i.test(clean)) {
    return { education: 'Associate Degree / Diploma', level: 'Diploma' };
  }
  if (/high school|secondary school|12th/i.test(clean)) {
    return { education: 'High School Diploma', level: 'High School' };
  }

  return { education: 'Not specified', level: 'Unknown' };
}

/**
 * Parse month name or abbreviation to 0-indexed number
 */
function parseMonth(str: string): number {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const clean = str.toLowerCase().slice(0, 3);
  const idx = months.indexOf(clean);
  return idx !== -1 ? idx : 0;
}

/**
 * Extract candidate years of experience accurately from employment timelines and keywords
 * Handles:
 * - "Jan 2019 - Present"
 * - "March 2018 - July 2022"
 * - "05/2019 - 08/2023"
 * - "2018 - 2024"
 * - "5+ years of experience"
 */
function extractCandidateExperience(text: string): number {
  const clean = text.toLowerCase();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthRegex = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  
  // Pattern 1: Month Year - Month Year / Present
  // e.g. "June 2018 - Present" or "Jan 2019 to Aug 2023"
  const monthYearRangeRegex = new RegExp(
    `(${monthRegex})?\\s*([12]\\d{3})\\s*[-–—to]+\\s*(${monthRegex})?\\s*([12]\\d{3}|present|current|ongoing|now)`,
    'gi'
  );

  // Pattern 2: MM/YYYY - MM/YYYY or MM/YYYY - Present
  const slashDateRegex = /(\d{1,2})\/([12]\d{3})\s*[-–—to]+\s*(?:(\d{1,2})\/)?([12]\d{3}|present|current|ongoing)/gi;

  // Pattern 3: Simple YYYY - YYYY / Present
  const simpleYearRegex = /\b([12]\d{3})\s*[-–—to]\s*([12]\d{3}|present|current|ongoing)\b/gi;

  const intervals: Array<{ startMonth: number; endMonth: number }> = [];

  // Match Pattern 1
  for (const m of clean.matchAll(monthYearRangeRegex)) {
    const startM = m[1] ? parseMonth(m[1]) : 0;
    const startY = parseInt(m[2], 10);
    const endStr = m[4].toLowerCase();
    const isPresent = /present|current|ongoing|now/.test(endStr);
    const endY = isPresent ? currentYear : parseInt(endStr, 10);
    const endM = isPresent ? currentMonth : (m[3] ? parseMonth(m[3]) : 11);

    if (startY >= 1980 && endY <= currentYear + 1 && (endY > startY || (endY === startY && endM >= startM))) {
      intervals.push({
        startMonth: startY * 12 + startM,
        endMonth: endY * 12 + endM
      });
    }
  }

  // Match Pattern 2
  for (const m of clean.matchAll(slashDateRegex)) {
    const startM = parseInt(m[1], 10) - 1;
    const startY = parseInt(m[2], 10);
    const endStr = m[4].toLowerCase();
    const isPresent = /present|current|ongoing/.test(endStr);
    const endY = isPresent ? currentYear : parseInt(endStr, 10);
    const endM = isPresent ? currentMonth : (m[3] ? parseInt(m[3], 10) - 1 : 11);

    if (startY >= 1980 && endY <= currentYear + 1 && (endY > startY || (endY === startY && endM >= startM))) {
      intervals.push({
        startMonth: startY * 12 + startM,
        endMonth: endY * 12 + endM
      });
    }
  }

  // Match Pattern 3
  for (const m of clean.matchAll(simpleYearRegex)) {
    const startY = parseInt(m[1], 10);
    const isPresent = /present|current|ongoing/.test(m[2]);
    const endY = isPresent ? currentYear : parseInt(m[2], 10);

    if (startY >= 1980 && endY <= currentYear + 1 && endY >= startY) {
      intervals.push({
        startMonth: startY * 12,
        endMonth: endY * 12 + 11
      });
    }
  }

  // Merge intervals to avoid overlapping roles
  if (intervals.length > 0) {
    intervals.sort((a, b) => a.startMonth - b.startMonth);
    let totalMonths = 0;
    let currStart = intervals[0].startMonth;
    let currEnd = intervals[0].endMonth;

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].startMonth <= currEnd) {
        currEnd = Math.max(currEnd, intervals[i].endMonth);
      } else {
        totalMonths += (currEnd - currStart + 1);
        currStart = intervals[i].startMonth;
        currEnd = intervals[i].endMonth;
      }
    }
    totalMonths += (currEnd - currStart + 1);

    const calculatedYears = Math.round((totalMonths / 12) * 10) / 10;
    if (calculatedYears >= 0.5) {
      return Math.min(35, Math.round(calculatedYears));
    }
  }

  // 2. Look for explicit statement: "7+ years of experience"
  const expStatement = clean.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience|\s+working)/i);
  if (expStatement) {
    const num = parseInt(expStatement[1], 10);
    if (!isNaN(num) && num > 0 && num <= 35) {
      return num;
    }
  }

  return 0;
}

/**
 * Extract genuine candidate skills by scanning the resume text against:
 * 1) The target JD required skills
 * 2) The comprehensive multi-domain skill dictionary
 */
export function extractCandidateSkills(text: string, jdRequiredSkills: string[] = []): string[] {
  const foundSkills = new Set<string>();

  // 1. Check all target JD skills against this resume
  for (const target of jdRequiredSkills) {
    if (!target || target.length < 2) continue;
    if (matchesSkillInText(target, text)) {
      foundSkills.add(target);
    } else {
      // Check aliases of target skill
      const canonical = matchCanonicalSkill(target);
      if (canonical) {
        const def = DOMAIN_SKILLS.find(d => d.canonical.toLowerCase() === canonical.toLowerCase());
        if (def) {
          for (const alias of def.aliases) {
            if (matchesSkillInText(alias, text)) {
              foundSkills.add(target);
              break;
            }
          }
        }
      }
    }
  }

  // 2. Check the global domain dictionary
  for (const skillDef of DOMAIN_SKILLS) {
    if (matchesSkillInText(skillDef.canonical, text)) {
      foundSkills.add(skillDef.canonical);
      continue;
    }

    for (const alias of skillDef.aliases) {
      if (alias.length < 2) continue;
      if (matchesSkillInText(alias, text)) {
        foundSkills.add(skillDef.canonical);
        break;
      }
    }
  }

  return Array.from(foundSkills);
}

/**
 * Extract industry certifications
 */
function extractCertifications(text: string): string[] {
  const certs: string[] = [];
  const checks: Array<{ name: string; pattern: RegExp }> = [
    { name: 'AWS Certified', pattern: /\baws certified\b/i },
    { name: 'Microsoft Azure Certified', pattern: /\bazure certified\b/i },
    { name: 'Google Cloud Certified', pattern: /\bgoogle cloud certified\b|\bgcp certified\b/i },
    { name: 'Certified Kubernetes Administrator (CKA)', pattern: /\bcka\b|\bcertified kubernetes administrator\b/i },
    { name: 'Project Management Professional (PMP)', pattern: /\bpmp\b|\bproject management professional\b/i },
    { name: 'Certified Scrum Master (CSM)', pattern: /\bcsm\b|\bcertified scrum master\b/i },
    { name: 'Certified Public Accountant (CPA)', pattern: /\bcpa\b|\bcertified public accountant\b/i },
    { name: 'Chartered Financial Analyst (CFA)', pattern: /\bcfa\b|\bchartered financial analyst\b/i },
    { name: 'SHRM-CP / SHRM-SCP', pattern: /\bshrm\b|\bshrm-cp\b|\bshrm-scp\b/i },
    { name: 'Registered Nurse (RN)', pattern: /\bregistered nurse\b|\brn license\b/i },
    { name: 'Six Sigma Green / Black Belt', pattern: /\bsix sigma\b|\bblack belt\b|\bgreen belt\b/i },
    { name: 'Salesforce Certified', pattern: /\bsalesforce certified\b/i },
  ];

  for (const check of checks) {
    if (check.pattern.test(text)) {
      certs.push(check.name);
    }
  }

  return certs;
}

/**
 * High-speed, high-fidelity resume extraction
 */
export function parseResumeLocally(
  text: string,
  filename: string,
  jdRequiredSkills: string[] = []
): Omit<ExtractedResume, 'id' | 'filename' | 'parse_status' | 'raw_text'> {
  const clean = cleanDocumentText(text);
  const name = extractCandidateName(clean, filename);
  const email = extractEmail(clean);
  const phone = extractPhone(clean);
  const { education, level } = extractCandidateEducation(clean);
  const expYears = extractCandidateExperience(clean);
  const skills = extractCandidateSkills(clean, jdRequiredSkills);
  const certs = extractCertifications(clean);

  // Summary
  const lines = clean.split('\n').filter(l => l.length > 20 && !l.includes('@'));
  const summary = lines.slice(0, 3).join('. ').substring(0, 260) || 'Experienced professional with verified background';

  return {
    name,
    contact: [email, phone].filter(Boolean).join(' | ') || 'Extracted from resume',
    email,
    phone,
    skills,
    education,
    education_level: level,
    experience_years: expYears,
    experience_summary: summary,
    certifications: certs
  };
}
