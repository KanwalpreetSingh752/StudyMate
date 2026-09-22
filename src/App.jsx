import React, { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Flame,
  Headphones,
  HelpCircle,
  Home,
  Lightbulb,
  ListChecks,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UserRound as UserIcon,
  Volume2,
  X,
  Zap
} from "lucide-react";
import { askNotes as askNotesApi, generateQuiz as generateQuizApi } from "./api";

const initialDocs = [
  { id: 1, name: "Biology_Ch12_Genetics.pdf", type: "PDF", meta: "48 pages", status: "Indexed", color: "violet" },
  { id: 2, name: "Cell_Division_Slides.pptx", type: "PPT", meta: "24 slides", status: "Indexed", color: "yellow" },
  { id: 3, name: "Exam_Paper_2023.docx", type: "DOCX", meta: "analyzing patterns", status: "Analyzing", color: "pink" },
  { id: 4, name: "Mitosis & Meiosis Notes", type: "NOTE", meta: "6 pages", status: "Ready", color: "mint" }
];

const initialPlan = [
  { id: 1, title: "Review mitosis notes", time: "25 min", done: true },
  { id: 2, title: "Take genetics quiz", time: "15 min", done: true },
  { id: 3, title: "Adaptive practice: Mendelian inheritance", time: "20 min", done: false },
  { id: 4, title: "Analyze 2023 exam paper", time: "20 min", done: false }
];

const quizBank = {
  "Mendelian inheritance": [
    { q: "Which law states that allele pairs separate during gamete formation?", options: ["Law of Dominance", "Law of Segregation", "Law of Independent Assortment", "Law of Variation"], answer: 1, explain: "Mendel's Law of Segregation states that the two alleles of a gene separate during gamete formation." },
    { q: "A heterozygous genotype is represented by:", options: ["AA", "aa", "Aa", "XX"], answer: 2, explain: "Aa contains two different alleles, so it is heterozygous." },
    { q: "In a typical Aa × Aa cross, the expected phenotype ratio for complete dominance is:", options: ["1:1", "2:1", "3:1", "9:3:3:1"], answer: 2, explain: "A monohybrid cross with complete dominance gives a 3:1 phenotype ratio." },
    { q: "Which term describes the observable trait of an organism?", options: ["Genotype", "Phenotype", "Allele", "Locus"], answer: 1, explain: "Phenotype is the observable expression of traits." },
    { q: "A recessive phenotype generally appears when the genotype is:", options: ["AA", "Aa", "aa", "A_ only"], answer: 2, explain: "Under complete dominance, the recessive phenotype requires two recessive alleles." }
  ],
  "PCA with SVD": [
    { q: "What is the main purpose of PCA?", options: ["Increase dimensions", "Reduce dimensionality", "Encrypt data", "Sort data"], answer: 1, explain: "PCA transforms data into fewer orthogonal components while retaining as much variance as possible." },
    { q: "SVD decomposes a matrix into:", options: ["ABC", "UΣVᵀ", "XY", "QKᵀ"], answer: 1, explain: "Singular Value Decomposition writes A as UΣVᵀ." },
    { q: "The first principal component captures:", options: ["Least variance", "Random variance", "Maximum variance", "Only noise"], answer: 2, explain: "PC1 is the direction that captures the maximum variance." }
  ]
};

const answerByTopic = {
  "mitosis": {
    answer: "Mitosis is one cell division that produces two genetically similar daughter cells. It is used for growth, repair, and asexual reproduction in some organisms.",
    source: "Mitosis & Meiosis Notes",
    section: "Cell division → Mitosis"
  },
  "meiosis": {
    answer: "Meiosis involves two successive divisions and produces four genetically different haploid cells. Crossing-over and independent assortment create genetic variation.",
    source: "Cell_Division_Slides.pptx",
    section: "Meiosis → Prophase I"
  },
  "pca": {
    answer: "Principal Component Analysis (PCA) is a dimensionality-reduction technique. It transforms correlated features into orthogonal principal components ordered by explained variance. SVD can be used to compute these components efficiently.",
    source: "Section 19-PCA with SVD.pptx",
    section: "PCA → SVD"
  },
  "svd": {
    answer: "Singular Value Decomposition factorizes a matrix A into UΣVᵀ. In PCA, the right singular vectors provide principal directions and the singular values relate to the amount of variance captured.",
    source: "Section 19-PCA with SVD.pptx",
    section: "SVD decomposition"
  },
  "inheritance": {
    answer: "Mendelian inheritance explains how traits are passed through alleles. Key ideas include dominance, segregation, independent assortment, genotype, phenotype, homozygous and heterozygous states.",
    source: "Biology_Ch12_Genetics.pdf",
    section: "Mendelian inheritance"
  }
};

function findAnswer(question) {
  const q = question.toLowerCase();
  const key = Object.keys(answerByTopic).find(k => q.includes(k));
  return answerByTopic[key || "inheritance"];
}

function IconButton({ children, title, onClick, active = false }) {
  return (
    <button className={`icon-btn ${active ? "active" : ""}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function App() {
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem("studymate_user") || "null"); }
    catch { return null; }
  })();

  const [active, setActive] = useState("Dashboard");
  const [user, setUser] = useState(savedUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState("Beginner");
  const [docs, setDocs] = useState(initialDocs);
  const [plan, setPlan] = useState(initialPlan);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState("Mendelian inheritance");
  const [quiz, setQuiz] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [agentLog, setAgentLog] = useState([]);
  const [listening, setListening] = useState(false);
  const [paperAnalyzed, setPaperAnalyzed] = useState(false);
  const fileRef = useRef(null);

  const filteredDocs = useMemo(
    () => docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [docs, search]
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const nav = [
    { label: "Dashboard", icon: Home },
    { label: "Ask My Notes", icon: MessageCircle },
    { label: "Quiz Generator", icon: ListChecks },
    { label: "Adaptive Practice", icon: Target },
    { label: "Study Planner", icon: CalendarDays },
    { label: "Paper Analyzer", icon: FileText },
    { label: "AI Study Agent", icon: Bot },
    { label: "Voice Tutor", icon: Headphones }
  ];

  const stats = [
    { label: "Quiz score", value: "82%", delta: "+6% this week", icon: Trophy, tone: "blue" },
    { label: "Topics done", value: "18/24", delta: "75% complete", icon: CheckCircle2, tone: "mint" },
    { label: "Weak topics", value: "3", delta: "needs practice", icon: Target, tone: "rose" },
    { label: "Documents", value: docs.length, delta: `${docs.filter(d => d.status === "Indexed").length} indexed`, icon: BookOpen, tone: "gold" }
  ];

  const requireAuth = (nextAction = "continue") => {
    if (user) return true;
    setAuthMode("login");
    setAuthOpen(true);
    showToast(`Please login or sign up to ${nextAction}.`);
    return false;
  };

  const openUpload = () => {
    if (!requireAuth("upload study material")) return;
    setUploadOpen(true);
  };

  const askNotes = async () => {
    if (!requireAuth("ask your notes")) return;
    if (!question.trim()) return;
    const userQ = question.trim();
    setQuestion("");
    setChat(prev => [...prev, { role: "user", text: userQ }]);

    try {
      const apiResult = await askNotesApi(userQ, mode);
      const result = apiResult?.answer
        ? {
            answer: apiResult.answer,
            source: apiResult.source || "Uploaded notes",
            section: apiResult.section || "Relevant section"
          }
        : findAnswer(userQ);

      setTimeout(() => {
        setChat(prev => [...prev, { role: "assistant", ...result, mode }]);
      }, 350);
    } catch {
      const result = findAnswer(userQ);
      setChat(prev => [...prev, { role: "assistant", ...result, mode }]);
      showToast("Backend unavailable — showing demo RAG response.");
    }
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech synthesis is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    showToast("Voice explanation started.");
  };

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("Voice input is not supported. Try Chrome.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      showToast("Could not hear that. Please try again.");
    };
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuestion(text);
      setActive("Ask My Notes");
    };
    recognition.start();
  };

  const handleFiles = (fileList) => {
    const accepted = Array.from(fileList || []).filter(file =>
      /\.(pdf|ppt|pptx|doc|docx|txt|md)$/i.test(file.name)
    );
    if (!accepted.length) {
      showToast("Please select PDF, PPT/PPTX, DOC/DOCX, TXT or MD files.");
      return;
    }
    const additions = accepted.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      type: file.name.split(".").pop().toUpperCase(),
      meta: file.type || "uploaded file",
      status: "Indexing",
      color: ["violet", "yellow", "pink", "mint"][i % 4]
    }));
    setDocs(prev => [...additions, ...prev]);
    setUploadOpen(false);
    showToast(`${accepted.length} document${accepted.length > 1 ? "s" : ""} added. Indexing started.`);
    setTimeout(() => {
      setDocs(prev => prev.map(d => additions.some(a => a.id === d.id) ? { ...d, status: "Indexed" } : d));
    }, 1400);
  };

  const openQuiz = async (topic = quizTopic) => {
    if (!requireAuth("generate or take a quiz")) return;
    setQuizTopic(topic);
    setQuizFinished(false);
    setQuizIndex(0);
    setQuizAnswers({});
    const local = quizBank[topic] || quizBank["Mendelian inheritance"];
    try {
      const api = await generateQuizApi(topic, mode, 5);
      setQuiz(api?.questions || local);
    } catch {
      setQuiz(local);
      showToast("Using demo quiz — connect backend for AI-generated questions.");
    }
    setQuizOpen(true);
  };

  const answerQuiz = (option) => {
    setQuizAnswers(prev => ({ ...prev, [quizIndex]: option }));
  };

  const finishQuiz = () => setQuizFinished(true);

  const quizScore = quiz.length
    ? Math.round(
        (quiz.filter((q, i) => quizAnswers[i] === q.answer).length / quiz.length) * 100
      )
    : 0;

  const togglePlan = (id) => {
    setPlan(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleAuth = (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = JSON.parse(localStorage.getItem("studymate_accounts") || "{}");

    if (authMode === "signup") {
      if (accounts[cleanEmail]) {
        showToast("An account already exists. Please login.");
        setAuthMode("login");
        return;
      }
      const cleanName = name.trim();
      accounts[cleanEmail] = { name: cleanName, email: cleanEmail, password };
      localStorage.setItem("studymate_accounts", JSON.stringify(accounts));
      const nextUser = { name: cleanName, email: cleanEmail };
      localStorage.setItem("studymate_user", JSON.stringify(nextUser));
      setUser(nextUser);
      setAuthOpen(false);
      showToast(`Welcome to StudyMate, ${cleanName}!`);
      return;
    }

    const account = accounts[cleanEmail];
    if (!account || account.password !== password) {
      showToast("Invalid email or password.");
      return;
    }
    const nextUser = { name: account.name, email: account.email };
    localStorage.setItem("studymate_user", JSON.stringify(nextUser));
    setUser(nextUser);
    setAuthOpen(false);
    showToast(`Welcome back, ${account.name}!`);
  };

  const logout = () => {
    localStorage.removeItem("studymate_user");
    setUser(null);
    setProfileOpen(false);
    showToast("Logged out successfully.");
  };

  const runAgent = (action) => {
    const map = {
      "Search notes": "RAG search completed. Found relevant passages in your indexed material.",
      "Explain topic": "Tutor mode selected. Explanation adapted to your current learning level.",
      "Generate quiz": "Quiz action selected. Questions are being generated from your notes.",
      "Analyze performance": "Performance analysis completed. 3 weak areas need more practice.",
      "Create study plan": "Study planner selected. Your unfinished tasks were prioritized."
    };
    setAgentLog(prev => [{ action, result: map[action], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    if (action === "Generate quiz") openQuiz("Mendelian inheritance");
    if (action === "Create study plan") setActive("Study Planner");
    if (action === "Search notes") setActive("Ask My Notes");
    showToast(`${action} executed.`);
  };

  const analyzePaper = () => {
    if (!requireAuth("analyze a question paper")) return;
    setPaperAnalyzed(true);
    showToast("2023 paper analyzed. Repeated concepts found.");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand">
          <div className="brand-mark"><Brain size={23} /></div>
          {sidebarOpen && <div><strong>StudyMate</strong><span>AI Study Assistant</span></div>}
        </div>

        <button className="profile-card profile-card-button" onClick={() => { if (!user) { setAuthMode("login"); setAuthOpen(true); } else { setProfileOpen(v => !v); } }}>
          <div className="avatar">{user ? user.name.charAt(0).toUpperCase() : <UserIcon size={17}/>}</div>
          {sidebarOpen && <div><strong>{user ? user.name : "Login / Sign up"}</strong><span>{user ? "Week 3 · 75% progress" : "Create your student account"}</span></div>}
          {sidebarOpen && <MoreHorizontal size={17} className="muted-icon" />}
        </button>

        <nav>
          {nav.map(item => {
            const I = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${active === item.label ? "selected" : ""}`}
                onClick={() => setActive(item.label)}
                title={item.label}
              >
                <I size={18} />
                {sidebarOpen && <span>{item.label}</span>}
                {item.label === "Adaptive Practice" && sidebarOpen && <span className="nav-dot">3</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => showToast("Settings panel coming next.")}><Settings size={18}/>{sidebarOpen && "Settings"}</button>
          <div className="ai-safe"><ShieldCheck size={16}/>{sidebarOpen && <span>Responsible AI enabled</span>}</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}><Menu size={22}/></button>
            <div>
              <div className="eyebrow"><span>TUESDAY</span><i/> WEEK 3</div>
              <h1>Good morning, {user?.name || "Student"} <span>✦</span></h1>
            </div>
          </div>
          <div className="top-actions">
            <div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." /></div>
            <IconButton title="Notifications" onClick={() => showToast("You're all caught up.")}><Bell size={18}/></IconButton>
            {user ? (
              <div className="profile-menu-wrap">
                <button className="profile-chip" onClick={() => setProfileOpen(v => !v)}>
                  <span className="profile-avatar-small">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="profile-chip-name">{user.name}</span>
                  <ChevronDown size={14}/>
                </button>
                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-head">
                      <span className="profile-avatar-large">{user.name.charAt(0).toUpperCase()}</span>
                      <div><strong>{user.name}</strong><small>{user.email}</small></div>
                    </div>
                    <button onClick={() => { setProfileOpen(false); showToast("Profile settings coming next."); }}><Settings size={15}/> Profile settings</button>
                    <button className="logout-btn" onClick={logout}><RotateCcw size={15}/> Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-btn" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>
                <span className="login-avatar"><UserIcon/></span> Login / Sign up
              </button>
            )}
            <button className="upload-btn" onClick={openUpload}><Upload size={17}/> Upload</button>
          </div>
        </header>

        <section className="hero-actions">
          <button className="primary-action" onClick={() => setActive("Ask My Notes")}><MessageCircle size={18}/> Ask my notes</button>
          <button className="soft-action" onClick={() => openQuiz()}><Sparkles size={18}/> Generate quiz</button>
          <button className="soft-action" onClick={() => setActive("Study Planner")}><CalendarDays size={18}/> Study plan</button>
          <button className="soft-action" onClick={() => setActive("Voice Tutor")}><Headphones size={18}/> Voice tutor</button>
        </section>

        <div className="content">
          {active === "Dashboard" && (
            <>
              <section className="welcome-card">
                <div>
                  <span className="mini-label">YOUR LEARNING SNAPSHOT</span>
                  <h2>Keep your streak alive 🔥</h2>
                  <p>You have <strong>2 tasks</strong> left today. Spend 20 minutes on Mendelian inheritance and you'll clear your current weak topic.</p>
                  <button className="dark-btn" onClick={() => setActive("Adaptive Practice")}>Continue learning <ArrowRight size={17}/></button>
                </div>
                <div className="streak">
                  <Flame size={28}/>
                  <strong>7</strong>
                  <span>day streak</span>
                </div>
              </section>

              <section className="stats-grid">
                {stats.map(s => {
                  const I = s.icon;
                  return <div className="stat-card" key={s.label}>
                    <div className={`stat-icon ${s.tone}`}><I size={18}/></div>
                    <span className="mini-label">{s.label}</span>
                    <strong>{s.value}</strong>
                    <small>{s.delta}</small>
                  </div>
                })}
              </section>

              <div className="two-col">
                <section className="panel">
                  <PanelHead title="Today's study plan" icon={<CalendarDays size={18}/>} action="View plan" onAction={() => setActive("Study Planner")}/>
                  <div className="progress-line"><span style={{width: "50%"}}/></div>
                  <div className="plan-list compact">
                    {plan.map(item => <PlanRow key={item.id} item={item} onToggle={togglePlan}/>)}
                  </div>
                </section>

                <section className="panel">
                  <PanelHead title="Performance overview" icon={<BarChart3 size={18}/>} action="Details" onAction={() => setActive("Adaptive Practice")}/>
                  <div className="score-row"><div><span>Average quiz score</span><strong>82%</strong></div><div className="trend">↗ 6%</div></div>
                  <div className="bar-chart">
                    {[58, 70, 62, 82, 74, 91, 82].map((v, i) => <div className="bar-wrap" key={i}><div className="bar" style={{height: `${v}%`}}/><small>{["M","T","W","T","F","S","S"][i]}</small></div>)}
                  </div>
                </section>
              </div>

              <section className="panel">
                <PanelHead title="Recent documents" icon={<BookOpen size={18}/>} action="Add file +" onAction={openUpload}/>
                <div className="doc-grid">
                  {filteredDocs.slice(0, 4).map(doc => <DocCard key={doc.id} doc={doc}/>)}
                </div>
              </section>

              <div className="feature-grid">
                <FeatureCard icon={<Target/>} title="Adaptive practice" text="3 questions tailored to your weak topic" onClick={() => setActive("Adaptive Practice")}/>
                <FeatureCard icon={<FileText/>} title="Analyze a paper" text="Find repeated concepts in past exams" onClick={() => setActive("Paper Analyzer")}/>
                <FeatureCard icon={<Headphones/>} title="Voice tutor" text="Ask aloud and listen to explanations" onClick={() => setActive("Voice Tutor")}/>
              </div>

              <section className="responsible">
                <ShieldCheck size={22}/>
                <div><strong>Responsible AI reminder</strong><p>StudyMate answers from your uploaded material first, labels AI-generated explanations, shows sources, and says when your notes do not contain the answer.</p></div>
              </section>
            </>
          )}

          {active === "Ask My Notes" && (
            <AskNotesPage
              mode={mode}
              setMode={setMode}
              question={question}
              setQuestion={setQuestion}
              chat={chat}
              askNotes={askNotes}
              speak={speak}
              listening={listening}
              startListening={startListening}
              docs={docs}
            />
          )}

          {active === "Quiz Generator" && (
            <QuizPage topic={quizTopic} setTopic={setQuizTopic} mode={mode} setMode={setMode} openQuiz={openQuiz} />
          )}

          {active === "Adaptive Practice" && (
            <AdaptivePage openQuiz={openQuiz} />
          )}

          {active === "Study Planner" && (
            <PlannerPage plan={plan} togglePlan={togglePlan} />
          )}

          {active === "Paper Analyzer" && (
            <PaperPage analyzed={paperAnalyzed} analyze={analyzePaper} onUpload={openUpload} />
          )}

          {active === "AI Study Agent" && (
            <AgentPage log={agentLog} runAgent={runAgent}/>
          )}

          {active === "Voice Tutor" && (
            <VoicePage question={question} setQuestion={setQuestion} startListening={startListening} listening={listening} askNotes={askNotes} speak={speak}/>
          )}
        </div>

        <footer>
          <span>StudyMate AI · Demo frontend</span>
          <span>AI-generated content should be verified against your source material.</span>
        </footer>
      </main>

      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthOpen(false)}
          onSubmit={handleAuth}
        />
      )}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onFiles={handleFiles} fileRef={fileRef}/>}
      {quizOpen && (
        <QuizModal
          topic={quizTopic}
          quiz={quiz}
          index={quizIndex}
          answers={quizAnswers}
          finished={quizFinished}
          score={quizScore}
          onClose={() => setQuizOpen(false)}
          onAnswer={answerQuiz}
          onNext={() => setQuizIndex(i => Math.min(i + 1, quiz.length - 1))}
          onFinish={finishQuiz}
          speak={speak}
        />
      )}
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function PanelHead({ title, icon, action, onAction }) {
  return <div className="panel-head"><div className="panel-title">{icon}<h3>{title}</h3></div>{action && <button onClick={onAction}>{action}</button>}</div>;
}

function PlanRow({ item, onToggle }) {
  return <button className={`plan-row ${item.done ? "done" : ""}`} onClick={() => onToggle(item.id)}>
    <span className={`check ${item.done ? "checked" : ""}`}>{item.done && <Check size={14}/>}</span>
    <span className="plan-title">{item.title}</span>
    <span className="time">{item.time}</span>
  </button>;
}

function DocCard({ doc }) {
  return <div className="doc-card">
    <div className={`file-badge ${doc.color}`}>{doc.type.slice(0,4)}</div>
    <div className="doc-info"><strong>{doc.name}</strong><span>{doc.meta}</span></div>
    <span className={`status ${doc.status.toLowerCase()}`}>{doc.status}</span>
  </div>;
}

function FeatureCard({ icon, title, text, onClick }) {
  return <button className="feature-card" onClick={onClick}><div className="feature-icon">{icon}</div><div><strong>{title}</strong><span>{text}</span></div><ArrowRight size={17}/></button>;
}

function ModePicker({ mode, setMode }) {
  return <div className="mode-picker">{["Beginner","Intermediate","Advanced","Exam Mode"].map(m => <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}>{m}</button>)}</div>;
}

function AskNotesPage({ mode, setMode, question, setQuestion, chat, askNotes, speak, listening, startListening, docs }) {
  return <div className="page">
    <PageTitle eyebrow="RAG · CITED" title="Ask my notes" subtitle="Ask questions grounded in your uploaded study material." icon={<MessageCircle/>}/>
    <div className="page-grid ask-grid">
      <section className="panel chat-panel">
        <div className="panel-head"><div><span className="mini-label">LEARNING MODE</span><h3>{mode}</h3></div><ModePicker mode={mode} setMode={setMode}/></div>
        <div className="chat-area">
          {chat.length === 0 ? <div className="empty-chat"><Sparkles size={30}/><h3>Your notes, your tutor.</h3><p>Try asking “Explain PCA with SVD” or “What is crossing-over?”</p><div className="suggestions"><button onClick={() => setQuestion("Explain PCA with SVD")}>Explain PCA with SVD</button><button onClick={() => setQuestion("What is mitosis?")}>What is mitosis?</button><button onClick={() => setQuestion("Explain Mendelian inheritance")}>Mendelian inheritance</button></div></div> :
            chat.map((m, i) => <div className={`message ${m.role}`} key={i}>
              <div className="message-avatar">{m.role === "user" ? "P" : <Bot size={17}/>}</div>
              <div className="message-body"><p>{m.text || m.answer}</p>{m.role === "assistant" && <><div className="citation"><FileText size={14}/><span>{m.source} · {m.section}</span><span className="cited">CITED</span></div><small>Explained in {m.mode} mode · AI-generated from indexed notes</small><button className="listen-inline" onClick={() => speak(m.answer)}><Volume2 size={14}/> Listen</button></>}</div>
            </div>)}
          </div>
          <div className="ask-input"><textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if(e.key==="Enter" && !e.shiftKey){e.preventDefault(); askNotes();}}} placeholder="Ask a question from your notes..."/><div className="input-footer"><span><Paperclip size={15}/> {docs.length} indexed sources</span><div><button className={listening ? "recording" : ""} onClick={startListening}><Mic size={17}/></button><button className="send" onClick={askNotes}><ArrowRight size={18}/></button></div></div></div>
      </section>
      <aside className="side-stack">
        <div className="mini-panel"><div className="mini-panel-title"><Filter size={17}/> Retrieved sources</div>{docs.filter(d=>d.status==="Indexed").map(d => <div className="source-row" key={d.id}><div className="source-dot"/><span>{d.name}</span><small>indexed</small></div>)}</div>
        <div className="mini-panel mode-info"><Lightbulb size={19}/><div><strong>{mode} mode</strong><p>{mode === "Beginner" ? "Simple language, intuition and examples." : mode === "Intermediate" ? "Concepts plus practical details." : mode === "Advanced" ? "Technical depth, assumptions and edge cases." : "Exam-style definitions, traps and quick revision."}</p></div></div>
      </aside>
    </div>
  </div>;
}

function QuizPage({ topic, setTopic, mode, setMode, openQuiz }) {
  return <div className="page">
    <PageTitle eyebrow="GENERATE · PRACTICE · SCORE" title="Quiz generator" subtitle="Create quizzes directly from your indexed notes." icon={<ListChecks/>}/>
    <section className="panel generator-card">
      <div className="form-row"><label>Topic<input value={topic} onChange={e => setTopic(e.target.value)} /></label><label>Question type<select defaultValue="MCQ + T/F"><option>MCQ + T/F</option><option>MCQ only</option><option>True / False</option></select></label></div>
      <ModePicker mode={mode} setMode={setMode}/>
      <div className="quick-topics"><span>Quick topics:</span><button onClick={() => setTopic("Mendelian inheritance")}>Mendelian inheritance</button><button onClick={() => setTopic("PCA with SVD")}>PCA with SVD</button><button onClick={() => setTopic("Mitosis & Meiosis")}>Mitosis & Meiosis</button></div>
      <button className="dark-btn large" onClick={() => openQuiz(topic)}><Sparkles size={18}/> Generate 5 questions <ArrowRight size={17}/></button>
    </section>
    <div className="two-col">
      <section className="panel">
        <PanelHead title="Latest quiz result" icon={<Trophy/>}/>
        <div className="result-big"><strong>82%</strong><span>+6% this week</span></div>
        <div className="result-bars"><div><span>Correct</span><b style={{width:"82%"}}/></div><div><span>Needs review</span><b style={{width:"18%"}}/></div></div>
      </section>
      <section className="panel">
        <PanelHead title="Quiz behavior" icon={<Activity/>}/>
        <ul className="check-list"><li><CheckCircle2/> Generates from indexed material</li><li><CheckCircle2/> Evaluates answers automatically</li><li><CheckCircle2/> Gives explanations after submission</li><li><CheckCircle2/> Feeds weak-topic detection</li></ul>
      </section>
    </div>
  </div>;
}

function AdaptivePage({ openQuiz }) {
  return <div className="page">
    <PageTitle eyebrow="PERSONALIZED PRACTICE" title="Adaptive practice" subtitle="Questions are targeted to the topics where your performance is lowest." icon={<Target/>}/>
    <section className="weak-hero"><div className="weak-icon"><Target/></div><div><span className="mini-label">WEAK TOPIC</span><h2>Mendelian inheritance</h2><p>Scored below 60% three times · confidence is improving slowly</p></div><div className="weak-score"><strong>56%</strong><span>current mastery</span></div></section>
    <div className="progress-line pink"><span style={{width:"56%"}}/></div>
    <section className="practice-grid">
      <div className="practice-card"><span className="number">01</span><h3>Dominance vs. segregation</h3><p>3 questions · beginner → intermediate</p><button onClick={() => openQuiz("Mendelian inheritance")}>Practice now <ArrowRight size={16}/></button></div>
      <div className="practice-card"><span className="number">02</span><h3>Monohybrid crosses</h3><p>5 questions · exam-focused</p><button onClick={() => openQuiz("Mendelian inheritance")}>Practice now <ArrowRight size={16}/></button></div>
      <div className="practice-card"><span className="number">03</span><h3>Genotype & phenotype</h3><p>3 questions · quick revision</p><button onClick={() => openQuiz("Mendelian inheritance")}>Practice now <ArrowRight size={16}/></button></div>
    </section>
    <section className="responsible"><ShieldCheck size={21}/><div><strong>Adaptive logic</strong><p>Repeated low scores create a weak-topic signal. Practice is then generated specifically around that topic instead of repeating a generic quiz.</p></div></section>
  </div>;
}

function PlannerPage({ plan, togglePlan }) {
  const done = plan.filter(x => x.done).length;
  return <div className="page">
    <PageTitle eyebrow="PERSONALIZED SCHEDULE" title="Today's study plan" subtitle="A lightweight plan based on weak areas, unfinished tasks and available time." icon={<CalendarDays/>}/>
    <section className="planner-summary"><div><span className="mini-label">TODAY</span><strong>{done} of {plan.length} done</strong><p>80 minutes planned · 40 minutes remaining</p></div><div className="planner-ring"><strong>{Math.round(done/plan.length*100)}%</strong></div></section>
    <section className="panel"><div className="plan-list">{plan.map(item => <PlanRow key={item.id} item={item} onToggle={togglePlan}/>)}</div></section>
    <div className="feature-grid"><FeatureCard icon={<Target/>} title="Weak-topic priority" text="Mendelian inheritance gets the next 20 minutes." onClick={()=>{}}/><FeatureCard icon={<Clock3/>} title="Available time" text="Plan fits into your remaining study window." onClick={()=>{}}/><FeatureCard icon={<Zap/>} title="Next best action" text="Complete adaptive practice before adding new topics." onClick={()=>{}}/></div>
  </div>;
}

function PaperPage({ analyzed, analyze, onUpload }) {
  return <div className="page">
    <PageTitle eyebrow="PAST PAPER INTELLIGENCE" title="Question paper analyzer" subtitle="Upload previous exams to discover repeated concepts and patterns." icon={<FileText/>}/>
    <section className="panel upload-paper">
      <div className="dropzone"><FileText size={32}/><h3>Drop an exam paper here</h3><p>PDF, DOCX or image · the analyzer looks for recurring concepts and question types.</p><button className="dark-btn" onClick={onUpload}><Upload size={17}/> Choose file</button></div>
    </section>
    {analyzed ? <section className="analysis-results">
      <div className="analysis-head"><div><span className="mini-label">ANALYSIS COMPLETE</span><h2>2023 exam paper</h2></div><span className="status indexed">Analyzed</span></div>
      <div className="pattern-grid"><Pattern title="Cell division" count="5 mentions" value="High"/><Pattern title="Mendelian inheritance" count="4 mentions" value="High"/><Pattern title="Chromosomal variation" count="3 mentions" value="Medium"/><Pattern title="PCA / SVD" count="2 mentions" value="Medium"/></div>
      <div className="responsible"><Lightbulb size={21}/><div><strong>Study insight</strong><p>Use repeated concepts as a revision checklist, but verify the actual source paper before assuming a topic will appear again.</p></div></div>
    </section> : <section className="panel empty-state"><FileText size={30}/><h3>No analysis yet</h3><p>Upload a previous paper and click analyze to see repeated concepts.</p><button className="soft-action" onClick={analyze}><Sparkles size={17}/> Analyze demo 2023 paper</button></section>}
  </div>;
}

function Pattern({title,count,value}) {
  return <div className="pattern"><div><strong>{title}</strong><span>{count}</span></div><span className={`pill ${value.toLowerCase()}`}>{value}</span></div>;
}

function AgentPage({ log, runAgent }) {
  const actions = [
    ["Search notes", Search, "Retrieve grounded content"],
    ["Explain topic", Bot, "Adapt explanation level"],
    ["Generate quiz", ListChecks, "Create a practice set"],
    ["Analyze performance", BarChart3, "Find weak areas"],
    ["Create study plan", CalendarDays, "Prioritize next tasks"]
  ];
  return <div className="page">
    <PageTitle eyebrow="ORCHESTRATION" title="AI Study Agent" subtitle="One assistant that routes your request to the right study action." icon={<Bot/>}/>
    <section className="agent-banner"><div className="agent-orb"><Bot/></div><div><span className="mini-label">STUDYMATE AGENT</span><h2>What should we do next?</h2><p>The agent can search, teach, quiz, analyze and plan — without making you navigate between tools.</p></div><span className="online"><i/> Online</span></section>
    <div className="agent-actions">{actions.map(([label,I,text]) => <button key={label} onClick={() => runAgent(label)}><div className="agent-action-icon"><I size={19}/></div><div><strong>{label}</strong><span>{text}</span></div><ArrowRight size={16}/></button>)}</div>
    <section className="panel"><PanelHead title="Agent activity" icon={<Activity/>}/>{log.length ? <div className="agent-log">{log.map((x,i)=><div className="log-row" key={i}><span>{x.time}</span><strong>{x.action}</strong><p>{x.result}</p></div>)}</div> : <div className="empty-state small"><Bot size={26}/><p>No actions yet. Choose an action above.</p></div>}</section>
  </div>;
}

function VoicePage({ question, setQuestion, startListening, listening, askNotes, speak }) {
  return <div className="page">
    <PageTitle eyebrow="SPEECH · TUTOR" title="Voice tutor" subtitle="Ask aloud and listen to a short explanation." icon={<Headphones/>}/>
    <section className="voice-hero">
      <div className={`voice-circle ${listening ? "listening" : ""}`} onClick={startListening}><Mic size={42}/><span>{listening ? "Listening…" : "Tap to speak"}</span></div>
      <h2>Talk to your notes</h2>
      <p>Browser speech input is used for the demo. Azure AI Speech can be connected in the backend for production voice.</p>
      <div className="voice-input"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Or type your question here…"/><button onClick={askNotes}><ArrowRight/></button></div>
    </section>
    <div className="two-col"><div className="panel"><PanelHead title="Quick voice prompts" icon={<Sparkles/>}/><div className="voice-prompts">{["Explain mitosis simply","Teach me PCA in 60 seconds","Quiz me on inheritance"].map(x=><button key={x} onClick={()=>setQuestion(x)}>{x}<ArrowRight size={15}/></button>)}</div></div><div className="panel"><PanelHead title="Playback" icon={<Volume2/>}/><p className="muted-copy">After an answer appears in Ask My Notes, use <strong>Listen</strong> to hear the explanation.</p><button className="soft-action" onClick={()=>speak("StudyMate is ready. Ask a question from your uploaded notes.")}><Volume2 size={17}/> Test voice</button></div></div>
  </div>;
}

function PageTitle({ eyebrow, title, subtitle, icon }) {
  return <div className="page-title"><div className="title-icon">{icon}</div><div><span className="mini-label">{eyebrow}</span><h2>{title}</h2><p>{subtitle}</p></div></div>;
}

function AuthModal({ mode, setMode, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !name.trim()) return setError("Please enter your name.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "signup" && password !== confirmPassword) return setError("Passwords do not match.");
    onSubmit(name, email, password);
  };

  return <div className="modal-backdrop">
    <div className="modal auth-modal">
      <button className="modal-close" onClick={onClose}><X/></button>
      <div className="auth-brand"><div className="auth-brand-mark"><Brain size={21}/></div><div><strong>StudyMate</strong><span>AI Study Assistant</span></div></div>
      <div className="auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("")}}>Login</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("")}}>Sign up</button>
      </div>
      <span className="mini-label">{mode === "login" ? "WELCOME BACK" : "CREATE YOUR STUDENT ACCOUNT"}</span>
      <h2>{mode === "login" ? "Welcome back 👋" : "Create your StudyMate account"}</h2>
      <p>{mode === "login" ? "Login to continue your personalized learning journey." : "Your name will be used only as your StudyMate display name."}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && <label>Name<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></label>}
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" /></label>
        {mode === "signup" && <label>Confirm password<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" /></label>}
        {error && <div className="auth-error">{error}</div>}
        <button className="dark-btn auth-submit" type="submit">{mode === "login" ? "Login to StudyMate" : "Create my account"} <ArrowRight size={16}/></button>
      </form>
      <div className="auth-demo"><ShieldCheck size={15}/><span>Frontend demo authentication stores the account in this browser. Connect your backend for secure production authentication.</span></div>
    </div>
  </div>;
}

function UploadModal({ onClose, onFiles, fileRef }) {
  return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={onClose}><X/></button><div className="modal-icon"><Upload/></div><span className="mini-label">UPLOAD STUDY MATERIAL</span><h2>Add your notes</h2><p>PDF, PPT/PPTX, DOC/DOCX, TXT and Markdown are supported.</p><div className="dropzone modal-drop" onClick={()=>fileRef.current?.click()}><Upload size={28}/><strong>Choose files</strong><span>or drag and drop here</span><input ref={fileRef} hidden multiple type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md" onChange={e=>onFiles(e.target.files)}/></div><div className="modal-note"><ShieldCheck size={16}/> Your frontend keeps the upload flow local until a backend/RAG service is connected.</div></div></div>;
}

function QuizModal({ topic, quiz, index, answers, finished, score, onClose, onAnswer, onNext, onFinish, speak }) {
  if (!quiz.length) return null;
  const current = quiz[index];
  return <div className="modal-backdrop"><div className="modal quiz-modal"><button className="modal-close" onClick={onClose}><X/></button>
    {!finished ? <>
      <div className="quiz-top"><span>{topic}</span><span>{index+1} / {quiz.length}</span></div>
      <div className="quiz-progress"><span style={{width:`${((index+1)/quiz.length)*100}%`}}/></div>
      <span className="mini-label">QUESTION {index+1}</span><h2>{current.q}</h2>
      <div className="quiz-options">{current.options.map((opt,i)=><button key={opt} className={answers[index] === i ? "chosen" : ""} onClick={()=>onAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{opt}</button>)}</div>
      <div className="quiz-footer">{index < quiz.length-1 ? <button className="dark-btn" disabled={answers[index] == null} onClick={onNext}>Next <ArrowRight size={16}/></button> : <button className="dark-btn" disabled={answers[index] == null} onClick={onFinish}>Finish quiz <Check size={16}/></button>}</div>
    </> : <>
      <div className="result-circle"><Trophy size={26}/><strong>{score}%</strong></div><span className="mini-label">QUIZ COMPLETE</span><h2>{score >= 80 ? "Great work!" : "Let's strengthen this topic."}</h2><p className="modal-sub">You answered {quiz.filter((q,i)=>answers[i]===q.answer).length} out of {quiz.length} correctly.</p>
      <div className="review-list">{quiz.map((q,i)=><div key={i} className={`review ${answers[i]===q.answer ? "correct" : "wrong"}`}><div><strong>{i+1}. {q.q}</strong><span>Your answer: {q.options[answers[i]] || "Not answered"}</span></div><b>{answers[i]===q.answer ? "Correct" : `Answer: ${q.options[q.answer]}`}</b></div>)}</div>
      <div className="modal-actions"><button className="soft-action" onClick={()=>speak(`You scored ${score} percent. Review the questions you missed and practice this topic again.`)}><Volume2 size={16}/> Listen to result</button><button className="dark-btn" onClick={onClose}>Done</button></div>
    </>}
  </div></div>;
}

export default App;
