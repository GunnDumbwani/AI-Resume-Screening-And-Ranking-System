import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  getAllUsers,
  saveAllUsers,
  getStats,
  incrementStats,
  createSession,
  validateSession,
  hashPassword,
  parseClientDetails,
  recordUserActivity,
  UserRecord
} from './server/auth';
import { parseJobDescriptionLocally, parseResumeLocally } from './src/lib/resumeParserEngine';

dotenv.config();

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashes if key is not configured
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback heuristic extractors in case Gemini key is absent or rate-limited
function fallbackExtractJD(text: string) {
  const clean = text.toLowerCase();
  
  // Extract years of experience
  let minExp = 0;
  const expMatch = clean.match(/(\d+)\+?\s*(?:-\s*(\d+)\s*)?(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/);
  if (expMatch) {
    minExp = parseInt(expMatch[1], 10) || 0;
  }

  // Common tech skills lookup
  const commonSkills = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'Java', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux',
    'HTML', 'CSS', 'Tailwind', 'REST API', 'GraphQL', 'Machine Learning',
    'TensorFlow', 'PyTorch', 'Data Structures', 'Algorithms', 'CI/CD',
    'Agile', 'Scrum', 'DevOps', 'Next.js', 'Vue.js', 'Redux', 'System Design'
  ];

  const matchedSkills: string[] = [];
  for (const s of commonSkills) {
    const regex = new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      matchedSkills.push(s);
    }
  }

  // Education level
  let eduReq = "Bachelor's degree in Computer Science or related field";
  if (/ph\.?d|doctorate/i.test(text)) eduReq = "Ph.D. degree in related technical field";
  else if (/master'?s|m\.?s|mtech|mca/i.test(text)) eduReq = "Master's degree in Computer Science or related field";
  else if (/high school|diploma/i.test(text)) eduReq = "High School Diploma or Associate's Degree";

  // Responsibilities
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
  const responsibilities = lines.slice(0, 5);

  return {
    title: text.split('\n')[0]?.substring(0, 80) || "Software Engineer",
    required_skills: matchedSkills.length > 0 ? matchedSkills.slice(0, 8) : ["Problem Solving", "Software Engineering"],
    preferred_skills: matchedSkills.slice(8, 12),
    min_experience_years: minExp,
    education_requirement: eduReq,
    responsibilities: responsibilities.length > 0 ? responsibilities : ["Develop and maintain software systems"]
  };
}

function fallbackExtractResume(text: string, filename: string, targetSkills: string[] = []) {
  const clean = text.toLowerCase();

  // Name extraction: first non-empty line or derived from filename
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = "Applicant";
  if (lines.length > 0 && lines[0].length < 50 && !/resume|curriculum|cv|email|phone|http/i.test(lines[0])) {
    name = lines[0].replace(/[^a-zA-Z\s]/g, '').trim() || name;
  } else {
    // derive from filename: "John_Doe_Resume.pdf" -> "John Doe"
    const cleanedFilename = filename.replace(/\.(pdf|docx|txt)$/i, '').replace(/[_-]/g, ' ').replace(/\bresume\b|\bcv\b/gi, '').trim();
    if (cleanedFilename.length > 2) {
      name = cleanedFilename.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Phone extraction
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Years of experience
  let expYears = 0;
  const expMatches = Array.from(text.matchAll(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/gi));
  if (expMatches.length > 0) {
    const nums = expMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n) && n < 40);
    if (nums.length > 0) expYears = Math.max(...nums);
  } else {
    // Check year ranges like 2018 - 2022
    const yearRangeMatches = Array.from(text.matchAll(/\b(20\d\d)\s*[-–—to]\s*(20\d\d|present|current)\b/gi));
    if (yearRangeMatches.length > 0) {
      let total = 0;
      const currentYear = new Date().getFullYear();
      for (const m of yearRangeMatches) {
        const start = parseInt(m[1], 10);
        const end = /present|current/i.test(m[2]) ? currentYear : parseInt(m[2], 10);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          total += (end - start);
        }
      }
      expYears = Math.min(30, Math.max(1, total));
    }
  }

  // Skills: combine common tech skills and any target skills passed from JD
  const skillPool = new Set([
    ...targetSkills,
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
    'Java', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux',
    'HTML', 'CSS', 'Tailwind', 'REST API', 'GraphQL', 'Machine Learning',
    'TensorFlow', 'PyTorch', 'Data Structures', 'Algorithms', 'CI/CD',
    'Agile', 'Scrum', 'DevOps', 'Next.js', 'Vue.js', 'Redux', 'System Design'
  ]);

  const matchedSkills: string[] = [];
  for (const s of skillPool) {
    if (!s || s.length < 2) continue;
    const regex = new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      matchedSkills.push(s);
    }
  }

  // Education
  let education = "Bachelor of Science in Computer Science";
  let educationLevel = "Bachelor";
  if (/ph\.?d|doctorate/i.test(text)) {
    education = "Doctor of Philosophy (Ph.D.)";
    educationLevel = "PhD";
  } else if (/master'?s|m\.?s|m\.?tech|mca/i.test(text)) {
    education = "Master of Science (M.S.)";
    educationLevel = "Master";
  } else if (/bachelor|b\.?s|b\.?tech|bca|b\.?e/i.test(text)) {
    education = "Bachelor of Technology / Science";
    educationLevel = "Bachelor";
  } else if (/associate|diploma/i.test(text)) {
    education = "Associate Degree / Diploma";
    educationLevel = "Diploma";
  } else if (/high school/i.test(text)) {
    education = "High School Diploma";
    educationLevel = "High School";
  }

  // Certifications
  const certs: string[] = [];
  if (/aws certified/i.test(text)) certs.push("AWS Certified");
  if (/azure certified/i.test(text)) certs.push("Microsoft Certified: Azure");
  if (/google cloud certified|gcp/i.test(text)) certs.push("Google Cloud Certified");
  if (/certified kubernetes|cka/i.test(text)) certs.push("Certified Kubernetes Administrator (CKA)");
  if (/scrum master|csm/i.test(text)) certs.push("Certified Scrum Master (CSM)");

  return {
    name,
    contact: [email, phone].filter(Boolean).join(" | ") || "Contact info provided in document",
    email,
    phone,
    skills: matchedSkills,
    education,
    education_level: educationLevel,
    experience_years: expYears,
    experience_summary: lines.slice(1, 6).join(' ').substring(0, 300) || "Experience in technical software development",
    certifications: certs
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Admin authorization middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const session = validateSession(token);
    if (!session || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const users = getAllUsers();
    const adminUser = users.find(u => u.id === session.userId && u.role === 'admin');
    if (!adminUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).admin = adminUser;
    next();
  };

  // --- Admin Authentication & Dashboard Endpoints ---
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const users = getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());

    // Security requirement:
    // If a normal user's credentials are entered:
    // → Do NOT log them into the admin dashboard
    // → Show a simple message such as: "Invalid admin credentials."
    // Do not reveal whether the email belongs to a normal user.
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const computedHash = hashPassword(String(password), user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    user.lastLogin = new Date().toISOString();
    saveAllUsers(users);

    const token = createSession(user.id, 'admin');
    return res.json({
      token,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  app.get('/api/admin/verify', requireAdmin, (req, res) => {
    const admin = (req as any).admin;
    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  });

  app.get('/api/admin/dashboard-data', requireAdmin, (req, res) => {
    const users = getAllUsers();
    const stats = getStats();

    const normalUsers = users.filter(u => u.role !== 'admin');
    const activeUsers = normalUsers.filter(u => u.status === 'Active');

    // Return sanitized users list with complete metadata
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      resumesAnalyzed: u.resumesAnalyzed || 0,
      status: u.status || 'Active',
      ip: u.ip || '127.0.0.1',
      device: u.device || 'Desktop',
      browser: u.browser || 'Chrome',
      os: u.os || 'Windows',
      source: u.source || 'direct'
    }));

    return res.json({
      stats: {
        totalUsers: normalUsers.length,
        activeUsers: activeUsers.length,
        totalResumesUploaded: stats.totalResumesUploaded,
        totalAnalysesCompleted: stats.totalAnalysesCompleted
      },
      users: sanitizedUsers
    });
  });

  app.post('/api/admin/update-user-status', requireAdmin, (req, res) => {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ error: 'userId and status are required' });
    }

    const users = getAllUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.role === 'admin') {
      return res.status(400).json({ error: 'Cannot alter primary admin status' });
    }

    target.status = status === 'Active' ? 'Active' : 'Inactive';
    saveAllUsers(users);
    return res.json({ ok: true, user: { id: target.id, status: target.status } });
  });

  // --- Real-time visitor / user tracking endpoint ---
  app.post('/api/track-visitor', (req, res) => {
    const { email, name, source } = req.body;
    const clientDetails = parseClientDetails(req);

    if (email && typeof email === 'string' && email.includes('@')) {
      const user = recordUserActivity(
        email,
        name,
        clientDetails,
        'user',
        source || 'visitor'
      );
      return res.json({ ok: true, user: { id: user.id, email: user.email } });
    }

    return res.json({ ok: true, clientDetails });
  });

  // --- Normal User Authentication Endpoints ---
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getAllUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const clientDetails = parseClientDetails(req);
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(String(password), salt);

    const newUser: UserRecord = {
      id: 'usr_' + crypto.randomUUID(),
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      salt,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      resumesAnalyzed: 0,
      status: 'Active',
      ip: clientDetails.ip,
      browser: clientDetails.browser,
      os: clientDetails.os,
      device: clientDetails.device,
      source: 'signup'
    };

    users.push(newUser);
    saveAllUsers(users);

    const token = createSession(newUser.id, 'user');
    return res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const clientDetails = parseClientDetails(req);
    const users = getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Auto-register candidate on first login if valid email & password provided,
      // so users on other PCs are NEVER locked out!
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(String(password), salt);
      const newUser: UserRecord = {
        id: 'usr_' + crypto.randomUUID(),
        name: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
        email: cleanEmail,
        passwordHash,
        salt,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        resumesAnalyzed: 0,
        status: 'Active',
        ip: clientDetails.ip,
        browser: clientDetails.browser,
        os: clientDetails.os,
        device: clientDetails.device,
        source: 'login'
      };

      users.push(newUser);
      saveAllUsers(users);

      const token = createSession(newUser.id, 'user');
      return res.json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    }

    if (user.passwordHash) {
      const computedHash = hashPassword(String(password), user.salt || '');
      if (computedHash !== user.passwordHash) {
        return res.status(401).json({ error: 'Incorrect password for this email address.' });
      }
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is currently inactive. Please contact administrator.' });
    }

    user.lastLogin = new Date().toISOString();
    user.ip = clientDetails.ip;
    user.browser = clientDetails.browser;
    user.os = clientDetails.os;
    user.device = clientDetails.device;
    saveAllUsers(users);

    const token = createSession(user.id, user.role);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  app.post('/api/auth/google', (req, res) => {
    const { email, name } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userName = name && String(name).trim() ? String(name).trim() : cleanEmail.split('@')[0];
    const clientDetails = parseClientDetails(req);

    const user = recordUserActivity(
      cleanEmail,
      userName,
      clientDetails,
      'user',
      'google'
    );

    const token = createSession(user.id, user.role);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  app.post('/api/user/record-analysis', (req, res) => {
    const { email, count } = req.body;
    const parsedCount = typeof count === 'number' ? count : 1;
    incrementStats(parsedCount, 1);

    if (email) {
      const clientDetails = parseClientDetails(req);
      const user = recordUserActivity(
        String(email),
        undefined,
        clientDetails,
        'user',
        'direct'
      );
      user.resumesAnalyzed = (user.resumesAnalyzed || 0) + parsedCount;
      const users = getAllUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = user;
        saveAllUsers(users);
      }
    }
    return res.json({ ok: true });
  });

  // Extract structured JD with fast timeout safeguard
  app.post('/api/extract-jd', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Job description text is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.json(parseJobDescriptionLocally(text));
    }

    try {
      const prompt = `Extract structured job requirements from this Job Description across any profession/industry (Technology, Healthcare, Finance, Marketing, Sales, Operations, Design, Legal, etc.):
"""
${text.substring(0, 5000)}
"""`;

      // 5 second timeout race so the user is never kept waiting
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('JD extraction timeout (5s)')), 5000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: "You extract structured hiring requirements into clean JSON. Extract the true domain skills specifically required for this role (not generic placeholders). Calculate the accurate minimum required years of experience.",
          responseMimeType: 'application/json',
          maxOutputTokens: 1000,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Job title or role name" },
              required_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of core mandatory skills required"
              },
              preferred_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of nice-to-have or preferred skills"
              },
              min_experience_years: {
                type: Type.NUMBER,
                description: "Minimum required professional experience in years"
              },
              education_requirement: {
                type: Type.STRING,
                description: "Degree or education qualification required"
              },
              responsibilities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key responsibilities"
              }
            },
            required: ["title", "required_skills", "min_experience_years", "education_requirement"]
          }
        }
      });

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      const reqSkills = Array.isArray(parsed.required_skills) && parsed.required_skills.length > 0
        ? parsed.required_skills
        : parseJobDescriptionLocally(text).required_skills;

      return res.json({
        title: parsed.title || parseJobDescriptionLocally(text).title,
        required_skills: reqSkills,
        preferred_skills: Array.isArray(parsed.preferred_skills) ? parsed.preferred_skills : [],
        min_experience_years: typeof parsed.min_experience_years === 'number' ? parsed.min_experience_years : parseJobDescriptionLocally(text).min_experience_years,
        education_requirement: parsed.education_requirement || parseJobDescriptionLocally(text).education_requirement,
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : []
      });
    } catch (err: any) {
      console.warn('Gemini JD Extraction timed out or failed, using multi-domain local parser:', err?.message || err);
      return res.json(parseJobDescriptionLocally(text));
    }
  });

  // Extract structured resume data with fast timeout safeguard
  app.post('/api/extract-resume', async (req, res) => {
    const { text, filename, jdSkills } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.json(parseResumeLocally(text, filename || 'candidate_resume.pdf', Array.isArray(jdSkills) ? jdSkills : []));
    }

    try {
      const prompt = `Extract structured candidate profile from this resume:
Filename: ${filename || 'resume.pdf'}

Target Job Skills: ${(Array.isArray(jdSkills) ? jdSkills : []).join(', ')}

Resume Text:
"""
${text.substring(0, 4500)}
"""`;

      // 4.5 second timeout race so batch processing never hangs
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI extraction timed out after 4.5s')), 4500)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an automated resume parsing specialist. Extract candidate details accurately into JSON. Extract only skills genuinely present in this resume. For education_level specify: 'PhD', 'Master', 'Bachelor', 'Diploma', 'High School', or 'Unknown'. Calculate total years of experience accurately.",
          responseMimeType: 'application/json',
          maxOutputTokens: 800,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full candidate name" },
              contact: { type: Type.STRING, description: "Contact summary" },
              email: { type: Type.STRING, description: "Email address" },
              phone: { type: Type.STRING, description: "Phone number" },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of skills present in this resume"
              },
              education: { type: Type.STRING, description: "Highest degree and school" },
              education_level: {
                type: Type.STRING,
                description: "Normalized level: PhD, Master, Bachelor, Diploma, High School, or Unknown"
              },
              experience_years: {
                type: Type.NUMBER,
                description: "Total years of relevant experience"
              },
              experience_summary: {
                type: Type.STRING,
                description: "Brief summary of work history"
              },
              certifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of certifications"
              }
            },
            required: ["name", "skills", "education", "experience_years"]
          }
        }
      });

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        name: parsed.name || filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' '),
        contact: parsed.contact || parsed.email || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
          ? parsed.skills
          : parseResumeLocally(text, filename || 'candidate_resume.pdf', Array.isArray(jdSkills) ? jdSkills : []).skills,
        education: parsed.education || "Not specified",
        education_level: parsed.education_level || "Bachelor",
        experience_years: typeof parsed.experience_years === 'number' ? parsed.experience_years : 0,
        experience_summary: parsed.experience_summary || "",
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : []
      });
    } catch (err: any) {
      console.warn(`Gemini extraction for ${filename} timed out or failed, using multi-domain parser:`, err?.message || err);
      return res.json(parseResumeLocally(text, filename || 'candidate_resume.pdf', Array.isArray(jdSkills) ? jdSkills : []));
    }
  });

  // Fast concurrent embeddings with 2.5 second timeout safeguard
  app.post('/api/embed', async (req, res) => {
    const { texts } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Array of texts is required' });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({ embeddings: [] });
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding calculation timeout (2.5s)')), 2500)
      );

      // Process in parallel instead of slow sequential loop!
      const embedPromises = texts.slice(0, 10).map(async (t) => {
        const result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: t.substring(0, 1000),
        });
        return (result as any).embedding?.values || (result as any).embeddings?.[0]?.values || [];
      });

      const embeddings = await Promise.race([
        Promise.all(embedPromises),
        timeoutPromise
      ]);

      return res.json({ embeddings });
    } catch (err: any) {
      console.info('Embeddings skipped due to timeout or network, falling back to deterministic textual similarity:', err?.message || err);
      return res.json({ embeddings: [] });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
