"use client";

import { useState, useRef, useEffect } from "react";

/* ──────────────────────────────────────────────
   Reusable Course Card
   ────────────────────────────────────────────── */
const CourseCard = ({ course, showScore = false }) => {
  const isMiraCosta = course.college?.toLowerCase().includes("miracosta");
  const cardClass = isMiraCosta ? "course-card miracosta" : "course-card chico";
  const mapsLink = isMiraCosta
    ? "https://maps.google.com/maps?q=MiraCosta+College+Oceanside+CA"
    : "https://maps.google.com/maps?q=California+State+University+Chico+CA";

  return (
    <div className={cardClass}>
      <div className="card-header">
        <div className="card-title-area">
          <h3>{course.course_code}</h3>
          <p>{course.title}</p>
        </div>
        <div className="college-badge">
          {isMiraCosta ? "MiraCosta" : "CSU Chico"}
        </div>
      </div>

      <div className="card-badges">
        <div className="badge">
          <i className="fa-solid fa-graduation-cap"></i>
          <span>{course.units} Units</span>
        </div>
        {course.prerequisites &&
          course.prerequisites.toLowerCase() !== "none" &&
          course.prerequisites !== "Not specified" && (
            <div className="badge warning">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Prereqs Required</span>
            </div>
          )}
        {showScore && course.relevance_score && (
          <div className="badge">
            <i className="fa-solid fa-bullseye"></i>
            <span>Score: {course.relevance_score.toFixed(1)}</span>
          </div>
        )}
      </div>

      {course.prerequisites &&
        course.prerequisites.toLowerCase() !== "none" &&
        course.prerequisites !== "Not specified" && (
          <div className="prereq-box">
            <strong>📋 Prerequisites:</strong> {course.prerequisites}
          </div>
        )}

      <div className="card-description">
        {course.description?.substring(0, 200)}
        {course.description?.length > 200 ? "..." : ""}
      </div>

      {showScore && course.match_reason && (
        <div className="match-reason">
          🔍 Match: {course.match_reason}
        </div>
      )}

      <div className="card-action">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="maps-btn"
        >
          <i className="fa-solid fa-map-location-dot"></i>
          View Campus Location
        </a>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────────── */
const StatCard = ({ number, label, color }) => (
  <div className="stat-card" style={{ borderColor: color }}>
    <div className="stat-number" style={{ color }}>{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

/* ──────────────────────────────────────────────
   TAB: AI Chat
   ────────────────────────────────────────────── */
function AIChatTab() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am Campus Compass, your AI course advisor. What kind of classes are you looking for this semester?",
    },
  ]);
  const [activeCards, setActiveCards] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleQuickAction = (text) => setInput(text);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", content: userMessage }]);
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((p) => [
          ...p,
          { role: "assistant", content: data.response },
        ]);
        setActiveCards(data.course_cards?.length ? data.course_cards : []);
      } else {
        setMessages((p) => [
          ...p,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: "Network Error: Failed to connect to the server.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="main-content">
      <main className="chat-container">
        <header className="chat-header">
          <h2>Course Assistant</h2>
          <span className="model-badge">GPT-4o-mini Structured</span>
        </header>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">
                {msg.role === "user" ? "👤" : "🎓"}
              </div>
              <div className="message-content">
                <p
                  dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\n/g, "<br>"),
                  }}
                ></p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant typing">
              <div className="avatar">🎓</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-area">
          <div className="action-buttons">
            <button
              className="action-btn"
              onClick={() =>
                handleQuickAction("Find me some interesting science courses")
              }
            >
              🔍 Find Courses
            </button>
            <button
              className="action-btn"
              onClick={() =>
                handleQuickAction(
                  "What are the prerequisites for MATH 150?"
                )
              }
            >
              📚 Prerequisites
            </button>
            <button
              className="action-btn"
              onClick={() =>
                handleQuickAction("Where are the campus locations?")
              }
            >
              🗺️ Campus Locations
            </button>
          </div>
          <form id="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              id="user-input"
              placeholder="Ask about specific courses, prerequisites, or topics..."
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              id="send-button"
              disabled={isTyping || !input.trim()}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </main>

      <aside className="course-details-panel">
        <header className="details-header">
          <h2>📋 Course Information</h2>
        </header>
        <div className="cards-container">
          {activeCards.length > 0 ? (
            activeCards.map((c, i) => <CourseCard key={i} course={c} />)
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-layer-group"></i>
              <h3>No Active Courses</h3>
              <p>
                Start chatting to see detailed course information here!
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TAB: Search
   ────────────────────────────────────────────── */
function SearchTab() {
  const [query, setQuery] = useState("");
  const [college, setCollege] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, college: college || null }),
      });
      const data = await res.json();
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>🔍 Course Search</h2>
        <p>Search 1,764 courses across MiraCosta College and CSU Chico</p>
      </div>
      <div className="search-controls">
        <input
          className="glass-input"
          type="text"
          placeholder="e.g., biology, math 101, psychology introduction..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
        />
        <select
          className="glass-select"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="MiraCosta College">MiraCosta College</option>
          <option value="California State University, Chico">CSU Chico</option>
        </select>
        <button className="glass-btn" onClick={doSearch} disabled={loading}>
          {loading ? "Searching..." : "🔍 Search"}
        </button>
      </div>

      <div className="results-grid">
        {loading && (
          <div className="empty-state">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
            <p>Searching courses...</p>
          </div>
        )}
        {results !== null && !loading && results.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-magnifying-glass"></i>
            <h3>No Results</h3>
            <p>No courses found for &ldquo;{query}&rdquo;. Try different keywords.</p>
          </div>
        )}
        {results !== null &&
          !loading &&
          results.length > 0 && (
            <>
              <div className="results-count">
                Found <strong>{results.length}</strong> courses for &ldquo;{query}&rdquo;
              </div>
              {results.map((c, i) => (
                <CourseCard key={i} course={c} showScore />
              ))}
            </>
          )}
        {results === null && !loading && (
          <div className="empty-state">
            <i className="fa-solid fa-magnifying-glass"></i>
            <h3>Start Searching</h3>
            <p>Enter a keyword above to search courses by name, subject, or code.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TAB: Recommendations
   ────────────────────────────────────────────── */
function RecommendationsTab() {
  const [interests, setInterests] = useState("");
  const [college, setCollege] = useState("");
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  const getRecs = async () => {
    if (!interests.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, college: college || null }),
      });
      const data = await res.json();
      setRecs(data.recommendations);
    } catch {
      setRecs({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>🎯 Personalized Recommendations</h2>
        <p>Enter your interests (one per line) and we&apos;ll find matching courses</p>
      </div>
      <div className="search-controls">
        <textarea
          className="glass-input glass-textarea"
          rows="4"
          placeholder={"biology\ncomputer science\nart\npsychology"}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <select
          className="glass-select"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="MiraCosta College">MiraCosta College</option>
          <option value="California State University, Chico">CSU Chico</option>
        </select>
        <button className="glass-btn" onClick={getRecs} disabled={loading}>
          {loading ? "Loading..." : "🎯 Get Recommendations"}
        </button>
      </div>

      <div className="results-grid">
        {loading && (
          <div className="empty-state">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
            <p>Generating recommendations...</p>
          </div>
        )}
        {recs !== null && !loading && Object.keys(recs).length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-lightbulb"></i>
            <h3>No Recommendations</h3>
            <p>Try different interests.</p>
          </div>
        )}
        {recs !== null &&
          !loading &&
          Object.entries(recs).map(([interest, courses]) => (
            <div key={interest} className="rec-group">
              <h3 className="rec-group-title">
                📚 Courses for &ldquo;{interest.charAt(0).toUpperCase() + interest.slice(1)}&rdquo;
              </h3>
              {courses.map((c, i) => (
                <CourseCard key={i} course={c} showScore />
              ))}
            </div>
          ))}
        {recs === null && !loading && (
          <div className="empty-state">
            <i className="fa-solid fa-lightbulb"></i>
            <h3>Enter Your Interests</h3>
            <p>Type your interests above and hit the button to get smart course suggestions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TAB: Subject Explorer
   ────────────────────────────────────────────── */
const SUBJECTS = [
  "Art", "Biology", "Business", "Chemistry", "Computer Science",
  "English", "History", "Kinesiology", "Mathematics", "Music",
  "Physics", "Political Science", "Psychology", "Sociology",
];

function SubjectTab() {
  const [subject, setSubject] = useState("");
  const [college, setCollege] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const explore = async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, college: college || null }),
      });
      const d = await res.json();
      setData(d);
    } catch {
      setData({ total: 0, miracosta: 0, chico: 0, courses: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>📊 Subject Explorer</h2>
        <p>Browse courses by academic subject with real-time statistics</p>
      </div>
      <div className="search-controls">
        <select
          className="glass-select glass-select-lg"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select a subject...</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="glass-select"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="MiraCosta College">MiraCosta College</option>
          <option value="California State University, Chico">CSU Chico</option>
        </select>
        <button className="glass-btn" onClick={explore} disabled={loading}>
          {loading ? "Loading..." : "📊 Explore"}
        </button>
      </div>

      <div className="results-grid">
        {loading && (
          <div className="empty-state">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
            <p>Loading subject data...</p>
          </div>
        )}
        {data && !loading && (
          <>
            <div className="stats-row">
              <StatCard number={data.total} label="Total Courses" color="#4facfe" />
              <StatCard number={data.miracosta} label="MiraCosta" color="#00f2fe" />
              <StatCard number={data.chico} label="CSU Chico" color="#ef4444" />
            </div>
            {data.courses.map((c, i) => (
              <CourseCard key={i} course={c} showScore />
            ))}
          </>
        )}
        {!data && !loading && (
          <div className="empty-state">
            <i className="fa-solid fa-chart-bar"></i>
            <h3>Select a Subject</h3>
            <p>Choose a subject above to see course statistics and listings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TAB: Prerequisites
   ────────────────────────────────────────────── */
function PrerequisitesTab() {
  const [code, setCode] = useState("");
  const [college, setCollege] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const findPrereqs = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/prerequisites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_code: code, college: college || null }),
      });
      const d = await res.json();
      setData(d);
    } catch {
      setData({ target_course: null, prerequisites: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>🔗 Prerequisite Finder</h2>
        <p>Look up any course and discover its required prerequisites</p>
      </div>
      <div className="search-controls">
        <input
          className="glass-input"
          type="text"
          placeholder="e.g., MATH 150, BIO 101, PSYC 100"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && findPrereqs()}
        />
        <select
          className="glass-select"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="MiraCosta College">MiraCosta College</option>
          <option value="California State University, Chico">CSU Chico</option>
        </select>
        <button className="glass-btn" onClick={findPrereqs} disabled={loading}>
          {loading ? "Searching..." : "🔗 Find Prerequisites"}
        </button>
      </div>

      <div className="results-grid">
        {loading && (
          <div className="empty-state">
            <div className="typing-indicator"><span></span><span></span><span></span></div>
            <p>Looking up prerequisites...</p>
          </div>
        )}
        {data && !loading && !data.target_course && (
          <div className="empty-state">
            <i className="fa-solid fa-circle-xmark"></i>
            <h3>Course Not Found</h3>
            <p>Couldn&apos;t find &ldquo;{code}&rdquo;. Double-check the course code.</p>
          </div>
        )}
        {data && !loading && data.target_course && (
          <>
            <div className="results-count">🎯 Target Course</div>
            <CourseCard course={data.target_course} showScore />

            {data.prerequisites.length > 0 ? (
              <>
                <div className="results-count prereq-title">📋 Required Prerequisites ({data.prerequisites.length})</div>
                {data.prerequisites.map((c, i) => (
                  <CourseCard key={i} course={c} showScore />
                ))}
              </>
            ) : data.target_course.prerequisites &&
              data.target_course.prerequisites !== "Not specified" &&
              data.target_course.prerequisites.toLowerCase() !== "none" ? (
              <div className="prereq-notice warning">
                <h4>📋 Prerequisites Listed</h4>
                <p>{data.target_course.prerequisites}</p>
                <small>⚠️ Could not automatically find prerequisite courses in database</small>
              </div>
            ) : (
              <div className="prereq-notice success">
                <h4>✅ No Prerequisites Required</h4>
                <p>This course has no prerequisite requirements.</p>
              </div>
            )}
          </>
        )}
        {!data && !loading && (
          <div className="empty-state">
            <i className="fa-solid fa-link"></i>
            <h3>Enter a Course Code</h3>
            <p>Type a course code above to look up its prerequisites.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main App — Tab Navigation
   ────────────────────────────────────────────── */
const TABS = [
  { id: "chat", label: "AI Chat", icon: "fa-solid fa-robot" },
  { id: "search", label: "Search", icon: "fa-solid fa-magnifying-glass" },
  { id: "recs", label: "Recommendations", icon: "fa-solid fa-wand-magic-sparkles" },
  { id: "subjects", label: "Subjects", icon: "fa-solid fa-chart-bar" },
  { id: "prereqs", label: "Prerequisites", icon: "fa-solid fa-link" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat");

  const renderTab = () => {
    switch (activeTab) {
      case "chat":
        return <AIChatTab />;
      case "search":
        return <SearchTab />;
      case "recs":
        return <RecommendationsTab />;
      case "subjects":
        return <SubjectTab />;
      case "prereqs":
        return <PrerequisitesTab />;
      default:
        return <AIChatTab />;
    }
  };

  return (
    <>
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">🎓</div>
            <h1>Campus Compass</h1>
          </div>

          <div className="sidebar-content">
            <p className="subtitle">Navigation</p>
            <nav className="tab-nav">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-stats">
            <div className="mini-stat">
              <span className="mini-stat-number">1,764</span>
              <span className="mini-stat-label">Courses</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-number">2</span>
              <span className="mini-stat-label">Colleges</span>
            </div>
          </div>

          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>Systems Online</span>
          </div>
        </aside>

        {/* Active Tab Content */}
        {renderTab()}
      </div>
    </>
  );
}
