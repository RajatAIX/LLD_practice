import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Code2,
  History,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Terminal,
  Zap,
  Boxes,
  Layers,
  Clock,
  Copy,
  Check,
  BarChart3,
  Target,
  GitBranch,
  ShieldCheck,
  Cpu,
  X,
  ChevronRight,
  AlertCircle,
  BookOpen,
  RotateCcw,
  Eye
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────
interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  requirements?: string[];
}

interface Attempt {
  id: string;
  problemId: string;
  problemTitle: string;
  startedAt: string;
  status: string;
}

interface EvaluationScore {
  overall: number;
  requirements: number;
  design: number;
  extensibility: number;
  codeQuality: number;
}

interface EvaluationFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

interface EvaluationResult {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  score?: EvaluationScore;
  feedback?: EvaluationFeedback;
}

// ── API Config ────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

// ── Default Fallback Problems (Ensures catalog is never empty during server reloads) ──
const DEFAULT_FALLBACK_PROBLEMS: Problem[] = [
  {
    id: "16c4f0a3-06c8-490f-923e-b074fea95e0e",
    title: "Design a Parking Lot",
    description: "Design a multi-level parking lot system. It should support multiple vehicle types and different pricing models.",
    difficulty: "MEDIUM",
    requirements: ["Support Cars, Motorcycles, and Trucks.", "Calculate fee based on time spent.", "Handle entry and exit gates."]
  },
  {
    id: "6526e2a9-3ff8-489f-8cfa-ec4d263e1851",
    title: "Design an Elevator System",
    description: "Design an elevator system for a multi-story building that optimizes wait times.",
    difficulty: "HARD",
    requirements: ["Handle internal and external requests.", "Support emergency stops.", "Optimize dispatch algorithm."]
  },
  {
    id: "6d4ced55-9c6a-44fe-85df-e4c6adc09416",
    title: "Design a Vending Machine",
    description: "Design a state machine for a vending machine.",
    difficulty: "EASY",
    requirements: ["Accept different denominations.", "Dispense product and change.", "Handle out of stock."]
  },
  {
    id: "844a6e0a-31a5-47a7-8e42-fb6e3004d02e",
    title: "Design a Library Management System",
    description: "Design a system to manage books, members, and lending operations in a library.",
    difficulty: "EASY",
    requirements: ["Track book inventory and availability.", "Manage member registrations.", "Handle borrow and return flows with due dates."]
  },
  {
    id: "4a3c47f3-98af-4b9c-b2c4-f726102d2f65",
    title: "Design an ATM System",
    description: "Design the software for an ATM machine that handles deposits, withdrawals, and transfers.",
    difficulty: "MEDIUM",
    requirements: ["Authenticate users with card and PIN.", "Support cash withdrawal with denomination selection.", "Handle insufficient funds and daily limits."]
  },
  {
    id: "7597208f-bf6f-4f1d-8734-c527f96372a4",
    title: "Design an Online Food Ordering System",
    description: "Design a food delivery platform like Zomato/Swiggy at the LLD level.",
    difficulty: "HARD",
    requirements: ["Support restaurants, menus, and order placement.", "Track order lifecycle from placement to delivery.", "Handle multiple delivery agents and assignment logic."]
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────
function getBadgeClass(difficulty: string) {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':   return 'badge badge-easy';
    case 'MEDIUM': return 'badge badge-medium';
    case 'HARD':   return 'badge badge-hard';
    default:       return 'badge badge-medium';
  }
}

function getStatusChipClass(status: string) {
  switch (status?.toUpperCase()) {
    case 'SUBMITTED': return 'status-chip chip-submitted';
    case 'EVALUATED': return 'status-chip chip-evaluated';
    default:          return 'status-chip chip-in_progress';
  }
}

function getProblemTags(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes('parking')) return ['OOP Design', 'Classes', 'Clean Code'];
  if (lower.includes('elevator')) return ['State Logic', 'Queue', 'Clean Code'];
  if (lower.includes('vending')) return ['State Pattern', 'Inventory', 'Clean Code'];
  if (lower.includes('library')) return ['OOP Design', 'Catalog', 'Clean Code'];
  if (lower.includes('atm')) return ['State Logic', 'Transactions', 'Clean Code'];
  if (lower.includes('food') || lower.includes('ordering')) return ['Multi-Entity', 'Workflow', 'Clean Code'];
  if (lower.includes('rate')) return ['Logic', 'Counter', 'Clean Code'];
  if (lower.includes('snake')) return ['Game Rules', 'Grid', 'Clean Code'];
  return ['OOP Design', 'Clean Code'];
}

function getNavStateFromUrl() {
  const url = new URL(window.location.href);
  const path = url.pathname;
  const params = url.searchParams;

  let problemId: string | null = params.get('problem');
  if (!problemId && path.startsWith('/problem/')) {
    problemId = decodeURIComponent(path.replace('/problem/', '').split('/')[0]);
  }

  let tab: 'practice' | 'history' = 'practice';
  if (params.get('tab') === 'history' || path.startsWith('/history')) {
    tab = 'history';
  }

  let attemptId: string | null = params.get('attempt');
  if (!attemptId && path.startsWith('/history/')) {
    attemptId = decodeURIComponent(path.replace('/history/', '').split('/')[0]);
  }

  return { tab, problemId, attemptId };
}

// ── Main Component ────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');
  const [problems, setProblems]   = useState<Problem[]>(DEFAULT_FALLBACK_PROBLEMS);
  const [history,  setHistory]    = useState<Attempt[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');

  // Studio Workspace State
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [attemptId,    setAttemptId]    = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [copiedCode,   setCopiedCode]   = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationState, setEvaluationState] =
    useState<'none' | 'loading' | 'completed' | 'failed'>('none');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Master-Detail History Inspector State
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyDetailData, setHistoryDetailData] = useState<{
    submission?: { id: string; solution: string; status: string; submittedAt?: string };
    evaluation?: EvaluationResult | null;
  } | null>(null);
  const [loadingHistoryDetail, setLoadingHistoryDetail] = useState(false);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);

  // Custom Popup Modal States
  const [attemptToDelete, setAttemptToDelete] = useState<Attempt | null>(null);
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (attemptToDelete) setAttemptToDelete(null);
        if (previewProblem) setPreviewProblem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attemptToDelete, previewProblem]);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Navigation tracking refs to avoid stale closures
  const selectedProblemRef = useRef<Problem | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const selectedHistoryIdRef = useRef<string | null>(null);
  const activeTabRef = useRef<'practice' | 'history'>('practice');

  useEffect(() => { selectedProblemRef.current = selectedProblem; }, [selectedProblem]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { selectedHistoryIdRef.current = selectedHistoryId; }, [selectedHistoryId]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    fetchProblems();

    // Initial navigation based on URL
    const { tab, problemId, attemptId: urlAttemptId } = getNavStateFromUrl();
    if (tab === 'history') {
      setActiveTab('history');
      if (urlAttemptId) {
        selectHistoryItem(urlAttemptId, false);
      }
    } else if (problemId) {
      openProblem(problemId, false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Browser Back / Forward Arrow handler (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const { tab, problemId, attemptId: urlAttemptId } = getNavStateFromUrl();

      if (tab === 'history') {
        setActiveTab('history');
        if (urlAttemptId) {
          selectHistoryItem(urlAttemptId, false);
        }
      } else {
        setActiveTab('practice');
        if (problemId) {
          openProblem(problemId, false);
        } else {
          // Navigated back to catalog
          resetFlow();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const fetchProblems = async (retries = 2) => {
    setLoadingProblems(true);
    try {
      const res  = await fetch(`${API_BASE}/problems`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { data?: Problem[] };
      if (data.data && data.data.length > 0) {
        setProblems(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch problems from backend:', e);
      if (retries > 0) {
        setTimeout(() => fetchProblems(retries - 1), 1500);
      }
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res  = await fetch(`${API_BASE}/attempts`);
      const data = await res.json() as { data?: Attempt[] };
      const list = data.data ?? [];
      setHistory(list);
      if (list.length > 0 && !selectedHistoryId) {
        selectHistoryItem(list[0].id);
      }
    } catch (e) { console.error('Failed to fetch history:', e); }
    setLoadingHistory(false);
  };

  const selectHistoryItem = async (id: string, pushToHistory = true) => {
    setSelectedHistoryId(id);
    if (pushToHistory) {
      const newUrl = `?tab=history&attempt=${encodeURIComponent(id)}`;
      if (window.location.search !== newUrl) {
        window.history.pushState({ tab: 'history', attemptId: id }, '', newUrl);
      }
    }
    setLoadingHistoryDetail(true);
    try {
      let submission: { id: string; solution: string; status: string; submittedAt?: string } | undefined;
      let evaluation: EvaluationResult | null = null;

      const subRes = await fetch(`${API_BASE}/submissions/attempt/${id}`);
      if (subRes.ok) {
        const subData = await subRes.json() as { data?: Array<{ id: string; solution: string; status: string; submittedAt?: string }> };
        if (subData.data && subData.data.length > 0) {
          submission = subData.data[0];

          const evalRes = await fetch(`${API_BASE}/evaluations/submission/${submission.id}`);
          if (evalRes.ok) {
            const evalData = await evalRes.json() as { data?: EvaluationResult[] | EvaluationResult };
            evaluation = Array.isArray(evalData.data) ? evalData.data[0] : evalData.data ?? null;
          }
        }
      }

      setHistoryDetailData({ submission, evaluation });
    } catch (e) {
      console.error('Failed to load detail for attempt:', e);
    }
    setLoadingHistoryDetail(false);
  };

  const startAttempt = async (problemId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const pRes = await fetch(`${API_BASE}/problems/${problemId}`);
      if (!pRes.ok) throw new Error(`Could not load problem (HTTP ${pRes.status})`);
      const pData = await pRes.json() as { data: Problem };
      setSelectedProblem(pData.data);

      const attRes = await fetch(`${API_BASE}/attempts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      });
      const attData = await attRes.json() as { success?: boolean; data?: { id: string }; message?: string };
      if (!attRes.ok || !attData.data) {
        throw new Error(attData.message || `Failed to create attempt (HTTP ${attRes.status})`);
      }
      setAttemptId(attData.data.id);

      const subRes = await fetch(`${API_BASE}/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attData.data.id, solution: '' }),
      });
      const subData = await subRes.json() as { success?: boolean; data?: { id: string }; message?: string };
      if (!subRes.ok || !subData.data) {
        throw new Error(subData.message || `Failed to create draft submission (HTTP ${subRes.status})`);
      }
      setSubmissionId(subData.data.id);

      setSolutionText('');
      setEvaluationState('none');
      setEvaluationResult(null);
      setError(null);
    } catch (e: any) {
      console.error('Failed to start attempt:', e);
      setError(e.message || 'Failed to start attempt. Please try again.');
    }
    setSubmitting(false);
  };

  const submitSolution = async () => {
    if (!solutionText.trim()) { setError('Please write your code before submitting.'); return; }
    if (!submissionId || !attemptId) { setError('Please select a problem first.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/submissions/${submissionId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: solutionText }),
      });
      await fetch(`${API_BASE}/submissions/${submissionId}/submit`, { method: 'POST' });
      await fetch(`${API_BASE}/attempts/${attemptId}/submit`, { method: 'POST' });

      const evalRes = await fetch(`${API_BASE}/evaluations/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const evalData = await evalRes.json() as { data: { id: string } };
      setEvaluationState('loading');
      pollEvaluation(evalData.data.id);
    } catch (e) {
      console.error('Submission failed:', e);
      setError('Submission failed. Please check your connection and try again.');
      setEvaluationState('failed');
    }
    setSubmitting(false);
  };

  const pollEvaluation = useCallback((evalId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/evaluations/${evalId}`);
        const data = await res.json() as { data: EvaluationResult };
        if (data.data.status === 'COMPLETED') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setEvaluationResult(data.data);
          setEvaluationState('completed');
        } else if (data.data.status === 'FAILED') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setEvaluationState('failed');
        }
      } catch (err) { console.error('Polling error:', err); }
    }, 2000);
  }, []);

  const promptDeleteAttempt = (attempt: Attempt, e: React.MouseEvent) => {
    e.stopPropagation();
    setAttemptToDelete(attempt);
  };

  const executeDeleteAttempt = async () => {
    if (!attemptToDelete) return;
    const id = attemptToDelete.id;
    setDeletingAttemptId(id);
    setAttemptToDelete(null);
    try {
      const res = await fetch(`${API_BASE}/attempts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete attempt");
      setHistory(prev => {
        const updated = prev.filter(a => a.id !== id);
        if (selectedHistoryId === id) {
          if (updated.length > 0) selectHistoryItem(updated[0].id);
          else {
            setSelectedHistoryId(null);
            setHistoryDetailData(null);
          }
        }
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete attempt. Please try again.");
    }
    setDeletingAttemptId(null);
  };

  const resumeAttempt = async (attempt: Attempt, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSubmitting(true);
    setError(null);
    try {
      const pRes = await fetch(`${API_BASE}/problems/${attempt.problemId}`);
      if (!pRes.ok) throw new Error("Could not find problem");
      const pData = await pRes.json() as { data: Problem };
      setSelectedProblem(pData.data);
      setAttemptId(attempt.id);

      const subRes = await fetch(`${API_BASE}/submissions/attempt/${attempt.id}`);
      if (subRes.ok) {
        const subData = await subRes.json() as { data?: Array<{ id: string; solution: string; status: string }> };
        if (subData.data && subData.data.length > 0) {
          const latestSub = subData.data[0];
          setSubmissionId(latestSub.id);
          setSolutionText(latestSub.solution || '');

          if (attempt.status === 'EVALUATED' || latestSub.status === 'SUBMITTED') {
            const evalRes = await fetch(`${API_BASE}/evaluations/submission/${latestSub.id}`);
            if (evalRes.ok) {
              const evalData = await evalRes.json() as { data?: EvaluationResult[] | EvaluationResult };
              const resObj = Array.isArray(evalData.data) ? evalData.data[0] : evalData.data;
              if (resObj && resObj.status === 'COMPLETED') {
                setEvaluationResult(resObj);
                setEvaluationState('completed');
                setActiveTab('practice');
                setSubmitting(false);
                return;
              }
            }
          }
        }
      }

      setEvaluationState('none');
      setEvaluationResult(null);
      setActiveTab('practice');

      const newUrl = `?problem=${encodeURIComponent(attempt.problemId)}`;
      if (window.location.search !== newUrl) {
        window.history.pushState({ tab: 'practice', problemId: attempt.problemId }, '', newUrl);
      }
    } catch (err: any) {
      console.error('Failed to resume attempt:', err);
      setError(err.message || "Failed to resume attempt");
    }
    setSubmitting(false);
  };

  const openProblem = async (problemId: string, pushToHistory = true) => {
    if (pushToHistory) {
      const newUrl = `?problem=${encodeURIComponent(problemId)}`;
      if (window.location.search !== newUrl) {
        window.history.pushState({ tab: 'practice', problemId }, '', newUrl);
      }
    }
    setActiveTab('practice');
    if (selectedProblemRef.current?.id === problemId && attemptIdRef.current) {
      return;
    }
    await startAttempt(problemId);
  };

  const handleBackToProblems = (pushToHistory = true) => {
    resetFlow();
    setActiveTab('practice');
    if (pushToHistory) {
      if (window.location.search || window.location.pathname !== '/') {
        window.history.pushState({ tab: 'practice' }, '', window.location.pathname);
      }
    }
  };

  const switchTab = (tab: 'practice' | 'history', pushToHistory = true) => {
    setActiveTab(tab);
    if (pushToHistory) {
      if (tab === 'practice') {
        if (selectedProblemRef.current) {
          const newUrl = `?problem=${encodeURIComponent(selectedProblemRef.current.id)}`;
          window.history.pushState({ tab: 'practice', problemId: selectedProblemRef.current.id }, '', newUrl);
        } else {
          window.history.pushState({ tab: 'practice' }, '', window.location.pathname);
        }
      } else {
        const newUrl = selectedHistoryIdRef.current
          ? `?tab=history&attempt=${encodeURIComponent(selectedHistoryIdRef.current)}`
          : `?tab=history`;
        window.history.pushState({ tab: 'history', attemptId: selectedHistoryIdRef.current }, '', newUrl);
      }
    }
  };

  const copySolutionCode = () => {
    if (!solutionText) return;
    navigator.clipboard.writeText(solutionText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetFlow = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setSelectedProblem(null);
    setAttemptId(null);
    setSubmissionId(null);
    setEvaluationState('none');
    setEvaluationResult(null);
    setError(null);
  };

  const filteredProblems = problems.filter(p => {
    if (difficultyFilter === 'ALL') return true;
    return (p.difficulty || '').toUpperCase() === difficultyFilter.toUpperCase();
  });

  const selectedAttempt = history.find(a => a.id === selectedHistoryId);

  // ─── RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* ── TOP FLOATING GLASS NAVIGATION BAR ── */}
      <header className="top-nav">
        <div className="nav-brand" onClick={() => { switchTab('practice'); handleBackToProblems(); }}>
          <div className="brand-icon-box">
            <Zap size={20} className="fill-current" />
          </div>
          <div className="brand-title">
            LLD Practice
            <span className="brand-tag">AI</span>
          </div>
        </div>

        {/* Central Segmented View Switcher */}
        <div className="nav-switcher">
          <button
            className={`nav-pill ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => switchTab('practice')}
          >
            <Code2 size={16} />
            Practice
          </button>
          <button
            className={`nav-pill ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => switchTab('history')}
          >
            <History size={16} />
            My History
            {history.length > 0 && (
              <span className="nav-count-badge">{history.length}</span>
            )}
          </button>
        </div>

        {/* Live Engine Status Badge */}
        <div className="nav-status-badge">
          <div className="radar-dot" />
          <span>AI Ready</span>
        </div>
      </header>

      {/* ── FLOATING ERROR TOAST ── */}
      {error && (
        <div className="error-toast" role="alert">
          <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═══ VIEW 1: PROBLEM CATALOG (BENTO GRID) ═══ */}
      {activeTab === 'practice' && !selectedProblem && (
        <main className="catalog-container fade-in">
          <div className="hero-section">
            <div className="hero-pill">
              <Sparkles size={13} /> Practice LLD
            </div>
            <h1 className="hero-title">Practice Low-Level Design</h1>
            <p className="hero-subtitle">
              Pick a problem, write your classes and code, and get instant feedback and scores from AI.
            </p>
          </div>

          <div className="filter-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
              <BookOpen size={16} className="text-indigo-400" />
              <span>Problems ({filteredProblems.length})</span>
            </div>

            <div className="filter-pills">
              {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
                <button
                  key={diff}
                  className={`filter-pill ${difficultyFilter === diff ? 'active' : ''}`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="bento-grid">
            {loadingProblems ? (
              <>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 260 }} />)}
              </>
            ) : filteredProblems.length === 0 ? (
              <div className="empty-catalog-state">
                <BookOpen size={36} style={{ color: '#818cf8', opacity: 0.9 }} />
                <h3>No {difficultyFilter !== 'ALL' ? `${difficultyFilter} ` : ''}problems found</h3>
                <p>Try switching to another difficulty or show all available problems.</p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: 13, marginTop: 4 }}
                  onClick={() => setDifficultyFilter('ALL')}
                >
                  Show All Problems
                </button>
              </div>
            ) : (
              filteredProblems.map(p => (
                <div
                  key={p.id}
                  className="bento-card"
                  onClick={() => openProblem(p.id)}
                >
                  <div className="bento-card-top">
                    <span className={getBadgeClass(p.difficulty)}>{p.difficulty}</span>
                    <span className="bento-top-req">
                      <Layers size={12} />
                      {p.requirements?.length ?? 3} Rules
                    </span>
                  </div>
                  <h3 className="bento-title">{p.title}</h3>
                  <p className="bento-desc">{p.description}</p>
                  <div className="bento-tags-row">
                    {getProblemTags(p.title).map(tag => (
                      <span key={tag} className="bento-tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="bento-footer">
                    <button
                      type="button"
                      className="bento-preview-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewProblem(p);
                      }}
                      title="View problem details"
                    >
                      <Eye size={13} /> Details
                    </button>
                    <div className="bento-cta-btn">
                      Start <ChevronRight size={13} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* How It Works Workflow Strip */}
          <div className="how-it-works-strip">
            <div className="workflow-card">
              <div className="workflow-icon"><Code2 size={18} /></div>
              <div>
                <h4>1. Choose a Problem</h4>
                <p>Select real-world Low-Level Design questions with clear requirements.</p>
              </div>
            </div>
            <div className="workflow-card">
              <div className="workflow-icon"><Terminal size={18} /></div>
              <div>
                <h4>2. Write Clean Code</h4>
                <p>Structure your classes, interfaces, and methods in the split-screen editor.</p>
              </div>
            </div>
            <div className="workflow-card">
              <div className="workflow-icon"><Zap size={18} /></div>
              <div>
                <h4>3. Get Instant Scores</h4>
                <p>Receive rubric scores out of 10, key strengths, and clear improvement tips.</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ═══ VIEW 2: SPLIT-PANE ARCHITECTURE STUDIO ═══ */}
      {activeTab === 'practice' && selectedProblem && (
        <div className="studio-layout fade-in">
          {/* Left Specs Pane */}
          <aside className="studio-specs-pane">
            <div className="studio-specs-header">
              <button className="studio-back-btn" onClick={() => handleBackToProblems()}>
                <ArrowLeft size={15} /> Back to Problems
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <h2 className="studio-problem-title">{selectedProblem.title}</h2>
                <span className={getBadgeClass(selectedProblem.difficulty)}>{selectedProblem.difficulty}</span>
              </div>
              <p className="studio-problem-desc">{selectedProblem.description}</p>
            </div>

            <div className="studio-section-title">
              <Target size={14} className="text-indigo-400" /> Requirements
            </div>
            <div>
              {selectedProblem.requirements?.map((req, i) => (
                <div key={i} className="spec-item">
                  <div className="spec-dot" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="studio-section-title" style={{ marginTop: 24 }}>
              <ShieldCheck size={14} className="text-emerald-400" /> Helpful Tips
            </div>
            <div style={{ background: 'rgba(16, 22, 38, 0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              💡 Keep your classes simple, give each class one job, and make sure all requirements are covered.
            </div>
          </aside>

          {/* Right Editor Pane */}
          <main className="studio-editor-pane">
            <div className="editor-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="window-dots">
                  <div className="dot dot-r" />
                  <div className="dot dot-y" />
                  <div className="dot dot-g" />
                </div>
                <div className="file-tab">
                  <Terminal size={12} className="text-indigo-400" />
                  <span>Solution.ts</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={copySolutionCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: copiedCode ? '#34d399' : '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '5px 12px',
                    borderRadius: 8,
                    transition: 'all 0.18s'
                  }}
                  title="Copy Code"
                >
                  {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="editor-body">
              <textarea
                className="editor-textarea-pro"
                value={solutionText}
                onChange={e => setSolutionText(e.target.value)}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    submitSolution();
                  }
                }}
                placeholder={`// Write your classes and methods here:\n// e.g.\n// class ParkingLot {\n//   parkVehicle(vehicle) { ... }\n// }\n// Tip: Press Ctrl + Enter to submit`}
              />
            </div>

            <div className="studio-bottom-bar">
              <div className="studio-shortcut-hint">
                <span className="kbd-badge">Ctrl</span> + <span className="kbd-badge">Enter</span> to submit
                <span style={{ color: '#475569' }}>•</span>
                <span>{solutionText.length} characters</span>
              </div>

              <button
                className="btn-primary-glow"
                onClick={submitSolution}
                disabled={submitting || evaluationState === 'loading'}
              >
                {submitting || evaluationState === 'loading' ? (
                  <>Checking…</>
                ) : (
                  <><Sparkles size={15} /> Check My Code</>
                )}
              </button>
            </div>

            {/* In-Studio Radar Scanning Overlay */}
            {evaluationState === 'loading' && (
              <div className="scanning-overlay">
                <div className="radar-sphere">
                  <Cpu size={36} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
                    Checking your code…
                  </div>
                  <div style={{ fontSize: 13.5, color: '#64748b' }}>
                    Looking at your classes and preparing your feedback.
                  </div>
                </div>
              </div>
            )}

            {/* In-Studio AI Evaluation Drawer */}
            {evaluationState === 'completed' && evaluationResult && (
              <div className="evaluation-drawer">
                <div className="eval-hero-box">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                      ✓ Review Done
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>
                      Your Score & Feedback
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="score-display-box">
                      <div className="score-num">{evaluationResult.score?.overall}</div>
                      <div style={{ fontSize: 18, color: '#64748b', fontWeight: 700 }}>/10</div>
                    </div>
                    <button
                      onClick={() => setEvaluationState('none')}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#cbd5e1',
                        padding: '10px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <RotateCcw size={14} /> Edit Code
                    </button>
                  </div>
                </div>

                {/* Rubric Grid */}
                <div className="rubric-grid-2">
                  {[
                    { label: 'Requirements', key: 'requirements' as const, icon: <Target size={14} className="text-indigo-400" /> },
                    { label: 'Class Design', key: 'design' as const, icon: <GitBranch size={14} className="text-purple-400" /> },
                    { label: 'Easy to Extend', key: 'extensibility' as const, icon: <Boxes size={14} className="text-cyan-400" /> },
                    { label: 'Clean Code', key: 'codeQuality' as const, icon: <ShieldCheck size={14} className="text-emerald-400" /> },
                  ].map(({ label, key, icon }) => (
                    <div key={key} className="rubric-item-card">
                      <div className="rubric-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {icon} {label}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f8fafc' }}>
                          {evaluationResult.score?.[key]} / 10
                        </span>
                      </div>
                      <div className="rubric-track">
                        <div
                          className="rubric-fill"
                          style={{ width: `${((evaluationResult.score?.[key] ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Sections */}
                {evaluationResult.feedback && (
                  <div className="feedback-container">
                    <div className="feedback-bubble">
                      <div className="feedback-bubble-title" style={{ color: '#94a3b8' }}>
                        <BarChart3 size={15} /> Summary
                      </div>
                      <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7 }}>
                        {evaluationResult.feedback.summary}
                      </div>
                    </div>

                    <div className="rubric-grid-2">
                      <div className="feedback-bubble strengths-theme">
                        <div className="feedback-bubble-title">
                          <CheckCircle2 size={16} /> What Went Well
                        </div>
                        <ul className="bullet-list">
                          {evaluationResult.feedback.strengths?.map((s, i) => (
                            <li key={i}>
                              <span style={{ color: '#10b981' }}>✓</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="feedback-bubble improvements-theme">
                        <div className="feedback-bubble-title">
                          <AlertTriangle size={16} /> Things to Improve
                        </div>
                        <ul className="bullet-list">
                          {evaluationResult.feedback.improvements?.map((s, i) => (
                            <li key={i}>
                              <span style={{ color: '#f59e0b' }}>!</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {evaluationResult.feedback.recommendations && (
                      <div className="feedback-bubble recommendations-theme">
                        <div className="feedback-bubble-title">
                          <Lightbulb size={16} /> Helpful Suggestions
                        </div>
                        <ul className="bullet-list">
                          {evaluationResult.feedback.recommendations.map((s, i) => (
                            <li key={i}>
                              <span style={{ color: '#818cf8' }}>⚡</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ═══ VIEW 3: MASTER-DETAIL HISTORY INSPECTOR ═══ */}
      {activeTab === 'history' && (
        <main className="history-layout fade-in">
          <div className="history-grid-view">
            {/* Left Master List */}
            <div className="history-master-pane">
              <div className="history-pane-header">
                <div className="history-pane-title">My Attempts ({history.length})</div>
              </div>

              <div className="history-items-scroll">
                {loadingHistory ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading attempts…</div>
                ) : history.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No attempts yet. Pick a problem from the Practice tab!
                  </div>
                ) : (
                  history.map(att => (
                    <div
                      key={att.id}
                      className={`history-item-row ${selectedHistoryId === att.id ? 'active' : ''}`}
                      onClick={() => selectHistoryItem(att.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div className="history-item-title">{att.problemTitle}</div>
                        <button
                          className="btn-icon-del"
                          onClick={(e) => promptDeleteAttempt(att, e)}
                          disabled={deletingAttemptId === att.id}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="history-item-sub">
                        <span className={getStatusChipClass(att.status)}>{att.status.replace('_', ' ')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {new Date(att.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Detail Inspector Pane */}
            <div className="history-detail-pane">
              {selectedAttempt ? (
                <>
                  <div className="history-detail-header">
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
                        {selectedAttempt.problemTitle}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} />
                        Attempt #{selectedAttempt.id.substring(0, 14)}… • {new Date(selectedAttempt.startedAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={getStatusChipClass(selectedAttempt.status)}>
                        {selectedAttempt.status.replace('_', ' ')}
                      </span>
                      <button
                        className="btn-primary-glow"
                        style={{ padding: '8px 18px', fontSize: 13 }}
                        onClick={() => resumeAttempt(selectedAttempt)}
                      >
                        <Play size={13} fill="currentColor" /> Open in Editor
                      </button>
                    </div>
                  </div>

                  {loadingHistoryDetail ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading details…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {/* Submitted Solution Code */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Terminal size={14} /> Your Solution Code
                        </div>
                        {historyDetailData?.submission?.solution ? (
                          <pre className="code-box-preview">{historyDetailData.submission.solution}</pre>
                        ) : (
                          <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', padding: 18, background: 'rgba(16,22,38,0.4)', borderRadius: 10 }}>
                            No code was saved for this draft.
                          </div>
                        )}
                      </div>

                      {/* AI Evaluation Report */}
                      {historyDetailData?.evaluation && historyDetailData.evaluation.score && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                              AI Score & Feedback
                            </div>
                            <div className="score-display-box" style={{ padding: '8px 20px' }}>
                              <div className="score-num" style={{ fontSize: 32 }}>{historyDetailData.evaluation.score.overall}</div>
                              <div style={{ fontSize: 16, color: '#64748b', fontWeight: 700 }}>/10</div>
                            </div>
                          </div>

                          {/* Rubric scores */}
                          <div className="rubric-grid-2">
                            {[
                              { label: 'Requirements', key: 'requirements' as const },
                              { label: 'Class Design', key: 'design' as const },
                              { label: 'Easy to Extend', key: 'extensibility' as const },
                              { label: 'Clean Code', key: 'codeQuality' as const },
                            ].map(({ label, key }) => (
                              <div key={key} className="rubric-item-card">
                                <div className="rubric-header">
                                  <span>{label}</span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                    {historyDetailData.evaluation?.score?.[key]} / 10
                                  </span>
                                </div>
                                <div className="rubric-track">
                                  <div
                                    className="rubric-fill"
                                    style={{ width: `${((historyDetailData.evaluation?.score?.[key] ?? 0) / 10) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Feedback Summary */}
                          {historyDetailData.evaluation.feedback && (
                            <div className="feedback-container">
                              <div className="feedback-bubble">
                                <div className="feedback-bubble-title" style={{ color: '#94a3b8' }}>Summary</div>
                                <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6 }}>
                                  {historyDetailData.evaluation.feedback.summary}
                                </div>
                              </div>

                              <div className="rubric-grid-2">
                                <div className="feedback-bubble strengths-theme">
                                  <div className="feedback-bubble-title">What Went Well</div>
                                  <ul className="bullet-list">
                                    {historyDetailData.evaluation.feedback.strengths?.map((s, i) => (
                                      <li key={i}><span style={{ color: '#10b981' }}>✓</span> {s}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="feedback-bubble improvements-theme">
                                  <div className="feedback-bubble-title">Things to Improve</div>
                                  <ul className="bullet-list">
                                    {historyDetailData.evaluation.feedback.improvements?.map((s, i) => (
                                      <li key={i}><span style={{ color: '#f59e0b' }}>!</span> {s}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                  Select an attempt on the left to see your code and score.
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── CUSTOM DELETE CONFIRMATION POPUP ── */}
      {attemptToDelete && (
        <div className="modal-backdrop" onClick={() => setAttemptToDelete(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setAttemptToDelete(null)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="modal-icon-badge danger">
              <Trash2 size={22} />
            </div>

            <h3 className="modal-title">Delete Attempt?</h3>
            <p className="modal-body">
              Are you sure you want to delete your attempt for <strong style={{ color: '#f1f5f9' }}>{attemptToDelete.problemTitle}</strong>?
              This will permanently remove your solution code and AI evaluation score.
            </p>

            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setAttemptToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn-modal-danger"
                onClick={executeDeleteAttempt}
                disabled={deletingAttemptId === attemptToDelete.id}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM PROBLEM DETAILS POPUP ── */}
      {previewProblem && (
        <div className="modal-backdrop" onClick={() => setPreviewProblem(null)}>
          <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setPreviewProblem(null)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className={getBadgeClass(previewProblem.difficulty)}>{previewProblem.difficulty}</span>
              <span className="bento-top-req">
                <Layers size={12} />
                {previewProblem.requirements?.length ?? 3} Rules
              </span>
            </div>

            <h3 className="modal-title" style={{ fontSize: 22 }}>{previewProblem.title}</h3>
            <p className="modal-body" style={{ marginBottom: 18 }}>
              {previewProblem.description}
            </p>

            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', marginBottom: 10 }}>
              Problem Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 200, overflowY: 'auto' }}>
              {previewProblem.requirements?.map((req, i) => (
                <div key={i} className="spec-item" style={{ padding: '10px 12px', fontSize: 13, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="spec-dot" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setPreviewProblem(null)}
              >
                Close
              </button>
              <button
                className="btn-primary-glow"
                style={{ padding: '10px 22px', fontSize: 13 }}
                onClick={() => {
                  const p = previewProblem;
                  setPreviewProblem(null);
                  openProblem(p.id);
                }}
              >
                Start Problem <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
