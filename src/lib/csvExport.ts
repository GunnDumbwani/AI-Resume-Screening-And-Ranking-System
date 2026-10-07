import { RankedCandidate } from '../types';

export function exportCandidatesToCsv(candidates: RankedCandidate[], jobTitle: string = 'Job'): void {
  if (!candidates || candidates.length === 0) return;

  const headers = [
    'Rank',
    'Candidate Name',
    'Overall Match Score (0-100)',
    'Skills Match (%)',
    'Keyword Overlap (%)',
    'Semantic Similarity (%)',
    'Experience Match (%)',
    'Education Match (%)',
    'Years of Experience',
    'Education Credential',
    'Matched Required Skills',
    'Missing Required Skills',
    'Certifications',
    'Email',
    'Phone',
    'Is Duplicate',
    'Parse Status'
  ];

  const rows = candidates.map(c => [
    c.rank,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    c.score.overall_score,
    c.score.breakdown.skills_match,
    c.score.breakdown.keyword_overlap_score,
    c.score.breakdown.semantic_similarity_score,
    c.score.breakdown.experience_match,
    c.score.breakdown.education_match,
    c.experience_years,
    `"${(c.education || '').replace(/"/g, '""')}"`,
    `"${c.score.matched_skills.join(', ')}"`,
    `"${c.score.missing_skills.join(', ')}"`,
    `"${(c.certifications || []).join(', ')}"`,
    `"${c.email || ''}"`,
    `"${c.phone || ''}"`,
    c.is_duplicate ? 'YES' : 'NO',
    c.parse_status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  link.setAttribute('download', `ranked_candidates_${cleanTitle}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
