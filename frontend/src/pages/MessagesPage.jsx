import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Mail, Loader2, User, Send, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MessagesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchThreads();
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/messages/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThreads(res.data);
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (thread) => {
    setActiveConversation({
      listing_id: thread.listing_id,
      other_user_id: thread.other_user_id,
      listing_title: thread.listing_title,
      other_user_name: thread.other_user_name,
      other_user_avatar: thread.other_user_avatar,
    });

    setConversationLoading(true);
    try {
      const res = await axios.get(`${API}/messages/conversation`, {
        params: { listing_id: thread.listing_id, other_user_id: thread.other_user_id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationMessages(res.data);
      setReplyText("");
    } catch (err) {
      toast.error("Failed to load conversation");
    } finally {
      setConversationLoading(false);
    }
  };

  const handleBackToList = () => {
    setActiveConversation(null);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeConversation) return;

    try {
      await axios.post(`${API}/messages`, {
        listing_id: activeConversation.listing_id,
        receiver_id: activeConversation.other_user_id,
        message: replyText.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await axios.get(`${API}/messages/conversation`, {
        params: { listing_id: activeConversation.listing_id, other_user_id: activeConversation.other_user_id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationMessages(res.data);
      setReplyText("");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith('/') ? `${BACKEND_URL}${avatar}` : avatar;
  };

  if (!user) return null;

  // Mobile: show either list OR chat, not both
  const showMobileChat = activeConversation !== null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="messages-page">
      {/* Mobile Chat View */}
      {showMobileChat && (
        <div className="sm:hidden fixed inset-0 z-40 bg-white flex flex-col">
          {/* Mobile Chat Header */}
          <div className="flex items-center gap-3 p-3 border-b border-slate-100 bg-white">
            <button
              onClick={handleBackToList}
              className="p-1 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
              {activeConversation.other_user_avatar ? (
                <img
                  src={getAvatarUrl(activeConversation.other_user_avatar)}
                  alt={activeConversation.other_user_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 truncate">
                {activeConversation.other_user_name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {activeConversation.listing_title}
              </p>
            </div>
          </div>

          {/* Mobile Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {conversationLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : conversationMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {conversationMessages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-md'
                            : 'bg-white text-slate-900 rounded-bl-md border border-slate-100'
                        }`}
                      >
                        <p className="text-sm">{m.message}</p>
                        <p className={`mt-1 text-[10px] text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {formatDate(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Mobile Input */}
          <div className="p-3 border-t border-slate-100 bg-white safe-area-bottom">
            <div className="flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                placeholder="Type your message..."
                data-testid="message-input"
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={1}
              />
              <Button
                onClick={sendReply}
                disabled={!replyText.trim()}
                data-testid="send-btn"
                className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 p-0 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Mobile List View */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h1 className="font-manrope font-bold text-xl text-slate-900">
            Messages
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-xl text-slate-600">
              No messages yet
            </h3>
            <p className="text-slate-500 mt-2">
              When someone contacts you about your listing, it will appear here
            </p>
          </div>
        ) : (
          <div className="flex bg-white rounded-2xl border border-slate-100 overflow-hidden h-[calc(100vh-180px)] min-h-[400px]">
            {/* Left sidebar - Chat list */}
            <div className="w-full sm:w-72 border-r border-slate-100 flex flex-col">
              {/* Sidebar header */}
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Chats</p>
              </div>
              
              {/* Chat list */}
              <div className="flex-1 overflow-y-auto" data-testid="thread-list">
                {threads.map((thread) => {
                  const isSelected =
                    activeConversation &&
                    activeConversation.listing_id === thread.listing_id &&
                    activeConversation.other_user_id === thread.other_user_id;

                  return (
                    <button
                      key={`${thread.listing_id}-${thread.other_user_id}`}
                      type="button"
                      data-testid="thread-item"
                      onClick={() => openConversation(thread)}
                      className={`w-full text-left p-3 flex items-center gap-3 transition-colors border-b border-slate-50 ${
                        isSelected 
                          ? 'bg-emerald-50 border-l-2 border-l-emerald-500' 
                          : 'hover:bg-slate-50 active:bg-slate-100'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                          {thread.other_user_avatar ? (
                            <img
                              src={getAvatarUrl(thread.other_user_avatar)}
                              alt={thread.other_user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        {/* Unread indicator */}
                        {thread.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">
                            {thread.unread_count > 9 ? '9+' : thread.unread_count}
                          </span>
                        )}
                      </div>

                      {/* Name and preview */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {thread.other_user_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {thread.listing_title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side - Chat window (Desktop only) */}
            <div className="hidden sm:flex flex-1 flex-col">
              {activeConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                      {activeConversation.other_user_avatar ? (
                        <img
                          src={getAvatarUrl(activeConversation.other_user_avatar)}
                          alt={activeConversation.other_user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {activeConversation.other_user_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {activeConversation.listing_title}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {conversationLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <>
                        {conversationMessages.map((m) => {
                          const isMe = m.sender_id === user.id;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                  isMe
                                    ? 'bg-emerald-600 text-white rounded-br-md'
                                    : 'bg-white text-slate-900 rounded-bl-md border border-slate-100'
                                }`}
                              >
                                <p className="text-sm">{m.message}</p>
                                <p className={`mt-1 text-[10px] text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                  {formatDate(m.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                        placeholder="Type your message..."
                        data-testid="message-input-desktop"
                        className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows={1}
                      />
                      <Button
                        onClick={sendReply}
                        disabled={!replyText.trim()}
                        data-testid="send-btn-desktop"
                        className="h-11 w-11 rounded-full bg-emerald-600 hover:bg-emerald-700 p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Mail className="w-12 h-12 mb-3" />
                  <p className="text-sm">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
