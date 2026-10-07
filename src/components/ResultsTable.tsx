import React, { useState, useMemo } from 'react';
import {
  RankedCandidate,
  JobDescription,
} from '../types';
import {
  Download,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Upload
} from 'lucide-react';
import { exportCandidatesToCsv } from '../lib/csvExport';

interface ResultsTableProps {
  candidates: RankedCandidate[];
  jobDescription: JobDescription | null;
  onSelectCandidate: (candidate: RankedCandidate) => void;
  onNavigateToUpload?: () => void;
}

type SortField = 'rank' | 'overall_score' | 'skills_match' | 'experience_years' | 'education_match' | 'name';
type SortDirection = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({
  candidates,
  jobDescription,
  onSelectCandidate,
  onNavigateToUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [expFilter, setExpFilter] = useState<'all' | 'junior' | 'mid' | 'senior'>('all');
  const [flagFilter, setFlagFilter] = useState<'all' | 'valid' | 'low_confidence' | 'duplicates'>('all');

  const [sortField, setSortField] = useState<SortField>('overall_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Distinct list of required skills from JD
  const availableSkills = useMemo(() => {
    if (!jobDescription) return [];
    return jobDescription.required_skills || [];
  }, [jobDescription]);

  // Handle column sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Search query (name, email, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesSkills = c.skills.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesSkills) return false;
      }

      // Score filter
      if (scoreFilter === 'high' && c.score.overall_score < 75) return false;
      if (scoreFilter === 'mid' && (c.score.overall_score < 50 || c.score.overall_score >= 75)) return false;
      if (scoreFilter === 'low' && c.score.overall_score >= 50) return false;

      // Skill filter
      if (skillFilter !== 'all') {
        const hasSkill = c.score.matched_skills.some(s => s.toLowerCase() === skillFilter.toLowerCase());
        if (!hasSkill) return false;
      }

      // Experience filter
      if (expFilter === 'junior' && c.experience_years >= 3) return false;
      if (expFilter === 'mid' && (c.experience_years < 3 || c.experience_years > 5)) return false;
      if (expFilter === 'senior' && c.experience_years <= 5) return false;

      // Flag filter
      if (flagFilter === 'duplicates' && !c.is_duplicate) return false;
      if (flagFilter === 'low_confidence' && c.parse_status !== 'low_confidence') return false;
      if (flagFilter === 'valid' && (c.is_duplicate || c.parse_status === 'low_confidence')) return false;

      return true;
    });
  }, [candidates, searchQuery, scoreFilter, skillFilter, expFilter, flagFilter]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof RankedCandidate];
      let valB: any = b[sortField as keyof RankedCandidate];

      if (sortField === 'overall_score') {
        valA = a.score.overall_score;
        valB = b.score.overall_score;
      } else if (sortField === 'skills_match') {
        valA = a.score.breakdown.skills_match;
        valB = b.score.breakdown.skills_match;
      } else if (sortField === 'education_match') {
        valA = a.score.breakdown.education_match;
        valB = b.score.breakdown.education_match;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [filteredCandidates, sortField, sortDirection]);

  // If no candidates are available yet (clean empty state)
  if (candidates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-slate-900">No resumes scanned yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload your resumes and job description in the Scan Resumes tab to calculate match scores and view candidate rankings.
          </p>
        </div>
        {onNavigateToUpload && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Go to Scan Resumes</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filters Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-candidates"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, skill, or email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Right side counter & export */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-800 font-semibold">{sortedCandidates.length}</strong> of {candidates.length} candidates
            </span>
            <button
              id="btn-export-csv"
              onClick={() => exportCandidatesToCsv(sortedCandidates, jobDescription?.title || 'Candidates')}
              disabled={sortedCandidates.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 mr-1 text-[10px] uppercase font-bold tracking-wider">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Filter:</span>
          </div>

          {/* Score filter */}
          <select
            id="filter-score"
            value={scoreFilter}
            onChange={e => setScoreFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Match Scores</option>
            <option value="high">Top Match (&ge; 75%)</option>
            <option value="mid">Moderate Match (50–74%)</option>
            <option value="low">Low Match (&lt; 50%)</option>
          </select>

          {/* Required skill filter */}
          {availableSkills.length > 0 && (
            <select
              id="filter-skill"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs truncate"
            >
              <option value="all">Any Skill</option>
              {availableSkills.map((skill, idx) => (
                <option key={idx} value={skill}>
                  Has {skill}
                </option>
              ))}
            </select>
          )}

          {/* Experience filter */}
          <select
            id="filter-exp"
            value={expFilter}
            onChange={e => setExpFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Any Experience</option>
            <option value="junior">0–2 Years</option>
            <option value="mid">3–5 Years</option>
            <option value="senior">5+ Years</option>
          </select>

          {/* Clear filters */}
          {(scoreFilter !== 'all' || skillFilter !== 'all' || expFilter !== 'all' || flagFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setScoreFilter('all');
                setSkillFilter('all');
                setExpFilter('all');
                setFlagFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline px-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <tr>
                {/* Rank */}
                <th
                  onClick={() => handleSort('rank')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-14"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    {sortField === 'rank' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Candidate Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Candidate</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Match Score */}
                <th
                  onClick={() => handleSort('overall_score')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-32"
                >
                  <div className="flex items-center gap-1">
                    <span>Match Score</span>
                    {sortField === 'overall_score' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Skills */}
                <th className="py-3 px-3.5">
                  <span>Matched Skills</span>
                </th>

                {/* Missing Skills */}
                <th className="py-3 px-3.5">
                  <span>Missing Skills</span>
                </th>

                {/* Experience */}
                <th
                  onClick={() => handleSort('experience_years')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-24"
                >
                  <div className="flex items-center gap-1">
                    <span>Exp</span>
                    {sortField === 'experience_years' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Education */}
                <th className="py-3 px-3.5 w-28">
                  <span>Education</span>
                </th>

                {/* Actions */}
                <th className="py-3 px-3.5 text-right w-20">
                  <span>Details</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedCandidates.map(candidate => {
                  const score = candidate.score;
                  const isTopFit = score.overall_score >= 75;
                  const isMidFit = score.overall_score >= 50 && score.overall_score < 75;

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => onSelectCandidate(candidate)}
                      className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                    >
                      {/* Rank badge */}
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                          candidate.rank === 1
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : candidate.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : candidate.rank === 3
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{candidate.rank}
                        </span>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{candidate.name}</span>
                          {candidate.is_duplicate && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                              DUP
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs font-sans">
                          {candidate.email || candidate.contact || candidate.filename}
                        </div>
                      </td>

                      {/* Match Score Bar */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${
                            isTopFit
                              ? 'text-emerald-600'
                              : isMidFit
                              ? 'text-indigo-600'
                              : 'text-slate-500'
                          }`}>
                            {Math.round(score.overall_score)}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isTopFit
                                  ? 'bg-emerald-500'
                                  : isMidFit
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${score.overall_score}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Skills {score.breakdown.skills_match}% &bull; Exp {candidate.experience_years}y
                        </div>
                      </td>

                      {/* Matched Skills */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {score.matched_skills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5"
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{skill}</span>
                            </span>
                          ))}
                          {score.matched_skills.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-medium px-1 py-0.5">
                              +{score.matched_skills.length - 3}
                            </span>
                          )}
                          {score.matched_skills.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Missing Skills */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {score.missing_skills.slice(0, 2).map((skill, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {score.missing_skills.length > 2 && (
                            <span className="text-[10px] text-slate-400 px-1 py-0.5">
                              +{score.missing_skills.length - 2}
                            </span>
                          )}
                          {score.missing_skills.length === 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> All covered
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{candidate.experience_years} yrs</span>
                        </div>
                      </td>

                      {/* Education */}
                      <td className="py-2.5 px-3.5 text-slate-600">
                        <div className="flex items-center gap-1 truncate max-w-[120px]" title={candidate.education}>
                          <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{candidate.education_level || candidate.education}</span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectCandidate(candidate);
                          }}
                          className="px-2 py-1 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 rounded text-[11px] font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
