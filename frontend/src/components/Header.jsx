import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import { Search, Menu, X, LogOut, Plus, Heart, Bookmark, Mail } from "lucide-react";
import { Button } from "./ui/button";
import AuthModal from "./AuthModal";
import FiltersModal from "./FiltersModal";
import axios from "axios";

export default function Header() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();
    }
  }, [user, token]);

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

  const handleFiltersClose = () => {
    setShowFilters(false);
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
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Find Car Button - Always visible */}
              <Button
                data-testid="find-car-btn"
                onClick={() => setShowFilters(true)}
                variant="outline"
                className="h-8 sm:h-10 px-3 sm:px-5 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0 transition-all text-xs sm:text-sm"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Find
              </Button>

              {user ? (
                <>
                  {/* Desktop buttons */}
                  <div className="hidden sm:flex items-center gap-2">
                    {/* Messages */}
                    <Button
                      data-testid="messages-btn"
                      onClick={() => navigate("/messages")}
                      variant="outline"
                      className="h-10 px-4 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0 relative"
                    >
                      <Mail className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>

                    {/* Favorites */}
                    <Button
                      data-testid="favorites-btn"
                      onClick={() => navigate("/favorites")}
                      variant="outline"
                      className="h-10 px-4 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>

                    {/* Saved Searches */}
                    <Button
                      data-testid="saved-searches-btn"
                      onClick={() => navigate("/saved-searches")}
                      variant="outline"
                      className="h-10 px-4 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>

                    {/* My Listings */}
                    <Button
                      data-testid="my-listings-btn"
                      onClick={() => navigate("/my-listings")}
                      className="h-10 px-5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 btn-sell"
                    >
                      My Listings
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
                <>
                  <Button
                    data-testid="sell-car-btn"
                    onClick={handleSellClick}
                    className="h-8 sm:h-10 px-3 sm:px-5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 btn-sell text-xs sm:text-sm"
                  >
                    Sell Car
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && user && (
            <div className="sm:hidden py-3 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Messages
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Heart className="w-4 h-4" />
                  Favorites
                </Link>
                <Link
                  to="/saved-searches"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Bookmark className="w-4 h-4" />
                  Saved Searches
                </Link>
                <Link
                  to="/create-listing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Listing
                </Link>
                <Button
                  onClick={() => {
                    navigate("/my-listings");
                    setMobileMenuOpen(false);
                  }}
                  className="mx-4 h-10 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  My Listings
                </Button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <FiltersModal open={showFilters} onClose={handleFiltersClose} />
    </>
  );
}
