import React, { useState } from 'react';
import { RankedCandidate, JobDescription } from '../types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Award,
  FileText,
  Copy,
  Check,
  Calculator,
  ShieldCheck
} from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: RankedCandidate | null;
  jobDescription: JobDescription | null;
  onClose: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  jobDescription,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'raw_text'>('breakdown');
  const [copiedRawText, setCopiedRawText] = useState(false);

  if (!candidate) return null;

  const score = candidate.score;
  const weights = score.weights;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(candidate.raw_text || '');
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              #{candidate.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{candidate.name}</h3>
                {candidate.is_duplicate && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Duplicate
                  </span>
                )}
                {candidate.parse_status === 'low_confidence' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    Low Confidence
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                File: {candidate.filename} &bull; {candidate.email || candidate.contact || 'No email specified'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 px-4 bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'breakdown'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Score Details</span>
          </button>
          <button
            onClick={() => setActiveTab('raw_text')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw_text'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Text</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-800 flex-1">
          {activeTab === 'breakdown' ? (
            <>
              {/* Overall Score Calculation Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      How this score was calculated
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    {Math.round(score.overall_score)} / 100
                  </span>
                </div>

                <div className="bg-white p-2 rounded-md border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
                  <code>{score.formula_breakdown}</code>
                </div>

                <p className="text-[10px] text-slate-500 mt-1.5">
                  Weights: <strong>{(weights.skills * 100).toFixed(0)}% Skills</strong> + <strong>{(weights.experience * 100).toFixed(0)}% Experience</strong> + <strong>{(weights.education * 100).toFixed(0)}% Education</strong>.
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Skills card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Skills Match</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {score.breakdown.skills_match}%
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1">
                    <div className="flex justify-between">
                      <span>Keywords:</span>
                      <strong className="text-slate-800">{score.breakdown.keyword_overlap_score}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Context Match:</span>
                      <strong className="text-slate-800">{score.breakdown.semantic_similarity_score}%</strong>
                    </div>
                  </div>
                </div>

                {/* Experience card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Experience Match</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {score.breakdown.experience_match}%
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1">
                    <div className="flex justify-between">
                      <span>Candidate Yrs:</span>
                      <strong className="text-slate-800">{candidate.experience_years} yrs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Job Required:</span>
                      <strong className="text-slate-800">{jobDescription?.min_experience_years || 0} yrs</strong>
                    </div>
                  </div>
                </div>

                {/* Education card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Education Match</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {score.breakdown.education_match}%
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <strong className="text-slate-800">{candidate.education_level}</strong>
                    </div>
                    <div className="flex justify-between truncate">
                      <span>Degree:</span>
                      <span className="text-slate-800 truncate max-w-[90px]" title={candidate.education}>
                        {candidate.education || 'Unspecified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement-by-Requirement Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 tracking-tight">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Job Requirements Checklist</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-3">Job Requirement</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Resume Evidence</th>
                        <th className="py-2 px-3 text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {score.match_explanations.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {item.requirement}
                          </td>

                          <td className="py-2 px-3">
                            {item.status === 'matched' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Matched</span>
                              </span>
                            ) : item.status === 'partial' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <span>Partial</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Missing</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-slate-600 italic text-[11px]">
                            {item.evidence || 'No mention found in resume'}
                          </td>

                          <td className="py-2 px-3 text-right font-medium text-slate-700 text-[11px]">
                            {item.score_impact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extracted Skills Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Skills Extracted ({candidate.skills.length})
                  </h5>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {candidate.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                    {candidate.skills.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">No skills found</span>
                    )}
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <h5 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Certifications ({candidate.certifications?.length || 0})
                  </h5>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {candidate.certifications && candidate.certifications.length > 0 ? (
                      candidate.certifications.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-800">
                          <Award className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">None listed</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Raw Text Viewer Tab */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  Parsed resume text ({candidate.raw_text?.length || 0} characters):
                </p>
                <button
                  onClick={handleCopyRaw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {copiedRawText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRawText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto max-h-[400px] whitespace-pre-wrap leading-relaxed">
                {candidate.raw_text || 'No resume text available.'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Transparent and unbiased scoring
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
