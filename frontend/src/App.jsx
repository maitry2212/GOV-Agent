import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Loader2, Info, CheckCircle2, ShieldCheck, 
  Globe, HelpCircle, User, Bot, LayoutTemplate, 
  Plus, MessageSquare, Trash2, Menu, X, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  sendResearchQuery, getSessions, 
  getSessionMessages, deleteSession,
  getStoredUser, getStoredToken, logout, getMe
} from './services/api';
import AuthPage from './components/AuthPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      const storedUser = getStoredUser();
      if (token && storedUser) {
        try {
          // Validate token is still valid
          await getMe();
          setUser(storedUser);
        } catch {
          // Token expired or invalid, clear it
          logout();
        }
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentSteps]);

  // Load sessions when user is authenticated
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setMessages([]);
    setSessions([]);
    setCurrentSessionId(null);
    setCurrentSteps([]);
  };

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      // If 401, user's token might be expired
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setCurrentSteps([]);
    setQuery('');
  };

  const loadSession = async (sessionId) => {
    setIsLoading(true);
    try {
      const data = await getSessionMessages(sessionId);
      setCurrentSessionId(data.id);
      const mappedMessages = data.messages.map(m => ({
        id: m.id,
        type: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content
      }));
      setMessages(mappedMessages);
      setCurrentSteps([]);
    } catch (error) {
      console.error("Failed to load session", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      fetchSessions();
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { id: Date.now(), type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setCurrentSteps(['Connecting to government portals...']);

    try {
      const result = await sendResearchQuery(userMessage.content, currentSessionId);
      
      if (!result) throw new Error("No data received from server");

      if (!currentSessionId && result.session_id) {
        setCurrentSessionId(result.session_id);
        fetchSessions();
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.response || result.final_answer || 'No response content available.',
        steps: Array.isArray(result.steps) ? result.steps : []
      };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentSteps(aiMessage.steps);
    } catch (error) {
      console.error("Chat Submit Error:", error);
      const errorMsg = error.response?.data?.detail || error.message || 'Could not reach the server.';
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'error',
        content: `Error: ${errorMsg}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <Loader2 className="h-8 w-8 text-brand-secondary animate-spin" />
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Main app (authenticated)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-brand-primary text-white flex flex-col flex-shrink-0 z-20 shadow-xl overflow-hidden relative"
      >
        <div className="p-4 flex flex-col h-full w-[280px]">
          <div className="flex items-center gap-3 mb-8 px-2">
            <ShieldCheck className="h-8 w-8 text-brand-secondary" />
            <h1 className="font-bold text-lg tracking-tight">Gov-AIGuide</h1>
          </div>

          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full px-4 py-3 mb-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-semibold text-sm group"
          >
            <Plus className="h-4 w-4 text-brand-secondary group-hover:scale-110 transition-transform" />
            New Research
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-2">
            <h3 className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-4">Past Sessions</h3>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                  currentSessionId === session.id 
                    ? 'bg-white/15 border-white/20' 
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className={`h-4 w-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-brand-secondary' : 'text-white/40'}`} />
                  <span className="text-sm font-medium truncate leading-none pt-0.5">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* User Profile & Logout */}
          <div className="mt-auto pt-6 border-t border-white/10 px-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-secondary/20 border border-brand-secondary/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-brand-secondary" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate max-w-[140px]">{user.name}</span>
                  <span className="text-[10px] text-white/40 block truncate max-w-[140px]">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="md:hidden flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-brand-primary" />
                <h1 className="font-bold text-gray-900 leading-tight">Gov-AIGuide</h1>
            </div>
            {currentSessionId && !isLoading && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-brand-primary/5 rounded-full border border-brand-primary/10">
                 <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                 <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Active Research ID: {currentSessionId}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex gap-4">
                <a href="#" className="text-xs font-semibold text-gray-400 hover:text-brand-primary transition-colors">Documentation</a>
                <a href="#" className="text-xs font-semibold text-gray-400 hover:text-brand-primary transition-colors">API Docs</a>
            </nav>
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
               <Bot className="h-4 w-4 text-brand-primary" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden lg:container lg:mx-auto lg:my-6 lg:rounded-3xl lg:shadow-2xl lg:bg-white lg:border lg:border-gray-100 relative">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto text-center mt-12 md:mt-24">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-brand-primary/5 p-6 rounded-3xl"
                  >
                    <Bot className="h-16 w-16 text-brand-primary" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">
                      Welcome, <span className="text-brand-primary italic">{user.name}</span>
                    </h2>
                    <p className="text-gray-500 font-medium">Enter your query to begin deep retrieval from official Indian government databases and procedure manuals.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full pt-4">
                    {[
                      "PAN Card Application Steps",
                      "Aadhaar Address Update",
                      "Ration Card Eligibility",
                      "Passport Renewal Guide"
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setQuery(example)}
                        className="px-4 py-3 bg-white border border-gray-100 text-[13px] font-semibold text-gray-700 rounded-xl hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all text-left flex items-center gap-2 group shadow-sm"
                      >
                        <LayoutTemplate className="h-4 w-4 text-brand-primary/40 group-hover:text-brand-primary" />
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] ${
                      message.type === 'user'
                        ? 'bg-brand-primary text-white rounded-2xl p-4 shadow-md'
                        : message.type === 'error'
                          ? 'bg-red-50 text-red-600 rounded-2xl p-4 border border-red-100'
                          : 'bg-gray-50/80 text-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 leading-relaxed'
                    }`}>
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200/50 uppercase text-[10px] font-bold tracking-widest text-brand-primary">
                          <ShieldCheck className="h-3 w-3" />
                           Official Documentation
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-sans prose-headings:text-brand-primary prose-a:text-brand-primary prose-strong:text-brand-primary">
                        {message.content ? (
                          <Markdown remarkPlugins={[remarkGfm]}>
                            {String(message.content)}
                          </Markdown>
                        ) : '... retrieval in progress ...'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-4"
                >
                  <div className="bg-brand-primary rounded-full p-2 mt-1 shrink-0">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-widest animate-pulse">
                      Processing Agent Graph...
                    </div>
                    <div className="space-y-2 max-w-[300px]">
                       <div className="h-3 w-48 bg-gray-100 rounded-full animate-pulse"></div>
                       <div className="h-3 w-32 bg-gray-100 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about passport application, tax filing, schemes..."
                  className="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-2xl md:rounded-3xl outline-none focus:border-brand-primary/20 transition-all text-sm md:text-base font-medium shadow-sm pr-16"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-brand-primary text-white rounded-xl md:rounded-2xl hover:bg-brand-primary-dark transition-all disabled:opacity-50 disabled:bg-gray-400 shadow-lg shadow-brand-primary/20 active:scale-95 flex items-center justify-center min-w-[48px]"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
              <p className="mt-4 text-center text-[10px] font-bold text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest">
                 <Globe className="h-3 w-3 text-brand-primary/40" /> Retrieval-Augmented Indian Govt Portal Engine
              </p>
            </div>
          </div>

          {/* Steps View */}
          <div className="hidden xl:flex w-72 flex-col bg-gray-50/50 border-l border-gray-100 p-6">
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 className="h-3 w-3" /> Agent Workflow
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">Real-time node execution tracking</p>
              </div>

              <div className="space-y-4">
                {currentSteps.length > 0 ? (
                  currentSteps.map((step, index) => (
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      key={index}
                      className="flex items-start gap-3 group"
                    >
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-brand-accent bg-brand-accent/10" />
                      <span className="text-[12px] font-bold text-gray-700 leading-tight">
                        {step}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-20 filter grayscale">
                     <Info className="h-8 w-8 mb-4" />
                     <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-brand-primary">Awaiting<br/>Inquiry</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
