import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI, chatAPI, groupAPI } from "../services/api";
import "./GroupChat.css";

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [autoRefresh] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Update timestamps every minute
  useEffect(() => {
    timeUpdateIntervalRef.current = setInterval(() => {
      setMessages((prev) => [...prev]);
    }, 60000);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  // Fetch user & group
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        setCurrentUser(response.data);
      } catch {
        navigate("/");
      }
    };

    const fetchGroupData = async () => {
      try {
        const response = await groupAPI.getGroup(groupId);
        setGroupData(response.data);
      } catch {
        navigate("/groups");
      }
    };

    fetchUser();
    fetchGroupData();
  }, [navigate, groupId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await chatAPI.getMessages(groupId);
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    fetchMessages();

    if (autoRefresh && !isConnected) {
      autoRefreshIntervalRef.current = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [groupId, autoRefresh, isConnected]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!groupId) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)return;

    const token = localStorage.getItem("token");

    if(!token) return;

    let baseUrl = process.env.REACT_APP_API_BASE_URL;

    if(!baseUrl){
      console.error("API base url not found")
      return
    }

    const wsBaseUrl = baseUrl.startsWith("https")
      ? baseUrl.replace("https", "wss")
      : baseUrl.replace("http", "ws");

    const wsUrl = `${wsBaseUrl}/chat/ws/${groupId}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected")
      

      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "message") {
        const serverMsg = {
          id: data.message.id,
          content: data.message.content,
          sender_id: data.message.sender_id,
          sender_name: data.message.sender_name,
          timestamp: data.message.timestamp,
          type: "user",
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === serverMsg.id)) return prev;
          return [...prev, serverMsg];
        });
      }

      if (data.event === "bot_message") {
        const serverMsg = {
          id: data.message.id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          type: "bot",
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === serverMsg.id)) return prev;
          return [...prev, serverMsg];
        });
      }

      if (data.event === "typing") {
        setTypingUser(data.user);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser("");
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    // ws.onclose = () => {
    //   setIsConnected(false);
    //   reconnectTimeoutRef.current = setTimeout(() => {
    //     connectWebSocket();
    //   }, 3000);
    // };
    ws.onclose = (event) => {
      console.log("WebSocket closed with code:", event.code);
      console.log("Reason:", event.reason);
    };
  }, [groupId]);



  useEffect(() => {
    connectWebSocket();

    return () => {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!chatMessagesRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        chatMessagesRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolling(!isAtBottom);
    };

    const messagesDiv = chatMessagesRef.current;
    if (messagesDiv) {
      messagesDiv.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (messagesDiv) {
        messagesDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolling]);

  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "message",
          user_id: currentUser.id,
          content: newMessage.trim(),
        })
      );
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="group-chat">
      <div className="chat-header">
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="back-btn"
        >
          ←
        </button>

        <h1>{groupData?.group?.name || "Group Chat"}</h1>

        <div
          className={`connection-status ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          {isConnected ? "🟢" : "🔴"}
        </div>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.type === "bot"
                ? "bot-message"
                : message.sender_id === currentUser?.id
                ? "own-message"
                : "other-message"
            }`}
          >
            <div className="message-text">{message.content}</div>
          </div>
        ))}

        {typingUser && typingUser !== currentUser?.name && (
          <div className="typing-indicator">
            {typingUser} is typing...
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
            }}
            onKeyDown={handleKeyPress}
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
