import { Link, data} from "react-router-dom";
import React from "react";
import { useState,useEffect,useRef } from "react";

function ChatBot(){
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue,setInputValue]=useState("");
    const [errroMsg,setErrorMsg]= useState("");
    const [limitWarning,setLimitWarning]= useState("");
    const [isLoading,setIsLoading]= useState(false);
    const [messages,setMessages]= useState([
        {
            sender:"bot",
            text: "Hello!, I am your AI Shopping Assistant. What can i do for you?",
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent)";
          }}
          title="Chat with Shopping Assistant"
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

        </div>
    )
}
export default ChatBot;