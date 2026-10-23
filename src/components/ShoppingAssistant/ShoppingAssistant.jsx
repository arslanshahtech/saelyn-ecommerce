import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { sendAssistantMessage } from "../../api/assistant";
import "./ShoppingAssistant.css";

const QUICK_PROMPTS = ["Show bags under $100", "Black clothing", "What is in stock?"];
const STORAGE_KEY = "saelyn-assistant-chat-v1";
const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I’m your SAELYN assistant. I can chat with you or help you explore the collection whenever you like.",
};
function loadSavedMessages() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) {
      const valid = saved.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.text === "string");
      if (valid.length) return valid.slice(-60);
    }
  } catch { /* Storage may be unavailable; start with a fresh chat. */ }
  return [WELCOME_MESSAGE];
}

function formatPrice(price) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount)
    : "Price unavailable";
}

export default function ShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(loadSavedMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch { /* Chat remains usable if browser storage is full or disabled. */ }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const clearConversation = () => {
    const fresh = [{ ...WELCOME_MESSAGE, id: "welcome" }];
    setMessages(fresh);
    setError("");
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
  };

  const sendMessage = async (rawMessage) => {
    const message = String(rawMessage || "").trim();
    if (!message || isSending) return;

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: message }]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const history = messages
        .filter((item) => item.id !== "welcome" && ["user", "assistant"].includes(item.role))
        .slice(-8)
        .map(({ role, text }) => ({ role, text }));
      const result = await sendAssistantMessage(message, history);
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: result.reply,
        products: result.products || [],
        mode: result.mode || "catalog",
      }]);
    } catch (requestError) {
      setError(requestError.message || "Message send nahi ho saka. Dobara try karein.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <button
        className={`sa-assistant-launcher ${isOpen ? "is-open" : ""}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close SAELYN shopping assistant" : "Open SAELYN shopping assistant"}
        aria-expanded={isOpen}
        aria-controls="sa-shopping-assistant"
      >
        {isOpen ? <X size={21} /> : <MessageCircle size={21} />}
        {!isOpen && <span className="sa-assistant-launcher-label">AI</span>}
      </button>

      {isOpen && (
        <section className="sa-assistant-panel" id="sa-shopping-assistant" role="dialog" aria-modal="false" aria-label="SAELYN shopping assistant">
          <header className="sa-assistant-header">
            <div className="sa-assistant-brand-icon"><Sparkles size={17} /></div>
            <div className="sa-assistant-heading">
              <p className="sa-assistant-eyebrow">SAELYN · AI ASSISTANT</p>
              <h2>Hi, I’m here to help.</h2>
              <span><i /> Chat naturally · Shop when you want</span>
            </div>
            <button className="sa-assistant-clear" type="button" onClick={clearConversation} aria-label="Clear saved conversation" title="Clear conversation"><Trash2 size={16} /></button>
            <button className="sa-assistant-close" type="button" onClick={() => setIsOpen(false)} aria-label="Minimize assistant"><ChevronDown size={19} /></button>
          </header>

          <div className="sa-assistant-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <article className={`sa-chat-message sa-chat-message--${message.role}`} key={message.id}>
                {message.role === "assistant" && <span className="sa-chat-avatar" aria-hidden="true"><Bot size={15} /></span>}
                <div className="sa-chat-content">
                  <p className="sa-chat-bubble">{message.text}</p>
                  {message.products?.length > 0 && (
                    <div className="sa-chat-products">
                      <p className="sa-chat-products-label">FROM THE CURRENT COLLECTION</p>
                      {message.products.map((product) => (
                        <Link to={`/product/${product.id}`} className="sa-chat-product" key={product.id} onClick={() => setIsOpen(false)}>
                          <div className="sa-chat-product-image"><img src={product.image} alt="" loading="lazy" /></div>
                          <div className="sa-chat-product-info">
                            <span>{product.category}</span>
                            <strong>{product.name}</strong>
                            <b>{formatPrice(product.price)}</b>
                            <small>{product.stock > 0 ? "In stock · View options" : "Currently out of stock"}</small>
                          </div>
                          <span className="sa-chat-product-arrow" aria-hidden="true">↗</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.role === "assistant" && message.mode && <span className="sa-chat-mode">{message.mode === "gemini" ? "AI conversation · grounded in live catalog" : "Catalog-based recommendations"}</span>}
                </div>
              </article>
            ))}
            {isSending && <div className="sa-chat-thinking" role="status"><span /><span /><span /><span className="sa-chat-thinking-label">Finding relevant pieces…</span></div>}
            {error && <p className="sa-assistant-error" role="alert">{error}</p>}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="sa-assistant-prompts">
              <span>TRY ASKING</span>
              {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={isSending}>{prompt} <span aria-hidden="true">↗</span></button>)}
            </div>
          )}

          <form className="sa-assistant-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="sa-assistant-input">Ask SAELYN shopping assistant</label>
            <input id="sa-assistant-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about styles, colors, prices…" maxLength={300} autoComplete="off" disabled={isSending} />
            <button type="submit" disabled={!input.trim() || isSending} aria-label="Send message"><Send size={17} /></button>
          </form>
          <p className="sa-assistant-footnote">Recommendations use current product details. Final availability is confirmed at checkout.</p>
        </section>
      )}
    </>
  );
}
