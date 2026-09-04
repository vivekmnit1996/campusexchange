import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, ShieldCheck, ShieldAlert, ShoppingBag, ArrowRight, Trash2, HelpCircle, Star, Check } from 'lucide-react';
import { aiApi } from '../services/aiApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function AiAssistantDrawer({ isOpen, onClose, onSelectProduct, onOpenStore }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      text: `👋 Hey **${user?.name || 'there'}**! I am **MarketPulse AI**, your dedicated shopping & platform assistant.\n\nI can help you search products, compare specs, check vendor stores, trace orders, and explain our escrow checkout policies.`,
      isOnTopic: true,
      products: [],
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [threadId] = useState(() => `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [addedItemIds, setAddedItemIds] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    aiApi.getQuickPrompts().then(data => {
      if (data?.prompts) setQuickPrompts(data.prompts);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const userContext = {
        id: user?._id || user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      };

      const result = await aiApi.sendMessage(text, threadId, userContext);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: result.reply || "I didn't receive a response. Please check back shortly.",
        isOnTopic: result.isOnTopic !== false,
        products: result.products || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          type: 'ai',
          text: "⚠️ Sorry, there was an error processing your query. Please make sure the AI microservice is active.",
          isOnTopic: true,
          products: [],
          timestamp: new Date(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (product) => {
    const normalizedProduct = {
      _id: product.id || product._id,
      title: product.title,
      price: product.price,
      images: [product.image || ''],
      store: { _id: product.storeId, name: product.storeName },
      stock: product.stock ?? 10,
    };
    addToCart(normalizedProduct, 1);
    setAddedItemIds(prev => ({ ...prev, [product.id || product._id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id || product._id]: false }));
    }, 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        type: 'ai',
        text: `Conversation cleared. How can I help you explore MarketPulse today?`,
        isOnTopic: true,
        products: [],
        timestamp: new Date(),
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E111A] h-full shadow-2xl border-l-4 border-black flex flex-col justify-between transition-all duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 border-b-4 border-black bg-[#FEF08A] dark:bg-[#FFE600] text-black flex items-center justify-between shadow-brutal-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-black text-[#FFE600] flex items-center justify-center border-2 border-black shadow-brutal-sm">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-black text-lg uppercase tracking-wider">MarketPulse AI</h2>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  LangGraph Agent
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-black/80 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-ping"></span>
                <span>Groq Llama 3.3 • Domain Sandboxed</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearHistory}
              title="Clear chat"
              className="p-1.5 bg-white/80 hover:bg-white text-black rounded-lg border-2 border-black font-bold transition hover:shadow-brutal-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-black hover:bg-black/80 text-white rounded-lg border-2 border-black font-bold transition hover:shadow-brutal-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guardrail Policy Notice Banner */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b-2 border-black text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Marketplace Guardrails: Products, Orders, Stores & Escrow only</span>
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 brutal-grid-bg">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.type === 'user' ? (
                <div className="max-w-[85%] bg-black text-white p-3.5 rounded-2xl rounded-tr-xs border-3 border-black shadow-brutal text-sm font-sans font-medium">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[92%] space-y-3">
                  <div
                    className={`p-4 rounded-2xl rounded-tl-xs border-3 border-black shadow-brutal text-sm font-sans leading-relaxed ${
                      msg.isOnTopic === false
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-900'
                        : 'bg-white dark:bg-[#161B26] text-black dark:text-white'
                    }`}
                  >
                    {msg.isOnTopic === false && (
                      <div className="flex items-center space-x-2 text-xs font-mono font-black uppercase text-amber-700 dark:text-amber-400 mb-2 pb-2 border-b border-amber-300 dark:border-amber-800">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Domain Guardrail Triggered</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap space-y-2">
                      {msg.text.split('\n\n').map((paragraph, idx) => {
                        // Render simple bold markdown
                        const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        return (
                          <p
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: formatted }}
                            className="leading-relaxed"
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Render Live Product Cards if attached by LangGraph */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-[#FFE600] flex items-center space-x-1">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Recommended from Catalog ({msg.products.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.products.map((prod) => {
                          const isAdded = addedItemIds[prod.id || prod._id];
                          return (
                            <div
                              key={prod.id || prod._id}
                              className="bg-white dark:bg-[#1B2130] p-3 rounded-xl border-3 border-black shadow-brutal-sm flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform"
                            >
                              <img
                                src={prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                                alt={prod.title}
                                className="w-14 h-14 object-cover rounded-lg border-2 border-black shrink-0 bg-gray-100"
                              />

                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-black dark:text-white truncate" title={prod.title}>
                                  {prod.title}
                                </h4>
                                <div className="flex items-center space-x-2 text-[11px] mt-0.5">
                                  <span className="font-black text-black dark:text-[#FFE600]">${prod.price}</span>
                                  {prod.rating && (
                                    <span className="font-mono text-amber-500 font-bold flex items-center">
                                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500 inline mr-0.5" />
                                      {prod.rating}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-500 truncate">{prod.category}</span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 block truncate">
                                  by {prod.storeName}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#FEF08A] hover:bg-[#FFE600] text-black rounded border-2 border-black transition hover:shadow-brutal-sm cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleQuickAdd(prod)}
                                  className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded border-2 border-black transition flex items-center justify-center cursor-pointer ${
                                    isAdded
                                      ? 'bg-emerald-400 text-black'
                                      : 'bg-black text-white hover:bg-black/80'
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3.5 h-3.5" /> : '+ Cart'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 p-3 bg-white dark:bg-[#161B26] border-3 border-black rounded-2xl rounded-tl-xs shadow-brutal w-32">
              <Sparkles className="w-4 h-4 text-black dark:text-[#FFE600] animate-spin" />
              <span className="text-xs font-mono font-bold text-black dark:text-white animate-pulse">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {quickPrompts.length > 0 && (
          <div className="px-4 py-2 border-t-2 border-black bg-gray-50 dark:bg-[#121520] overflow-x-auto no-scrollbar flex items-center space-x-2">
            {quickPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSendMessage(p.query)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1 bg-white dark:bg-[#1A202C] text-black dark:text-white rounded-full text-xs font-mono font-bold border-2 border-black hover:bg-[#FEF08A] dark:hover:bg-[#FFE600] dark:hover:text-black transition shadow-brutal-xs disabled:opacity-50 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t-4 border-black bg-white dark:bg-[#0E111A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about products, orders, vendor stores, checkout..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#161B26] text-black dark:text-white rounded-xl border-3 border-black font-mono text-sm placeholder:text-gray-500 focus:outline-hidden focus:bg-[#FEF08A]/20 dark:focus:bg-[#FFE600]/10 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-5 py-3 bg-[#FFE600] hover:bg-[#FFD700] text-black font-mono font-black text-sm uppercase rounded-xl border-3 border-black shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition disabled:opacity-40 cursor-pointer flex items-center space-x-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Powered by LangGraph StateGraph & Groq</span>
            <span className="text-emerald-600 font-bold">● Online</span>
          </div>
        </div>

      </div>
    </div>
  );
}
