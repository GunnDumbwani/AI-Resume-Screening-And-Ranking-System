import React, { useState, useMemo } from 'react';
import { RankedCandidate, JobDescription } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Users,
  Award,
  CheckCircle,
  TrendingUp,
  Compass,
  Upload,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  candidates: RankedCandidate[];
  jobDescription: JobDescription | null;
  failedCount: number;
  onSelectCandidate: (candidate: RankedCandidate) => void;
  onNavigateToUpload?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  jobDescription,
  failedCount,
  onSelectCandidate,
  onNavigateToUpload,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates.length > 0 ? candidates[0].id : ''
  );

  // Selected candidate for radar chart
  const activeCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || candidates[0] || null;
  }, [candidates, selectedCandidateId]);

  // Pool summary stats
  const stats = useMemo(() => {
    if (candidates.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        medianScore: 0,
        qualifiedCount: 0,
        lowConfidenceCount: 0,
        duplicateCount: 0,
        topScore: 0,
      };
    }

    const scores = candidates.map(c => c.score.overall_score).sort((a, b) => a - b);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const avg = sum / scores.length;
    const median =
      scores.length % 2 === 0
        ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
        : scores[Math.floor(scores.length / 2)];

    const qualified = candidates.filter(c => c.score.overall_score >= 70).length;
    const lowConf = candidates.filter(c => c.parse_status === 'low_confidence').length;
    const dupes = candidates.filter(c => c.is_duplicate).length;
    const top = Math.max(...scores);

    return {
      total: candidates.length,
      avgScore: Math.round(avg),
      medianScore: Math.round(median),
      qualifiedCount: qualified,
      lowConfidenceCount: lowConf,
      duplicateCount: dupes,
      topScore: Math.round(top),
    };
  }, [candidates]);

  // 1. Score Distribution Data
  const scoreDistributionData = useMemo(() => {
    const buckets = [
      { range: '0–39%', count: 0, label: 'Low Fit' },
      { range: '40–59%', count: 0, label: 'Moderate' },
      { range: '60–74%', count: 0, label: 'Good' },
      { range: '75–89%', count: 0, label: 'Strong' },
      { range: '90–100%', count: 0, label: 'Top Fit' },
    ];

    candidates.forEach(c => {
      const s = c.score.overall_score;
      if (s < 40) buckets[0].count++;
      else if (s < 60) buckets[1].count++;
      else if (s < 75) buckets[2].count++;
      else if (s < 90) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [candidates]);

  // 2. Skill Gap & Frequency Data
  const skillCoverageData = useMemo(() => {
    if (!jobDescription || !jobDescription.required_skills) return [];

    return jobDescription.required_skills.slice(0, 8).map(skill => {
      let presentCount = 0;
      const cleanSkill = skill.toLowerCase();
      for (const c of candidates) {
        const hasSkill = c.score.matched_skills.some(
          ms => ms.toLowerCase() === cleanSkill || cleanSkill.includes(ms.toLowerCase())
        );
        if (hasSkill) presentCount++;
      }
      return {
        skill,
        Present: presentCount,
        Missing: candidates.length - presentCount,
      };
    });
  }, [candidates, jobDescription]);

  // 3. Radar Chart Data
  const candidateRadarData = useMemo(() => {
    if (!activeCandidate) return [];
    const b = activeCandidate.score.breakdown;

    return [
      { subject: 'Skills Match', value: Math.round(b.skills_match), fullMark: 100 },
      { subject: 'Keywords', value: Math.round(b.keyword_overlap), fullMark: 100 },
      { subject: 'Context Fit', value: Math.round(b.semantic_similarity), fullMark: 100 },
      { subject: 'Experience', value: Math.round(b.experience_match), fullMark: 100 },
      { subject: 'Education', value: Math.round(b.education_match), fullMark: 100 },
    ];
  }, [activeCandidate]);

  if (candidates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No match data yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Scan your resumes to see match score distributions, skill coverage charts, and candidate comparisons.
        </p>
        {onNavigateToUpload && (
          <div className="pt-2">
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
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Resumes */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Resumes</span>
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{stats.total}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {failedCount > 0 ? `${failedCount} skipped` : 'All read successfully'}
          </p>
        </div>

        {/* Average Match */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Match</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{stats.avgScore}%</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Median: {stats.medianScore}%
          </p>
        </div>

        {/* Top Matches (>=70%) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Matches (&ge;70%)</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight">{stats.qualifiedCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {Math.round((stats.qualifiedCount / stats.total) * 100)}% of candidates
          </p>
        </div>

        {/* Highest Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Score</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 tracking-tight">{stats.topScore}%</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Rank #1 Match
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Score Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Match Score Distribution
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Number of resumes in each score bracket
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} candidate(s)`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Skill Coverage */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Job Skills Coverage
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            How many candidates have each required skill
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillCoverageData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="skill" type="category" width={80} tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Present" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} name="Has Skill" />
                <Bar dataKey="Missing" fill="#e2e8f0" stackId="a" radius={[0, 4, 4, 0]} name="Missing Skill" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Candidate Radar Analysis Card */}
      {activeCandidate && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Candidate Radar Profile
              </h3>
              <p className="text-[11px] text-slate-500">
                Inspect 5 evaluation factors for any candidate
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Select:</span>
              <select
                value={selectedCandidateId}
                onChange={e => setSelectedCandidateId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    #{c.rank} {c.name} ({Math.round(c.score.overall_score)}%)
                  </option>
                ))}
              </select>
              <button
                onClick={() => onSelectCandidate(activeCandidate)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1 rounded-lg"
              >
                Full Details
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={candidateRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name={activeCandidate.name} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">{activeCandidate.name}</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {Math.round(activeCandidate.score.overall_score)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 font-mono">
                  {activeCandidate.filename}
                </p>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Skills Match:</span>
                    <strong className="text-slate-800">{activeCandidate.score.breakdown.skills_match}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience Match:</span>
                    <strong className="text-slate-800">{activeCandidate.score.breakdown.experience_match}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Education Match:</span>
                    <strong className="text-slate-800">{activeCandidate.score.breakdown.education_match}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Years of Experience:</span>
                    <strong className="text-slate-800">{activeCandidate.experience_years} years</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
