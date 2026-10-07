import {
  JobDescription,
  ExtractedResume,
  BatchProgress,
  FailedFile,
  ScoringWeights,
  RankedCandidate
} from '../types';
import { parseResumeFile } from './fileParser';
import { rankCandidates, DEFAULT_WEIGHTS } from './scoringEngine';
import { parseJobDescriptionLocally, parseResumeLocally } from './resumeParserEngine';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract Job Description requirements across any domain (Tech, Healthcare, Finance, Sales, Marketing, etc.)
 */
export async function extractJobDescriptionApi(text: string): Promise<JobDescription> {
  try {
    const res = await fetch('/api/extract-jd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.required_skills) && data.required_skills.length > 0) {
        return {
          title: data.title || 'Target Job Role',
          raw_text: text,
          required_skills: data.required_skills,
          preferred_skills: Array.isArray(data.preferred_skills) ? data.preferred_skills : [],
          min_experience_years: typeof data.min_experience_years === 'number' ? data.min_experience_years : 0,
          education_requirement: data.education_requirement || "Bachelor's degree or equivalent",
          responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : []
        };
      }
    }
  } catch (err: any) {
    console.warn('API JD extraction fetch failed, using local multi-domain extractor:', err?.message);
  }

  // Instant local multi-domain parser fallback
  return parseJobDescriptionLocally(text);
}

/**
 * Extract candidate fields with domain precision
 */
export async function extractResumeApi(
  text: string,
  filename: string,
  jdSkills: string[] = []
): Promise<Omit<ExtractedResume, 'id' | 'filename' | 'parse_status' | 'raw_text'>> {
  // Use high-speed multi-domain local parser directly for instant, accurate parsing
  return parseResumeLocally(text, filename, jdSkills);
}

export async function fetchEmbeddingsApi(texts: string[]): Promise<number[][] | null> {
  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.embeddings) && data.embeddings.length > 0 ? data.embeddings : null;
  } catch (err) {
    return null;
  }
}

export interface BatchProcessingOptions {
  files: File[];
  jd: JobDescription;
  weights?: ScoringWeights;
  onProgress: (progress: BatchProgress) => void;
  batchChunkSize?: number;
  delayBetweenChunksMs?: number;
}

/**
 * Enterprise ATS Batch Pipeline:
 * Capable of screening and scoring 100+ resumes in under 30-45 seconds
 * with unique, genuine candidate skill verification and transparent score variance.
 */
export async function runResumeBatchPipeline({
  files,
  jd,
  weights = DEFAULT_WEIGHTS,
  onProgress,
  batchChunkSize = 10,
  delayBetweenChunksMs = 15
}: BatchProcessingOptions): Promise<{
  ranked: RankedCandidate[];
  failedFiles: FailedFile[];
  totalParsed: number;
}> {
  const total = files.length;
  const failedFiles: FailedFile[] = [];
  const parsedResumes: Array<{ file: File; text: string }> = [];

  // ----------------------------------------------------
  // Stage 1: Fast Parallel Document Text Extraction
  // ----------------------------------------------------
  onProgress({
    total,
    current: 0,
    currentFileName: '',
    stage: 'parsing_files',
    statusText: `Parsing ${total} candidate document${total === 1 ? '' : 's'} concurrently...`,
    successCount: 0,
    failedCount: 0,
    lowConfidenceCount: 0,
    percent: 5
  });

  const parseChunkSize = 10;
  for (let i = 0; i < files.length; i += parseChunkSize) {
    const chunk = files.slice(i, i + parseChunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (file, subIdx) => {
        const fileIdx = i + subIdx + 1;
        onProgress({
          total,
          current: fileIdx,
          currentFileName: file.name,
          stage: 'parsing_files',
          statusText: `Extracting text (${fileIdx}/${total}): ${file.name}`,
          successCount: parsedResumes.length,
          failedCount: failedFiles.length,
          lowConfidenceCount: 0,
          percent: Math.min(40, Math.round((fileIdx / total) * 40))
        });
        const parseResult = await parseResumeFile(file);
        return { file, parseResult };
      })
    );

    for (const { file, parseResult } of chunkResults) {
      if (!parseResult.success) {
        failedFiles.push({
          filename: file.name,
          reason: parseResult.error || 'Failed to extract text from document',
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop()
        });
      } else {
        parsedResumes.push({ file, text: parseResult.text });
      }
    }
  }

  // ----------------------------------------------------
  // Stage 2: Entity & Skill Extraction per Candidate
  // ----------------------------------------------------
  const extractedCandidates: ExtractedResume[] = [];
  const validTotal = parsedResumes.length;

  for (let i = 0; i < validTotal; i += batchChunkSize) {
    const chunk = parsedResumes.slice(i, i + batchChunkSize);

    const chunkResults = chunk.map((item, chunkIndex) => {
      const idx = i + chunkIndex;
      // High-speed, high-fidelity local extraction
      const extracted = parseResumeLocally(item.text, item.file.name, jd.required_skills);

      const candidate: ExtractedResume = {
        id: `cand_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        filename: item.file.name,
        raw_text: item.text,
        name: extracted.name,
        contact: extracted.contact,
        email: extracted.email,
        phone: extracted.phone,
        skills: extracted.skills,
        education: extracted.education,
        education_level: extracted.education_level as any,
        experience_years: extracted.experience_years,
        experience_summary: extracted.experience_summary,
        certifications: extracted.certifications,
        parse_status: 'success'
      };

      return candidate;
    });

    extractedCandidates.push(...chunkResults);

    const currentCount = Math.min(validTotal, i + batchChunkSize);
    onProgress({
      total,
      current: currentCount,
      currentFileName: chunk[chunk.length - 1]?.file.name || '',
      stage: 'extracting_ai',
      statusText: `Analyzed skills & qualifications for ${currentCount} of ${validTotal} candidate profiles...`,
      successCount: extractedCandidates.length,
      failedCount: failedFiles.length,
      lowConfidenceCount: 0,
      percent: 40 + Math.round((currentCount / validTotal) * 45)
    });

    if (delayBetweenChunksMs > 0) {
      await sleep(delayBetweenChunksMs);
    }
  }

  // ----------------------------------------------------
  // Stage 3: Semantic Alignment & Fast Scoring
  // ----------------------------------------------------
  onProgress({
    total,
    current: validTotal,
    currentFileName: '',
    stage: 'scoring',
    statusText: 'Calculating deterministic candidate ranking and fit scores...',
    successCount: extractedCandidates.length,
    failedCount: failedFiles.length,
    lowConfidenceCount: 0,
    percent: 92
  });

  // Score and rank all candidates with full variance
  const ranked = rankCandidates(extractedCandidates, jd, weights);
  const lowConfidenceCount = ranked.filter(r => r.parse_status === 'low_confidence').length;

  onProgress({
    total,
    current: total,
    currentFileName: '',
    stage: 'completed',
    statusText: `Analysis complete: ${ranked.length} candidates ranked (${failedFiles.length} skipped).`,
    successCount: ranked.length,
    failedCount: failedFiles.length,
    lowConfidenceCount,
    percent: 100
  });

  return {
    ranked,
    failedFiles,
    totalParsed: ranked.length
  };
}
