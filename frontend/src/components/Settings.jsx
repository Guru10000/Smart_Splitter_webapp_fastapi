import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, aboutAPI } from '../services/api';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('about');
  const [feedbackData, setFeedbackData] = useState({ name: '', email: '', comments: '', rating: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await aboutAPI.submitFeedback(feedbackData);
      alert('Thank you for your feedback!');
      setFeedbackData({ name: '', email: '', comments: '', rating: '' });
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button onClick={() => navigate('/groups')} className="back-btn">←</button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="sidebar">
          <button 
            className={`sidebar-item ${activeSection === 'about' ? 'active' : ''}`}
            onClick={() => setActiveSection('about')}
          >
            <span className="sidebar-icon">ℹ️</span>
            About
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'info' ? 'active' : ''}`}
            onClick={() => setActiveSection('info')}
          >
            <span className="sidebar-icon">📋</span>
            Info
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveSection('feedback')}
          >
            <span className="sidebar-icon">💬</span>
            Feedback
          </button>
          <button 
            className={`sidebar-item ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            <span className="sidebar-icon">☎️</span>
            Contact Us
          </button>
          <button 
            className="sidebar-item logout-item"
            onClick={handleLogout}
          >
            <span className="sidebar-icon">🔓</span>
            Logout
          </button>
        </div>

        <div className="main-content">
          {activeSection === 'about' && (
            <div className="section-content">
              <h2>About Smart Splitter</h2>
              <div className="content-card">
                <p>Smart Splitter is your ultimate expense management companion, designed to make splitting bills and tracking group expenses effortless.</p>
                
                <h3>✨ Key Features</h3>
                <ul>
                  <li>📊 Track expenses in real-time</li>
                  <li>👥 Create and manage multiple groups</li>
                  <li>💰 Smart settlement calculations</li>
                  <li>💬 Built-in group chat</li>
                  <li>📱 Mobile-friendly interface</li>
                  <li>🔒 Secure and private</li>
                </ul>

                <h3>🎯 Our Mission</h3>
                <p>To simplify expense sharing among friends, family, and colleagues, making financial transparency easy and stress-free.</p>
              </div>
            </div>
          )}

          {activeSection === 'info' && (
            <div className="section-content">
              <h2>App Information</h2>
              <div className="content-card">
                <div className="info-item">
                  <span className="info-label">Version:</span>
                  <span className="info-value">1.0.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Developer:</span>
                  <span className="info-value">Smart Splitter Team</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Platform:</span>
                  <span className="info-value">Web Application</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Technology:</span>
                  <span className="info-value">React + FastAPI</span>
                </div>

                <h3>📜 Terms & Privacy</h3>
                <p>Your privacy is important to us. We use secure encryption to protect your data and never share your information with third parties.</p>

                <h3>🔄 Updates</h3>
                <p>We regularly update Smart Splitter with new features and improvements. Stay tuned for exciting updates!</p>
              </div>
            </div>
          )}

          {activeSection === 'feedback' && (
            <div className="section-content">
              <h2>Send Feedback</h2>
              <div className="content-card">
                <p>We'd love to hear your thoughts! Your feedback helps us improve Smart Splitter.</p>
                <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                  <input
                    type="text"
                    value={feedbackData.name}
                    onChange={(e) => setFeedbackData({ ...feedbackData, name: e.target.value })}
                    placeholder="Your Name (optional)"
                  />
                  <input
                    type="email"
                    value={feedbackData.email}
                    onChange={(e) => setFeedbackData({ ...feedbackData, email: e.target.value })}
                    placeholder="Your Email"
                    required
                  />
                  <textarea
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                    placeholder="Share your thoughts, suggestions, or report issues..."
                    rows="6"
                    required
                  />
                  <select
                    value={feedbackData.rating}
                    onChange={(e) => setFeedbackData({ ...feedbackData, rating: e.target.value })}
                    required
                  >
                    <option value="">Rate Us</option>
                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                    <option value="4">⭐⭐⭐⭐ Good</option>
                    <option value="3">⭐⭐⭐ Average</option>
                    <option value="2">⭐⭐ Poor</option>
                    <option value="1">⭐ Very Poor</option>
                  </select>
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Sending...' : '📤 Send Feedback'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="section-content">
              <h2>Contact Us</h2>
              <div className="content-card">
                <p>Have questions or need support? Get in touch with us!</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div>
                      <strong>Email</strong>
                      <p><a href="mailto:smartsplitterweb@gmail.com">smartsplitterweb@gmail.com</a></p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <div>
                      <strong>Phone</strong>
                      <p>8618310265</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;