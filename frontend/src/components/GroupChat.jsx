import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, chatAPI, groupAPI } from '../services/api';
import './GroupChat.css';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [autoRefresh] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Update timestamps every minute for real-time feel
  useEffect(() => {
    timeUpdateIntervalRef.current = setInterval(() => {
      setMessages(prev => [...prev]); // Force re-render to update timestamps
    }, 60000);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);




  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setCurrentUser(response.data);
      } catch (error) {
        navigate('/');
      }
    };

    const fetchGroupData = async () => {
      try {
        const response = await groupAPI.getGroup(groupId);
        setGroupData(response.data);
      } catch (error) {
        navigate('/groups');
      }
    };

    fetchUser();
    fetchGroupData();
  }, [navigate, groupId]);




  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await chatAPI.getMessages(groupId);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    // Always fetch messages on mount or when groupId changes
    fetchMessages();

    // Only use auto-refresh as fallback if WebSocket isn't connected
    if (autoRefresh && !isConnected) {
      autoRefreshIntervalRef.current = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [groupId, autoRefresh, isConnected]);








  const connectWebSocket = useCallback(() => {
  if (!groupId) return;

  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    return;
  }


  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
  const wsUrl = `wss://smart-splitter-webapp-fastapi.onrender.com/chat/ws/${groupId}`;

  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onopen = () => {
    setIsConnected(true);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

      if (data.event === 'message') {
        const serverMsg = {
          id: data.message.id,
          content: data.message.content,
          sender_id: data.message.sender_id,
          sender_name: data.message.sender_name,
          timestamp: data.message.timestamp,
          type: 'user'
        };

        setMessages(prev => {
          // Avoid duplicate if already exists by ID
          if (prev.some(m => m.id === serverMsg.id)) return prev;
          return [...prev, serverMsg];
        });
      }

      if (data.event === 'bot_message') {
        const serverMsg = {
          id: data.message.id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          type: 'bot'
        };

        setMessages(prev => {
          if (prev.some(m => m.id === serverMsg.id)) return prev;
          return [...prev, serverMsg];
        });
      }

      if (data.event === 'typing') {
        setTypingUser(data.user);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser('');
        }, 3000);
      }
    };

    ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  ws.onclose = () => {
    setIsConnected(false);
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, 3000);
  };
}, [groupId]);



  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);




  useEffect(() => {
    const handleScroll = () => {
      if (!chatMessagesRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolling(!isAtBottom);
    };

    const messagesDiv = chatMessagesRef.current;
    if (messagesDiv) {
      messagesDiv.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (messagesDiv) {
        messagesDiv.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolling]);

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const messageContent = newMessage.trim();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'message',
          user_id: currentUser.id,
          content: messageContent
        }));
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'typing',
          user_name: currentUser.name
        }));
      } catch (error) {
        console.error('Failed to send typing event:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
  const utcDate = new Date(timestamp + 'Z'); // 👈 FORCE UTC

  return utcDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

  const toIST = (timestamp) =>
  new Date(
    new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    })
  );

  const formatDateSeparator = (timestamp) => {
    const messageDate = toIST(timestamp);
    const today = toIST(Date.now());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();

    return currentDate !== previousDate;
  };

  return (
    <div className="group-chat">
      <div className="chat-header">
        <button onClick={() => navigate(`/groups/${groupId}`)} className="back-btn">
          ←
        </button>
        <h1>{groupData?.group?.name || 'Group Chat'}</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢' : '🔴'}
        </div>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {shouldShowDateSeparator(message, messages[index - 1]) && (
              <div className="date-separator">
                <span>{formatDateSeparator(message.timestamp)}</span>
              </div>
            )}
            <div
              className={`message ${message.type === 'bot' ? 'bot-message' :
                message.sender_id === currentUser?.id ? 'own-message' : 'other-message'}`}
            >
              {message.type === 'bot' ? (
                <div className="bot-content">
                  <div className="bot-icon">🤖</div>
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ) : (
                <div className="user-content">
                  {message.sender_id !== currentUser?.id && (
                    <div className="sender-name">{message.sender_name}</div>
                  )}
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}

        {typingUser && typingUser !== currentUser?.name && (
          <div className="typing-indicator">
            <div className="typing-content">
              <span>{typingUser} is typing</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="1"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="send-btn"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;