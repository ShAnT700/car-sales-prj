import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Mail, Loader2, Inbox, Send, Car, User } from "lucide-react";

export default function MessagesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inbox");
  const [messages, setMessages] = useState([]);
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
    fetchMessages();
  }, [user, navigate, activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "inbox" ? "/messages/inbox" : "/messages/sent";
      const res = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load messages");
  const openConversation = async (msg) => {
    const otherUserId = activeTab === "inbox" ? msg.sender_id : msg.receiver_id;
    const listingId = msg.listing_id;

    setActiveConversation({
      listing_id: listingId,
      other_user_id: otherUserId,
      listing_title: msg.listing_title,
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
        receiver_id: activeTab === "inbox" ? activeConversation.other_user_id : activeConversation.other_user_id,
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

    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await axios.put(`${API}/messages/${msgId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.map(m => m.id === msgId ? { ...m, read: true } : m));
    } catch (e) {}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "inbox" ? "default" : "outline"}
            onClick={() => setActiveTab("inbox")}
            className="rounded-full"
          >
            <Inbox className="w-4 h-4 mr-2" />
            Inbox
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "outline"}
            onClick={() => setActiveTab("sent")}
            className="rounded-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Sent
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-xl text-slate-600">
              No messages yet
            </h3>
            <p className="text-slate-500 mt-2">
              {activeTab === "inbox" 
                ? "When someone contacts you about your listing, it will appear here"
                : "Messages you send will appear here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => activeTab === "inbox" && !msg.read && markAsRead(msg.id)}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  !msg.read && activeTab === "inbox" ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {activeTab === "inbox" ? msg.sender_name : msg.receiver_name}
                    </span>
                    {!msg.read && activeTab === "inbox" && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">{formatDate(msg.created_at)}</span>
                </div>
                
                <Link 
                  to={`/car/${msg.listing_id}`}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:underline mb-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Car className="w-3 h-3" />
                  {msg.listing_title}
                </Link>
                
                <p className="text-slate-600 text-sm line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
