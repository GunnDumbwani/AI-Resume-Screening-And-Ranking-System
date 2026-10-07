import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sliders,
  Sparkles,
  X,
  AlertTriangle,
  Play,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { JobDescription, ScoringWeights, BatchProgress, FailedFile } from '../types';
import { parseResumeFile } from '../lib/fileParser';
import { extractJobDescriptionApi } from '../lib/geminiClient';

interface UploadSectionProps {
  jobDescription: JobDescription | null;
  setJobDescription: (jd: JobDescription | null) => void;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  scoringWeights: ScoringWeights;
  setScoringWeights: (weights: ScoringWeights) => void;
  onStartProcessing: () => void;
  batchProgress: BatchProgress | null;
  isProcessing: boolean;
  failedFiles: FailedFile[];
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  jobDescription,
  setJobDescription,
  selectedFiles,
  setSelectedFiles,
  scoringWeights,
  setScoringWeights,
  onStartProcessing,
  batchProgress,
  isProcessing,
  failedFiles,
}) => {
  const [jdMode, setJdMode] = useState<'paste' | 'file'>('paste');
  const [jdRawInput, setJdRawInput] = useState(jobDescription?.raw_text || '');
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [weightSkills, setWeightSkills] = useState(Math.round(scoringWeights.skills * 100));
  const [weightExp, setWeightExp] = useState(Math.round(scoringWeights.experience * 100));
  const [weightEdu, setWeightEdu] = useState(Math.round(scoringWeights.education * 100));

  const [newSkillInput, setNewSkillInput] = useState('');
  const [resumeInputRef] = useState(() => React.createRef<HTMLInputElement>());
  const [jdFileInputRef] = useState(() => React.createRef<HTMLInputElement>());

  // Parse JD using API or heuristic fallback
  const handleParseJobDescription = async (textToParse: string): Promise<JobDescription | null> => {
    if (!textToParse.trim()) return null;
    setIsParsingJd(true);
    try {
      const parsed = await extractJobDescriptionApi(textToParse);
      setJobDescription(parsed);
      return parsed;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsParsingJd(false);
    }
  };

  // Auto-extract JD when text is typed or pasted after brief debounce
  React.useEffect(() => {
    const text = jdRawInput.trim();
    if (text.length >= 25 && (!jobDescription || jobDescription.raw_text !== text)) {
      const timer = setTimeout(() => {
        handleParseJobDescription(text);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [jdRawInput]);

  // Add custom skill to Job Description
  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed || !jobDescription) return;

    if (!jobDescription.required_skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setJobDescription({
        ...jobDescription,
        required_skills: [...jobDescription.required_skills, trimmed]
      });
    }
    setNewSkillInput('');
  };

  // Remove skill from Job Description
  const handleRemoveSkill = (skillToRemove: string) => {
    if (!jobDescription) return;
    setJobDescription({
      ...jobDescription,
      required_skills: jobDescription.required_skills.filter(s => s !== skillToRemove)
    });
  };

  // Update minimum experience required
  const handleUpdateExperience = (years: number) => {
    if (!jobDescription) return;
    setJobDescription({
      ...jobDescription,
      min_experience_years: Math.max(0, years)
    });
  };

  // Trigger matching with auto-extraction guarantee
  const handleTriggerMatching = async () => {
    const currentText = jdRawInput.trim();
    if (currentText && (!jobDescription || jobDescription.raw_text !== currentText)) {
      const parsed = await handleParseJobDescription(currentText);
      if (parsed) {
        setTimeout(() => onStartProcessing(), 50);
      }
      return;
    }
    onStartProcessing();
  };

  // Handle JD file upload (PDF/DOCX/TXT)
  const handleJdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingJd(true);
    try {
      const res = await parseResumeFile(file);
      if (res.success && res.text) {
        setJdRawInput(res.text);
        await handleParseJobDescription(res.text);
      } else {
        alert(res.error || 'Failed to read Job Description file');
      }
    } catch (err: any) {
      alert(`Error reading file: ${err?.message}`);
    } finally {
      setIsParsingJd(false);
      if (jdFileInputRef.current) jdFileInputRef.current.value = '';
    }
  };

  // Handle resume files selection
  const handleResumeFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const validFiles = files.filter((f: File) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx' || ext === 'txt';
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const newFiles = validFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...newFiles];
      });
    }

    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  // Drag and drop for resumes
  const handleResumeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((f: File) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ext === 'pdf' || ext === 'docx' || ext === 'txt';
      });

      if (validFiles.length > 0) {
        setSelectedFiles(prev => {
          const existingNames = new Set(prev.map(f => f.name));
          const newFiles = validFiles.filter(f => !existingNames.has(f.name));
          return [...prev, ...newFiles];
        });
      }
    }
  };

  // Remove single file
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Clear all files
  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  // Save weights
  const handleSaveWeights = () => {
    const total = weightSkills + weightExp + weightEdu;
    if (total === 0) return;
    const normalized: ScoringWeights = {
      skills: weightSkills / total,
      experience: weightExp / total,
      education: weightEdu / total,
    };
    setScoringWeights(normalized);
    setShowWeightsConfig(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ResumeAI Matcher
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Scan &amp; Match Resumes</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Provide a job description and upload candidate resumes to automatically rank candidates by skills, experience, and qualifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            id="btn-customize-weights"
            onClick={() => setShowWeightsConfig(!showWeightsConfig)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Weights ({Math.round(scoringWeights.skills * 100)}/{Math.round(scoringWeights.experience * 100)}/{Math.round(scoringWeights.education * 100)})</span>
          </button>
        </div>
      </div>

      {/* Weights Configuration Drawer */}
      {showWeightsConfig && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Custom Scoring Weights</h3>
              <p className="text-[11px] text-slate-500">
                Adjust how much each factor contributes to the candidate's final 0–100 match score.
              </p>
            </div>
            <button
              onClick={() => setShowWeightsConfig(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Skills Match: <span className="font-bold text-indigo-600">{weightSkills}%</span>
              </label>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={weightSkills}
                onChange={e => setWeightSkills(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Exact &amp; related skill matches</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Experience: <span className="font-bold text-indigo-600">{weightExp}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={70}
                step={5}
                value={weightExp}
                onChange={e => setWeightExp(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Total years of relevant experience</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Education: <span className="font-bold text-indigo-600">{weightEdu}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={weightEdu}
                onChange={e => setWeightEdu(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Degree level vs required qualification</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setWeightSkills(50);
                setWeightExp(35);
                setWeightEdu(15);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1"
            >
              Reset Default
            </button>
            <button
              onClick={handleSaveWeights}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded-md"
            >
              Apply Weights
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Step 1: Job Description Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Job Description
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-[11px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setJdMode('paste')}
                  className={`px-2 py-0.5 rounded ${jdMode === 'paste' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setJdMode('file')}
                  className={`px-2 py-0.5 rounded ${jdMode === 'file' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* Input area */}
            {jdMode === 'paste' ? (
              <div className="space-y-2">
                <textarea
                  id="textarea-job-description"
                  rows={7}
                  value={jdRawInput}
                  onChange={e => setJdRawInput(e.target.value)}
                  placeholder="Paste your job description here (title, required skills, years of experience, responsibilities)..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 font-sans leading-relaxed resize-none"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>{jdRawInput.length} characters</span>
                  <button
                    id="btn-parse-jd"
                    type="button"
                    onClick={() => handleParseJobDescription(jdRawInput)}
                    disabled={isParsingJd || !jdRawInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{isParsingJd ? 'Extracting...' : 'Extract Job Skills'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => jdFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-lg p-6 text-center cursor-pointer transition-colors"
                >
                  <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Click to upload Job Description file</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, DOCX, or TXT</p>
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleJdFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Extracted JD Summary & Customization Panel */}
            {jobDescription && (
              <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-bold text-slate-900 truncate max-w-xs">{jobDescription.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                    <span className="text-slate-400">Min Exp:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateExperience(Math.max(0, jobDescription.min_experience_years - 1))}
                      className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]"
                    >
                      -
                    </button>
                    <span className="font-bold px-0.5">{jobDescription.min_experience_years} yrs</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateExperience(jobDescription.min_experience_years + 1)}
                      className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Target Evaluation Skills (Interactive) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Target Required Skills ({jobDescription.required_skills.length}):</span>
                    <span className="text-[10px] text-slate-400">Click ✕ to remove</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {jobDescription.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded shadow-2xs font-medium group"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Custom Skill Form */}
                <form onSubmit={handleAddCustomSkill} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    placeholder="Add custom required skill (e.g. SQL, GAAP, Salesforce)..."
                    className="flex-1 text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!newSkillInput.trim()}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium disabled:opacity-40"
                  >
                    + Add
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Upload Resumes Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Upload Candidate Resumes
                </h3>
              </div>

              {selectedFiles.length > 0 && (
                <button
                  onClick={handleClearAllFiles}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear ({selectedFiles.length})</span>
                </button>
              )}
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleResumeDrop}
              onClick={() => resumeInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 rounded-lg p-5 text-center cursor-pointer transition-colors select-none"
            >
              <Upload className="w-8 h-8 mx-auto text-indigo-500 mb-1.5" />
              <p className="text-xs font-bold text-slate-800">
                Drop your resumes here, or <span className="text-indigo-600 underline">browse files</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PDF, DOCX, and TXT &bull; Multiple files supported
              </p>
              <input
                ref={resumeInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleResumeFilesSelect}
                className="hidden"
              />
            </div>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                  <span>Selected Resumes ({selectedFiles.length})</span>
                  <span className="text-[10px] text-slate-400">Ready to scan</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-md px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 truncate max-w-xs">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate text-slate-800 font-medium text-[11px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Row */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {selectedFiles.length === 0
                ? 'Upload candidate resumes to start matching'
                : `${selectedFiles.length} resume(s) ready to match`}
            </div>

            <button
              id="btn-start-processing"
              onClick={handleTriggerMatching}
              disabled={isProcessing || selectedFiles.length === 0 || (!jobDescription && !jdRawInput.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm hover:shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isProcessing ? 'Scanning Resumes...' : 'Scan & Match Resumes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Processing Progress Card */}
      {batchProgress && isProcessing && (
        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              <span className="text-xs font-bold text-slate-900">{batchProgress.statusText}</span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600">
              {batchProgress.percent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${batchProgress.percent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Progress: {batchProgress.current} / {batchProgress.total}</span>
            {batchProgress.currentFileName && (
              <span className="truncate max-w-xs font-mono text-[10px]">
                Reading: {batchProgress.currentFileName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Failed Files Alert */}
      {failedFiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{failedFiles.length} file(s) could not be read and were safely skipped:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-800">
            {failedFiles.map((ff, i) => (
              <li key={i}>
                <strong>{ff.filename}</strong>: {ff.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
