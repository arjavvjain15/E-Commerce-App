import { Link, data} from "react-router-dom";
import React from "react";
import api from "../api";
import { useState,useEffect,useRef } from "react";

function ChatBot(){
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue,setInputValue]=useState("");
    const [errorMsg,setErrorMsg]= useState("");
    const [limitWarning,setLimitWarning]= useState("");
    const [isLoading,setIsLoading]= useState(false);
    const [messages,setMessages]= useState([
        {
            sender:"bot",
            text: "Hello! , I am your AI Shopping Assistant. What can I do for you?",
            timestamp: new Date()
        }
    ]);
    const messagesEndRef= useRef(null);

    const scrollToBottom= ()=>{
        messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
    }

    useEffect(()=>{
        scrollToBottom()
    },[messages],[isLoading],[isOpen]);

    useEffect(()=>{
        scrollToBottom();
    },[isLoading],[messages],[isOpen]);

    const handleSend= async(e)=>{
        e.preventDefault();
        if(!inputValue.trim()|| isLoading) return;

        const userText=inputValue;
        setInputValue("");
        setErrorMsg("");
        setMessages((prev) => [...prev, { sender: "user", text: userText, timestamp: new Date() }]);
        setIsLoading(true);

        try{
            const response= await api.post("/chat",{message:userText});
            setMessages((prev)=>[
                ...prev, {sender: "bot", text: response.data.answer, timestamp: new Date()}
            ]);
        }
        catch(err){
            console.error("Chat Error",err);
            const status= err.response?.status;
            const dataMessage= err.response?.data?.message;
            if(status===429){
                setLimitWarning(dataMessage|| "Daily Chat Limit Exceeded");
                setMessages((prev)=>[
                    ...prev, {sender: "bot", text:"Limit reached"+ dataMessage|| "You have exceeded your daily limti", timestamp: new Date()}
                ]);
            }
            else{
                setErrorMsg(dataMessage|| "Something went wrong");
            }
        }
        finally{
            setIsLoading(false);
        }
    };

    return(
        <div className="chat-widget-wrapper"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          fontFamily: "var(--sans)"
        }}>

        {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            transition: "transform 0.2s ease, background-color 0.2s ease",
            outline: "none"
          }}
          onMouseEnter={(e)=>{
            e.currentTarget.style.backgroundColor= "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent)";
          }}
          title="AI Shopping Assistant"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      
        {isOpen && (
        <div
          className="chat-window"
          style={{
            width: "360px",
            height: "480px",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
          }}
        >
            {/* header */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: "700", fontSize: "0.95rem" }}>
                  AI Shopping Assistant
                </h4>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                opacity: 0.8,
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
              {/* middle section */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              backgroundColor: "var(--bg)"
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    width: "100%"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      backgroundColor: isUser ? "var(--accent)" : "var(--card-bg)",
                      color: isUser ? "#ffffff" : "var(--text-h)",
                      fontSize: "0.9rem",
                      lineHeight: "1.4",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      border: isUser ? "none" : "1px solid var(--border)"
                    }}
                  >
                    <div>{msg.text}</div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        marginTop: "4px",
                        textAlign: "right",
                        opacity: 0.6,
                        color: isUser ? "#ffffff" : "var(--text)"
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "16px 16px 16px 2px",
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <div className="dot" style={{ width: "8px", height: "8px", backgroundColor: "var(--accent)", borderRadius: "50%", animation: "bounce 1.4s infinite ease-in-out both" }} />
                  <div className="dot" style={{ width: "8px", height: "8px", backgroundColor: "var(--accent)", borderRadius: "50%", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                  <div className="dot" style={{ width: "8px", height: "8px", backgroundColor: "var(--accent)", borderRadius: "50%", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--danger-bg)",
                  color: "var(--danger)",
                  fontSize: "0.85rem",
                  border: "1px solid var(--border)",
                  textAlign: "center"
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Limit Warning */}
            {limitWarning && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--danger-bg)",
                  color: "var(--danger)",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  border: "1px solid var(--border)",
                  textAlign: "center"
                }}
              >
                {limitWarning}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--card-bg)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || !!limitWarning}
              placeholder={limitWarning ? "Daily limit reached..." : "Ask shopping assistant..."}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text-h)",
                outline: "none",
                fontSize: "0.9rem",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !!limitWarning}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: inputValue.trim() && !isLoading && !limitWarning ? "var(--accent)" : "var(--border)",
                color: inputValue.trim() && !isLoading && !limitWarning ? "#ffffff" : "var(--text)",
                border: "none",
                cursor: inputValue.trim() && !isLoading && !limitWarning ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s, color 0.2s",
                outline: "none"
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim() && !isLoading && !limitWarning) {
                  e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim() && !isLoading && !limitWarning) {
                  e.currentTarget.style.backgroundColor = "var(--accent)";
                }
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

        </div>
    )
}
export default ChatBot;