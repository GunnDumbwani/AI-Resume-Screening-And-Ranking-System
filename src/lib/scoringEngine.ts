import {
  JobDescription,
  ExtractedResume,
  CandidateScore,
  RankedCandidate,
  ScoringWeights,
  MatchExplanation,
  EducationLevel
} from '../types';
import { DOMAIN_SKILLS } from './domainSkills';
import { matchesSkillInText } from './resumeParserEngine';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  skills: 0.50,
  experience: 0.30,
  education: 0.20,
};

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9#+.]/g, '').trim();
}

// Build comprehensive multi-domain alias index from knowledge base
const SKILL_ALIASES: Record<string, string[]> = {};
for (const item of DOMAIN_SKILLS) {
  const normCanonical = normalizeSkill(item.canonical);
  const normAliases = item.aliases.map(normalizeSkill);
  
  const allRelated = [normCanonical, ...normAliases];
  for (const variant of allRelated) {
    if (!SKILL_ALIASES[variant]) {
      SKILL_ALIASES[variant] = [];
    }
    for (const other of allRelated) {
      if (other !== variant && !SKILL_ALIASES[variant].includes(other)) {
        SKILL_ALIASES[variant].push(other);
      }
    }
  }
}

function findEvidenceInText(skill: string, rawText: string): string | undefined {
  if (!rawText || !skill) return undefined;
  const lines = rawText.split('\n');

  // Look for line containing the skill
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && matchesSkillInText(skill, trimmed)) {
      return trimmed.length > 160 ? trimmed.substring(0, 160) + '...' : trimmed;
    }
  }

  // Next look for alias matches
  const normTarget = normalizeSkill(skill);
  const aliases = SKILL_ALIASES[normTarget] || [];
  for (const alias of aliases) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && matchesSkillInText(alias, trimmed)) {
        return trimmed.length > 160 ? trimmed.substring(0, 160) + '...' : trimmed;
      }
    }
  }

  return undefined;
}

export function checkSkillMatch(skill: string, candidateSkills: string[], rawText: string): { matched: boolean; evidence?: string } {
  const normTarget = normalizeSkill(skill);
  const aliases = SKILL_ALIASES[normTarget] || [];

  // Check candidate extracted skills
  for (const cs of candidateSkills) {
    const normCs = normalizeSkill(cs);
    if (normCs === normTarget || aliases.includes(normCs) || matchesSkillInText(skill, cs)) {
      const evidence = findEvidenceInText(skill, rawText) || `Verified in Candidate Skills: "${cs}"`;
      return { matched: true, evidence };
    }
  }

  // Check in candidate raw resume text directly using robust regex
  if (matchesSkillInText(skill, rawText)) {
    const evidence = findEvidenceInText(skill, rawText) || `Found in candidate resume text`;
    return { matched: true, evidence };
  }

  // Check aliases directly in text
  for (const alias of aliases) {
    if (matchesSkillInText(alias, rawText)) {
      const evidence = findEvidenceInText(alias, rawText) || `Found variant "${alias}" in candidate resume text`;
      return { matched: true, evidence };
    }
  }

  return { matched: false };
}

// Education level scoring hierarchy
const EDU_TIERS: Record<EducationLevel, number> = {
  'PhD': 5,
  'Master': 4,
  'Bachelor': 3,
  'Diploma': 2,
  'High School': 1,
  'Unknown': 0
};

export function getEducationTier(eduStr: string): { level: EducationLevel; rank: number } {
  const clean = (eduStr || '').toLowerCase();
  if (/ph\.?d|doctorate|doctoral/i.test(clean)) return { level: 'PhD', rank: 5 };
  if (/master'?s|m\.?s\b|m\.?tech|mca|mba|m\.?sc|m\.?e|post graduate/i.test(clean)) return { level: 'Master', rank: 4 };
  if (/bachelor|b\.?s\b|b\.?tech|bca|b\.?e\b|b\.?sc|b\.?com|bba|undergraduate|degree in/i.test(clean)) return { level: 'Bachelor', rank: 3 };
  if (/associate|diploma|polytechnic/i.test(clean)) return { level: 'Diploma', rank: 2 };
  if (/high school|secondary|12th|hsc/i.test(clean)) return { level: 'High School', rank: 1 };
  return { level: 'Unknown', rank: 0 };
}

// Cosine similarity between two numerical vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Text Jaccard & N-gram semantic proxy when embeddings are not available
export function computeTextSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(textB.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  wordsA.forEach(w => {
    if (wordsB.has(w)) intersection++;
  });

  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? (intersection / union) : 0;
}

export function computeCandidateScore(
  candidate: ExtractedResume,
  jd: JobDescription,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  candidateEmbedding?: number[],
  jdEmbedding?: number[]
): CandidateScore {
  const matchExplanations: MatchExplanation[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  const requiredSkills = jd.required_skills.length > 0 ? jd.required_skills : ['General Engineering'];
  
  // 1. Skill Overlap & Explanations
  for (const reqSkill of requiredSkills) {
    const match = checkSkillMatch(reqSkill, candidate.skills, candidate.raw_text);
    if (match.matched) {
      matchedSkills.push(reqSkill);
      matchExplanations.push({
        category: 'skill',
        requirement: reqSkill,
        candidate_value: 'Matched',
        status: 'matched',
        evidence: match.evidence,
        score_impact: `+${(100 / requiredSkills.length).toFixed(1)}% to keyword overlap`
      });
    } else {
      missingSkills.push(reqSkill);
      matchExplanations.push({
        category: 'skill',
        requirement: reqSkill,
        candidate_value: 'Not found',
        status: 'missing',
        evidence: 'Skill was not detected in candidate profile or resume body',
        score_impact: `0% credit for this requirement`
      });
    }
  }

  // Keyword overlap percentage
  let keywordOverlapScore = Math.min(100, Math.round((matchedSkills.length / requiredSkills.length) * 100));

  // Small bonus for preferred skills (up to +5%)
  if (jd.preferred_skills && jd.preferred_skills.length > 0) {
    let prefMatched = 0;
    for (const pref of jd.preferred_skills) {
      if (checkSkillMatch(pref, candidate.skills, candidate.raw_text).matched) {
        prefMatched++;
      }
    }
    if (prefMatched > 0) {
      const bonus = Math.min(5, Math.round((prefMatched / jd.preferred_skills.length) * 5));
      keywordOverlapScore = Math.min(100, keywordOverlapScore + bonus);
    }
  }

  // 2. Semantic Similarity Score
  let semanticScore = 0;
  if (candidateEmbedding && jdEmbedding && candidateEmbedding.length > 0 && jdEmbedding.length > 0) {
    const cosSim = cosineSimilarity(candidateEmbedding, jdEmbedding);
    // Typical text embeddings range from 0.40 (unrelated) to 0.90+ (highly aligned)
    // Scale 0.40 -> 0.90 onto 0 -> 100%
    const normalized = Math.max(0, Math.min(100, ((cosSim - 0.40) / 0.50) * 100));
    semanticScore = Math.round(normalized);
  } else {
    // Deterministic client-side textual n-gram / Jaccard semantic proxy
    const candidateSummary = `${candidate.skills.join(' ')} ${candidate.experience_summary} ${candidate.education}`;
    const jdSummary = `${jd.required_skills.join(' ')} ${jd.responsibilities.join(' ')}`;
    const jaccard = computeTextSimilarity(candidateSummary, jdSummary);
    // Jaccard word similarity scales: 0.15 - 0.45 is strong overlap
    semanticScore = Math.min(100, Math.round((jaccard / 0.35) * 100));
  }

  // Combined Skills Match = 60% Keyword Overlap + 40% Semantic Similarity
  const skillsMatch = Math.round(0.60 * keywordOverlapScore + 0.40 * semanticScore);

  // 3. Experience Match
  let expMatch = 0;
  const minReqExp = jd.min_experience_years || 0;
  const candExp = candidate.experience_years || 0;

  if (minReqExp === 0) {
    expMatch = 100;
    matchExplanations.push({
      category: 'experience',
      requirement: 'No minimum experience specified',
      candidate_value: `${candExp} year${candExp === 1 ? '' : 's'}`,
      status: 'matched',
      evidence: candidate.experience_summary || `Candidate has ${candExp} years of recorded experience`,
      score_impact: '100% experience match'
    });
  } else if (candExp >= minReqExp) {
    expMatch = 100;
    const surplus = candExp - minReqExp;
    matchExplanations.push({
      category: 'experience',
      requirement: `${minReqExp}+ years required`,
      candidate_value: `${candExp} years`,
      status: 'matched',
      evidence: candidate.experience_summary || `Candidate meets or exceeds requirement by ${surplus} year${surplus === 1 ? '' : 's'}`,
      score_impact: '100% experience credit'
    });
  } else {
    // Partial credit proportional to experience ratio
    expMatch = Math.min(90, Math.round((candExp / minReqExp) * 100));
    matchExplanations.push({
      category: 'experience',
      requirement: `${minReqExp}+ years required`,
      candidate_value: `${candExp} years`,
      status: 'partial',
      evidence: `Candidate possesses ${candExp} of ${minReqExp} required years (${expMatch}% partial credit)`,
      score_impact: `${expMatch}% partial experience credit`
    });
  }

  // 4. Education Match
  const jdEdu = getEducationTier(jd.education_requirement);
  const candEdu = getEducationTier(candidate.education || candidate.education_level);
  let eduMatch = 0;

  if (jdEdu.rank === 0 || candEdu.rank >= jdEdu.rank) {
    eduMatch = 100;
    matchExplanations.push({
      category: 'education',
      requirement: jd.education_requirement || "Bachelor's degree or equivalent",
      candidate_value: candidate.education || `${candEdu.level} Degree`,
      status: 'matched',
      evidence: `Candidate meets or exceeds education requirement (${candEdu.level} >= ${jdEdu.level})`,
      score_impact: '100% education credit'
    });
  } else if (candEdu.rank === jdEdu.rank - 1) {
    // One tier below (e.g. Bachelor's when Master's requested, or Diploma when Bachelor's requested)
    eduMatch = 75;
    matchExplanations.push({
      category: 'education',
      requirement: jd.education_requirement,
      candidate_value: candidate.education || `${candEdu.level} Degree`,
      status: 'partial',
      evidence: `Candidate holds a ${candEdu.level}, which is one qualification tier below ${jdEdu.level}`,
      score_impact: '75% partial credit'
    });
  } else if (candEdu.rank > 0) {
    eduMatch = 50;
    matchExplanations.push({
      category: 'education',
      requirement: jd.education_requirement,
      candidate_value: candidate.education || `${candEdu.level} Degree`,
      status: 'partial',
      evidence: `Candidate holds ${candEdu.level}, lower than the expected ${jdEdu.level}`,
      score_impact: '50% partial credit'
    });
  } else {
    eduMatch = 30;
    matchExplanations.push({
      category: 'education',
      requirement: jd.education_requirement,
      candidate_value: 'Unspecified or non-standard education',
      status: 'missing',
      evidence: 'No verified academic degree information found in document',
      score_impact: '30% baseline credit'
    });
  }

  // Certifications highlight if any
  if (candidate.certifications && candidate.certifications.length > 0) {
    matchExplanations.push({
      category: 'certification',
      requirement: 'Relevant Industry Certifications',
      candidate_value: candidate.certifications.join(', '),
      status: 'matched',
      evidence: `Verified credentials: ${candidate.certifications.join('; ')}`,
      score_impact: 'Positive profile factor'
    });
  }

  // 5. Overall Weighted Sum
  const rawWeighted = (weights.skills * skillsMatch) + (weights.experience * expMatch) + (weights.education * eduMatch);
  const overallScore = Math.max(0, Math.min(100, Math.round(rawWeighted * 10) / 10));

  const formulaBreakdown = `(${weights.skills.toFixed(2)} × ${skillsMatch}) + (${weights.experience.toFixed(2)} × ${expMatch}) + (${weights.education.toFixed(2)} × ${eduMatch}) = ${overallScore.toFixed(1)}`;

  return {
    resume_id: candidate.id,
    overall_score: overallScore,
    breakdown: {
      skills_match: skillsMatch,
      keyword_overlap_score: keywordOverlapScore,
      semantic_similarity_score: semanticScore,
      experience_match: expMatch,
      education_match: eduMatch,
    },
    weights,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    match_explanations: matchExplanations,
    formula_breakdown: formulaBreakdown,
  };
}

// Identify duplicates across candidate pool
export function detectDuplicates(candidates: ExtractedResume[]): ExtractedResume[] {
  const emailMap = new Map<string, string>();
  const phoneMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  return candidates.map(c => {
    let isDup = false;
    let dupOf = '';
    let reason = '';

    const cleanEmail = (c.email || '').trim().toLowerCase();
    const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
    const cleanName = (c.name || '').trim().toLowerCase();

    if (cleanEmail && cleanEmail.length > 5) {
      if (emailMap.has(cleanEmail)) {
        isDup = true;
        dupOf = emailMap.get(cleanEmail)!;
        reason = `Matching candidate email (${cleanEmail})`;
      } else {
        emailMap.set(cleanEmail, c.id);
      }
    }

    if (!isDup && cleanPhone && cleanPhone.length >= 8) {
      if (phoneMap.has(cleanPhone)) {
        isDup = true;
        dupOf = phoneMap.get(cleanPhone)!;
        reason = `Matching candidate contact phone number`;
      } else {
        phoneMap.set(cleanPhone, c.id);
      }
    }

    if (!isDup && cleanName && cleanName !== 'applicant' && cleanName.length > 5) {
      if (nameMap.has(cleanName)) {
        isDup = true;
        dupOf = nameMap.get(cleanName)!;
        reason = `Identical applicant name (${c.name})`;
      } else {
        nameMap.set(cleanName, c.id);
      }
    }

    return {
      ...c,
      is_duplicate: isDup,
      duplicate_of_id: dupOf || undefined,
      duplicate_reason: reason || undefined
    };
  });
}

// Flag low-confidence profiles
export function checkLowConfidence(c: ExtractedResume): boolean {
  // If fewer than 2 skills and zero experience and short text
  const isSparseSkills = c.skills.length <= 1;
  const isZeroExp = c.experience_years === 0;
  const isShortText = (c.raw_text || '').length < 250;

  return (isSparseSkills && isZeroExp) || isShortText;
}

// Rank candidates and assign deterministic rank numbers
export function rankCandidates(
  candidates: ExtractedResume[],
  jd: JobDescription,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  embeddingsMap: Map<string, number[]> = new Map(),
  jdEmbedding?: number[]
): RankedCandidate[] {
  // Flag duplicates first
  const deduplicated = detectDuplicates(candidates);

  // Score each candidate
  const scoredList = deduplicated.map(c => {
    // Check low-confidence
    const isLowConf = checkLowConfidence(c);
    const updatedCandidate: ExtractedResume = {
      ...c,
      parse_status: c.parse_status === 'failed' ? 'failed' : (isLowConf ? 'low_confidence' : 'success')
    };

    const candEmbedding = embeddingsMap.get(c.id);
    const score = computeCandidateScore(updatedCandidate, jd, weights, candEmbedding, jdEmbedding);

    return {
      ...updatedCandidate,
      score
    };
  });

  // Sort descending by overall score, then experience, then skills
  scoredList.sort((a, b) => {
    if (b.score.overall_score !== a.score.overall_score) {
      return b.score.overall_score - a.score.overall_score;
    }
    if (b.score.breakdown.skills_match !== a.score.breakdown.skills_match) {
      return b.score.breakdown.skills_match - a.score.breakdown.skills_match;
    }
    return (b.experience_years || 0) - (a.experience_years || 0);
  });

  // Assign sequential 1-based ranks
  return scoredList.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}
