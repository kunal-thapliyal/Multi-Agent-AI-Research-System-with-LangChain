import { useState } from "react";
import {
  Sun,
  Moon,
  Plus,
  Send,
  Menu,
  X,
  Search,
  BookOpen,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  // ==========================================
  // STATE
  // ==========================================

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // ==========================================
  // CURRENT CHAT
  // ==========================================

  const currentChat = chats.find(
    (chat) => chat.id === currentChatId
  );

  const messages = currentChat?.messages || [];

  // ==========================================
  // CREATE NEW CHAT
  // ==========================================

  const newChat = () => {
    const newId = Date.now();

    const newChatObject = {
      id: newId,
      title: "New chat",
      messages: [],
    };

    setChats((prev) => [...prev, newChatObject]);
    setCurrentChatId(newId);

    setTopic("");
    setCopied(false);
  };

  // ==========================================
  // RUN RESEARCH / CHAT
  // ==========================================

  const runResearch = async () => {
    const trimmedTopic = topic.trim();

    if (!trimmedTopic || loading) {
      return;
    }

    let chatId = currentChatId;

    // ------------------------------------------
    // Create chat automatically if none exists
    // ------------------------------------------

    if (!chatId) {
      chatId = Date.now();

      const newChatObject = {
        id: chatId,
        title:
          trimmedTopic.length > 35
            ? trimmedTopic.slice(0, 35) + "..."
            : trimmedTopic,
        messages: [],
      };

      setChats((prev) => [...prev, newChatObject]);
      setCurrentChatId(chatId);
    }

    // ------------------------------------------
    // Get existing messages
    // ------------------------------------------

    const existingChat = chats.find(
      (chat) => chat.id === chatId
    );

    const existingMessages =
      existingChat?.messages || [];

    // ------------------------------------------
    // Add user message
    // ------------------------------------------

    const userMessage = {
      role: "user",
      content: trimmedTopic,
    };

    const messagesAfterUser = [
      ...existingMessages,
      userMessage,
    ];

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }

        return {
          ...chat,
          title:
            chat.title === "New chat"
              ? trimmedTopic.length > 35
                ? trimmedTopic.slice(0, 35) + "..."
                : trimmedTopic
              : chat.title,
          messages: messagesAfterUser,
        };
      })
    );

    setTopic("");
    setCopied(false);
    setLoading(true);

    // ==========================================
    // API REQUEST
    // ==========================================

    try {
      const response = await fetch(
        `${API_URL}/research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: trimmedTopic,
          }),
        }
      );

      const data = await response.json();

      // ----------------------------------------
      // API ERROR
      // ----------------------------------------

      if (!response.ok) {
        throw new Error(
          data.detail || "Research request failed"
        );
      }

      // ==========================================
      // NORMAL CHAT RESPONSE
      // ==========================================

      if (data.type === "chat") {
        const assistantMessage = {
          role: "assistant",
          type: "chat",
          content: data.response,
        };

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== chatId) {
              return chat;
            }

            return {
              ...chat,
              messages: [
                ...chat.messages,
                assistantMessage,
              ],
            };
          })
        );
      }

      // ==========================================
      // RESEARCH RESPONSE
      // ==========================================

      else if (data.type === "research") {
        const assistantMessage = {
          role: "assistant",
          type: "research",
          topic: data.topic,
          report: data.report,
          feedback: data.feedback,
          searchResults: data.search_results,
        };

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== chatId) {
              return chat;
            }

            return {
              ...chat,
              messages: [
                ...chat.messages,
                assistantMessage,
              ],
            };
          })
        );
      }

      // ==========================================
      // UNKNOWN RESPONSE
      // ==========================================

      else {
        throw new Error(
          "The backend returned an unknown response type."
        );
      }
    } catch (error) {
      console.error(error);

      const errorMessage = {
        role: "assistant",
        type: "error",
        content: error.message,
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) {
            return chat;
          }

          return {
            ...chat,
            messages: [
              ...chat.messages,
              errorMessage,
            ],
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SWITCH CHAT
  // ==========================================

  const switchChat = (chatId) => {
    if (loading) {
      return;
    }

    setCurrentChatId(chatId);
    setTopic("");
    setCopied(false);
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runResearch();
    }
  };

  // ==========================================
  // COPY REPORT
  // ==========================================

  const copyReport = async (report) => {
    try {
      await navigator.clipboard.writeText(report);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Could not copy report:",
        error
      );
    }
  };

  // ==========================================
  // DOWNLOAD REPORT
  // ==========================================

  const downloadReport = (
    report,
    researchTopic
  ) => {
    const blob = new Blob([report], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `${researchTopic || "research-report"}.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className={`app ${
        darkMode ? "dark" : "light"
      }`}
    >

      {/* =====================================
          SIDEBAR
      ====================================== */}

      {sidebarOpen && (
        <aside className="sidebar">

          {/* Sidebar Header */}

          <div className="sidebar-top">

            <div className="brand">

              <div className="brand-icon">
                🔬
              </div>

              <span>
                AI Research Agent
              </span>

            </div>

            <button
              className="icon-button mobile-close"
              onClick={() =>
                setSidebarOpen(false)
              }
            >
              <X size={20} />
            </button>

          </div>


          {/* New Chat */}

          <button
            className="new-chat"
            onClick={newChat}
          >
            <Plus size={18} />

            <span>
              New chat
            </span>
          </button>


          {/* History */}

          <div className="history">

            <p className="history-title">
              Recent
            </p>

            {chats.length === 0 ? (

              <p className="empty-history">
                No conversations yet
              </p>

            ) : (

              <div className="history-list">

                {chats.map((chat) => (

                  <button
                    key={chat.id}
                    className={`history-item ${
                      chat.id === currentChatId
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      switchChat(chat.id)
                    }
                  >

                    <Search size={15} />

                    <span>
                      {chat.title}
                    </span>

                  </button>

                ))}

              </div>

            )}

          </div>


          {/* Sidebar Bottom */}

          <div className="sidebar-bottom">

            <div className="product-info">

              <div className="small-logo">
                🔬
              </div>

              <div>

                <strong>
                  AI Research Agent
                </strong>

                <span>
                  AI Research Assistant
                </span>

              </div>

            </div>

          </div>

        </aside>
      )}


      {/* =====================================
          MAIN
      ====================================== */}

      <main className="main">

        {/* Header */}

        <header className="header">

          {!sidebarOpen && (

            <button
              className="icon-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              <Menu size={21} />
            </button>

          )}

          <div className="header-title">
            AI Research Agent
          </div>

          {/* Theme Toggle */}

          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode((prev) => !prev)
            }
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

        </header>


        {/* =====================================
            CONVERSATION
        ====================================== */}

        <div className="conversation">

          {/* =================================
              WELCOME SCREEN
          ================================== */}

          {messages.length === 0 && !loading ? (

            <div className="welcome">

              <div className="welcome-icon">
                🔬
              </div>

              <h1>
                What would you like to research?
              </h1>

              <p>
                AI Research Agent searches the web,
                reads relevant sources, writes a
                structured report, and critically
                reviews the result.
              </p>


              {/* Suggestions */}

              <div className="suggestions">

                <button
                  onClick={() =>
                    setTopic(
                      "Research the latest developments in generative AI"
                    )
                  }
                >

                  <Search size={18} />

                  <span>
                    Latest developments in generative AI
                  </span>

                </button>


                <button
                  onClick={() =>
                    setTopic(
                      "Research the impact of AI on software engineering"
                    )
                  }
                >

                  <BookOpen size={18} />

                  <span>
                    AI and software engineering
                  </span>

                </button>


                <button
                  onClick={() =>
                    setTopic(
                      "Research the future of autonomous vehicles"
                    )
                  }
                >

                  <PenLine size={18} />

                  <span>
                    Future of autonomous vehicles
                  </span>

                </button>

              </div>

            </div>

          ) : (

            <div className="messages">

              {/* =================================
                  MESSAGE LOOP
              ================================== */}

              {messages.map(
                (message, index) => (

                  <div
                    className={`message-row ${message.role}`}
                    key={index}
                  >

                    {/* ============================
                        USER MESSAGE
                    ============================= */}

                    {message.role === "user" && (

                      <div className="user-message">

                        <div className="user-content">
                          {message.content}
                        </div>

                      </div>

                    )}


                    {/* ============================
                        ASSISTANT MESSAGE
                    ============================= */}

                    {message.role ===
                      "assistant" && (

                      <div className="assistant-message">

                        {/* Assistant Header */}

                        <div className="assistant-heading">

                          <div className="assistant-avatar">
                            🔬
                          </div>

                          <strong>
                            AI Research Agent
                          </strong>

                        </div>


                        {/* =================================
                            NORMAL CHAT
                        ================================== */}

                        {message.type === "chat" && (

                          <div className="chat-response">
                            {message.content}
                          </div>

                        )}


                        {/* =================================
                            RESEARCH
                        ================================== */}

                        {message.type ===
                          "research" && (

                          <>

                            {/* Report */}

                            <div className="report">

                              <div className="report-label">
                                Research Report
                              </div>

                              <div className="report-content">
                                {message.report}
                              </div>

                            </div>


                            {/* Critic Review */}

                            {message.feedback && (

                              <div className="feedback">

                                <div className="feedback-heading">

                                  <ShieldCheck
                                    size={18}
                                  />

                                  <strong>
                                    Research Review
                                  </strong>

                                </div>

                                <pre>
                                  {message.feedback}
                                </pre>

                              </div>

                            )}


                            {/* Report Actions */}

                            <div className="report-actions">

                              <button
                                onClick={() =>
                                  copyReport(
                                    message.report
                                  )
                                }
                              >
                                {copied
                                  ? "Copied!"
                                  : "Copy Report"}
                              </button>

                              <button
                                onClick={() =>
                                  downloadReport(
                                    message.report,
                                    message.topic
                                  )
                                }
                              >
                                Download
                              </button>

                            </div>

                          </>

                        )}


                        {/* =================================
                            ERROR
                        ================================== */}

                        {message.type === "error" && (

                          <div className="error-box">

                            <strong>
                              Something went wrong
                            </strong>

                            <p>
                              {message.content}
                            </p>

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                )
              )}


              {/* =================================
                  LOADING
              ================================== */}

              {loading && (

                <div className="message-row assistant">

                  <div className="assistant-message">

                    <div className="assistant-heading">

                      <div className="assistant-avatar">
                        🔬
                      </div>

                      <strong>
                        AI Research Agent
                      </strong>

                    </div>


                    <div className="research-status">

                      <div className="status">

                        <Search size={17} />

                        <span>
                          Searching the web
                        </span>

                        <div className="loader" />

                      </div>


                      <div className="status">

                        <BookOpen size={17} />

                        <span>
                          Reading relevant sources
                        </span>

                      </div>


                      <div className="status">

                        <PenLine size={17} />

                        <span>
                          Writing research report
                        </span>

                      </div>


                      <div className="status">

                        <ShieldCheck size={17} />

                        <span>
                          Reviewing findings
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>


        {/* =====================================
            INPUT
        ====================================== */}

        <div className="input-area">

          <div className="input-container">

            <textarea
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={loading}
            />

            <button
              className="send-button"
              onClick={runResearch}
              disabled={
                !topic.trim() || loading
              }
            >
              <Send size={18} />
            </button>

          </div>


          <p className="disclaimer">
            AI Research Agent can make mistakes.
            Verify important information from
            the original sources.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;