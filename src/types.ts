export interface JobDescription {
  title: string;
  raw_text: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  education_requirement: string;
  responsibilities: string[];
}

export type ParseStatus = 'success' | 'failed' | 'low_confidence';
export type EducationLevel = 'PhD' | 'Master' | 'Bachelor' | 'Diploma' | 'High School' | 'Unknown';

export interface ExtractedResume {
  id: string;
  filename: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  skills: string[];
  education: string;
  education_level: EducationLevel;
  experience_years: number;
  experience_summary: string;
  certifications: string[];
  parse_status: ParseStatus;
  parse_error?: string;
  raw_text: string;
  is_duplicate?: boolean;
  duplicate_of_id?: string;
  duplicate_reason?: string;
}

export interface MatchExplanation {
  category: 'skill' | 'experience' | 'education' | 'certification';
  requirement: string;
  candidate_value: string;
  status: 'matched' | 'partial' | 'missing';
  evidence?: string;
  score_impact: string;
}

export interface CandidateScore {
  resume_id: string;
  overall_score: number; // 0 to 100
  breakdown: {
    skills_match: number; // 0 to 100
    keyword_overlap_score: number; // 0 to 100
    semantic_similarity_score: number; // 0 to 100
    experience_match: number; // 0 to 100
    education_match: number; // 0 to 100
  };
  weights: {
    skills: number;
    experience: number;
    education: number;
  };
  matched_skills: string[];
  missing_skills: string[];
  match_explanations: MatchExplanation[];
  formula_breakdown: string;
}

export interface RankedCandidate extends ExtractedResume {
  rank: number;
  score: CandidateScore;
}

export interface ScoringWeights {
  skills: number;     // e.g. 0.50
  experience: number; // e.g. 0.30
  education: number;  // e.g. 0.20
}

export interface BatchProgress {
  total: number;
  current: number;
  currentFileName: string;
  stage: 'idle' | 'parsing_files' | 'extracting_ai' | 'scoring' | 'completed' | 'error';
  statusText: string;
  successCount: number;
  failedCount: number;
  lowConfidenceCount: number;
  percent: number;
}

export interface FailedFile {
  filename: string;
  reason: string;
  fileSize?: number;
  fileType?: string;
}
