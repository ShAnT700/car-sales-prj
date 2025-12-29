import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Mail, Loader2, Car, User } from "lucide-react";

export default function MessagesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null); // { listing_id, other_user_id, listing_title }
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchThreads();
  }, [user, navigate]);

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
    const otherUserId = thread.other_user_id;
    const listingId = thread.listing_id;

    setActiveConversation({
      listing_id: listingId,
      other_user_id: otherUserId,
      listing_title: thread.listing_title,
    });

    setConversationLoading(true);
    try {
      const res = await axios.get(`${API}/messages/conversation`, {
        params: { listing_id: listingId, other_user_id: otherUserId },
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

  const sendReply = async () => {
    if (!replyText.trim() || !activeConversation) return;

    try {
      const payload = {
        listing_id: activeConversation.listing_id,
        receiver_id: activeConversation.other_user_id,
        message: replyText.trim(),
      };

      await axios.post(`${API}/messages`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // reload conversation
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

  const markAsReadThread = async (threadId) => {
    // We don't have per-thread read API; threads endpoint already reflects unread_count
    // Optionally, we could mark all messages as read server-side here if needed.
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="messages-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-blue-500" />
          <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-slate-900">
            Messages
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Chat selector menu */}
            <div className="mb-4 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
              <p className="block text-xs font-medium text-slate-500 mb-2">Select chat</p>
              {threads.length === 0 ? (
                <p className="text-sm text-slate-400">No chats yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {threads.map((thread, idx) => {
                    const selected =
                      activeConversation &&
                      activeConversation.listing_id === thread.listing_id &&
                      activeConversation.other_user_id === thread.other_user_id;

                    const colorClasses = [
                      'bg-emerald-50/70 border-emerald-100',
                      'bg-blue-50/70 border-blue-100',
                      'bg-amber-50/70 border-amber-100',
                      'bg-pink-50/70 border-pink-100',
                    ];
                    const colorClass = colorClasses[idx % colorClasses.length];

                    const imageSrc = thread.listing_image
                      ? (thread.listing_image.startsWith('http')
                          ? thread.listing_image
                          : `${API.replace('/api','')}${thread.listing_image}`)
                      : null;

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => openConversation(thread)}
                        className={`w-full text-left rounded-xl border px-3 py-2 flex items-center gap-3 transition-colors ${
                          selected ? 'ring-1 ring-emerald-500 shadow-sm bg-white' : colorClass
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                          {thread.other_user_avatar ? (
                            <img
                              src={thread.other_user_avatar.startsWith('/') ? `${API.replace('/api','')}${thread.other_user_avatar}` : thread.other_user_avatar}
                              alt={thread.other_user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {thread.other_user_name}
                            </p>
                            {thread.unread_count > 0 && (
                              <span className="min-w-[18px] px-1 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">
                                {thread.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-600 truncate">
                              {thread.listing_title}
                            </p>
                            {imageSrc && (
                              <div className="w-10 h-7 rounded-md overflow-hidden flex-shrink-0 border border-white/60 shadow-sm">
                                <img
                                  src={imageSrc}
                                  alt={thread.listing_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {threads.length === 0 ? (
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
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col min-h-[320px]">
                {activeConversation ? (
                <>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Conversation</p>
                      <p className="font-manrope font-semibold text-slate-900 text-sm sm:text-base">
                        {activeConversation.listing_title}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {conversationLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    ) : conversationMessages.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center mt-8">
                        No messages in this conversation yet.
                      </p>
                    ) : (
                      conversationMessages.map((m) => {
                        const isMe = m.sender_id === user.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-br-sm'
                                  : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                              }`}
                            >
                              <p>{m.message}</p>
                              <p className="mt-1 text-[10px] opacity-70 text-right">
                                {formatDate(m.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 max-h-24"
                      rows={2}
                    />
                    <Button
                      onClick={sendReply}
                      disabled={!replyText.trim()}
                      className="rounded-full h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-sm">
                  <User className="w-10 h-10 mb-2" />
                  <p>Select a message to see the full conversation and reply.</p>
                </div>
              )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
