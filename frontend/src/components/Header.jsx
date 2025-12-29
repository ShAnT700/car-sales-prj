import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import { Menu, X, LogOut, Plus, Heart, Mail } from "lucide-react";
import { Button } from "./ui/button";
import AuthModal from "./AuthModal";
import axios from "axios";

// Custom icons
const SavedSearchIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 10h16M4 14h10" strokeLinecap="round"/>
    <path d="M17 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" stroke="#ef4444"/>
    <path d="M18 18l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" stroke="#ef4444"/>
  </svg>
);

export default function Header({ onOpenSearch }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diff = touchStartY - currentY;
    // Swipe up to close
    if (diff > 50) {
      setMobileMenuOpen(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.count);
    } catch (e) {}
  };

  const handleSellClick = () => {
    if (user) {
      navigate("/my-listings");
    } else {
      setShowAuth(true);
    }
  };

  return (
    <>
      <header 
        data-testid="main-header"
        className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 header-blur"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link 
              to="/" 
              data-testid="logo-link"
              className="flex items-center gap-2"
            >
              <div className="border-2 border-slate-900 rounded-[50%] px-3 sm:px-4 py-0.5 sm:py-1">
                <span className="font-manrope font-black text-base sm:text-xl tracking-tighter italic text-slate-900">
                  NextRides
                </span>
              </div>
            </Link>

            {/* Right side buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {user ? (
                <>
                  {/* Desktop buttons */}
                  <div className="hidden sm:flex items-center gap-2">
                    {/* Messages - Colorful with red dot */}
                    <Button
                      data-testid="messages-btn"
                      onClick={() => navigate("/messages")}
                      variant="outline"
                      className="h-10 px-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 relative"
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </span>
                      )}
                    </Button>

                    {/* Favorites - Red heart */}
                    <Button
                      data-testid="favorites-btn"
                      onClick={() => navigate("/favorites")}
                      variant="outline"
                      className="h-10 px-3 rounded-full bg-red-50 border-red-200 hover:bg-red-100"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </Button>

                    {/* Saved Searches - List with hearts */}
                    <Button
                      data-testid="saved-searches-btn"
                      onClick={() => navigate("/saved-searches")}
                      variant="outline"
                      className="h-10 px-3 rounded-full bg-pink-50 border-pink-200 hover:bg-pink-100"
                    >
                      <SavedSearchIcon className="w-4 h-4" />
                    </Button>

                    {/* My Listings */}
                    <Button
                      data-testid="my-listings-btn"
                      onClick={() => navigate("/my-listings")}
                      className="h-10 px-5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                    >
                      My Listings
                    </Button>

                    {/* Profile */}
                    <Button
                      data-testid="profile-btn"
                      onClick={() => navigate("/profile")}
                      variant="outline"
                      className="h-10 w-10 p-0 rounded-full bg-slate-100 hover:bg-slate-200"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-slate-600">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Button>

                    <button
                      data-testid="logout-btn"
                      onClick={logout}
                      className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile menu button */}
                  <button
                    data-testid="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="sm:hidden p-2 text-slate-600"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                <Button
                  data-testid="sell-car-btn"
                  onClick={handleSellClick}
                  className="h-8 sm:h-10 px-3 sm:px-5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 text-xs sm:text-sm"
                >
                  Sell Car
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu - with swipe and click outside to close */}
          {mobileMenuOpen && user && (
            <div 
              ref={menuRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className="sm:hidden py-3 border-t border-slate-100 bg-white"
            >
              {/* Swipe indicator */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Messages
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  Favorites
                </Link>
                <Link
                  to="/saved-searches"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <SavedSearchIcon className="w-4 h-4" />
                  Saved Searches
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-600">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  Profile
                </Link>
                <Button
                  onClick={() => {
                    navigate("/create-listing");
                    setMobileMenuOpen(false);
                  }}
                  className="mx-4 h-10 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Listing
                </Button>
                <Button
                  onClick={() => {
                    navigate("/my-listings");
                    setMobileMenuOpen(false);
                  }}
                  className="mx-4 h-10 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  My Listings
                </Button>
                <Button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="mx-4 h-10 rounded-full border-red-500 text-red-600 hover:bg-red-50 font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
