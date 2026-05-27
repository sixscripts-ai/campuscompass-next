"use client";

import { useState, useRef, useEffect } from 'react';

// Reusable Course Card Component
const CourseCard = ({ course }) => {
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
        {course.prerequisites && course.prerequisites.toLowerCase() !== "none" && (
          <div className="badge warning">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Prereqs: {course.prerequisites}</span>
          </div>
        )}
      </div>

      <div className="card-description">
        {course.description?.substring(0, 150)}{course.description?.length > 150 ? '...' : ''}
      </div>

      <div className="card-action">
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="maps-btn">
          <i className="fa-solid fa-map-location-dot"></i>
          View Campus Location
        </a>
      </div>
    </div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am Campus Compass, your AI course advisor. What kind of classes are you looking for this semester?'
    }
  ]);
  const [activeCards, setActiveCards] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleQuickAction = (actionText) => {
    setInput(actionText);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userMessage })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        // Update the right panel with the structured course cards
        if (data.course_cards && data.course_cards.length > 0) {
          setActiveCards(data.course_cards);
        } else {
          setActiveCards([]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network Error: Failed to connect to the server.' }]);
    } finally {
      setIsTyping(false);
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
            <p className="subtitle">Your AI Course Advisor</p>
            <div className="features">
              <div className="feature-item">
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Smart Course Search</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-graduation-cap"></i>
                <span>Degree Planning</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-bolt"></i>
                <span>Powered by RAG</span>
              </div>
            </div>
          </div>
          
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>Systems Online</span>
          </div>
        </aside>

        {/* Main Split Area */}
        <div className="main-content">
          {/* Chat Area (Left) */}
          <main className="chat-container">
            <header className="chat-header">
              <h2>Course Assistant</h2>
              <span className="model-badge">GPT-4o-mini Structured</span>
            </header>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="avatar">{msg.role === 'user' ? '👤' : '🎓'}</div>
                  <div className="message-content">
                    <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }}></p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message assistant typing" id="typing-indicator">
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
                <button className="action-btn" onClick={() => handleQuickAction("Find me some interesting science courses")}>
                  🔍 Find Courses
                </button>
                <button className="action-btn" onClick={() => handleQuickAction("What are the prerequisites for MATH 150?")}>
                  📚 Prerequisites
                </button>
                <button className="action-btn" onClick={() => handleQuickAction("Where are the campus locations?")}>
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
                <button type="submit" id="send-button" disabled={isTyping || !input.trim()}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </main>

          {/* Course Details Panel (Right) */}
          <aside className="course-details-panel">
            <header className="details-header">
              <h2>📋 Course Information</h2>
            </header>
            
            <div className="cards-container">
              {activeCards.length > 0 ? (
                activeCards.map((course, idx) => (
                  <CourseCard key={idx} course={course} />
                ))
              ) : (
                <div className="empty-state">
                  <i className="fa-solid fa-layer-group"></i>
                  <h3>No Active Courses</h3>
                  <p>Start chatting to see detailed course information, prerequisites, and Google Maps links here!</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
