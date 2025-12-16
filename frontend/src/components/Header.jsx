import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../App";
import { Search, Menu, X, User, LogOut, Plus } from "lucide-react";
import { Button } from "./ui/button";
import AuthModal from "./AuthModal";
import FiltersModal from "./FiltersModal";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              data-testid="logo-link"
              className="flex items-center gap-2"
            >
              <div className="border-2 border-slate-900 rounded-[50%] px-4 py-1">
                <span className="font-manrope font-black text-lg sm:text-xl tracking-tighter italic text-slate-900">
                  NextRides
                </span>
              </div>
            </Link>

            {/* Right side buttons - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Catalog Button - Gray, same shape */}
              <Button
                data-testid="catalog-btn"
                onClick={() => setShowFilters(true)}
                variant="outline"
                className="h-10 px-6 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0 transition-all"
              >
                <Search className="w-4 h-4 mr-2" />
                Catalog
              </Button>

              {user ? (
                <>
                  <Button
                    data-testid="my-listings-btn"
                    onClick={() => navigate("/my-listings")}
                    className="h-10 px-6 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 btn-sell"
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
                </>
              ) : (
                <Button
                  data-testid="sell-car-btn"
                  onClick={handleSellClick}
                  className="h-10 px-6 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 btn-sell"
                >
                  Sell Car
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 border-t border-slate-100">
              <div className="flex flex-col gap-3">
                {/* Catalog Button - Mobile */}
                <Button
                  data-testid="mobile-catalog-btn"
                  onClick={() => {
                    setShowFilters(true);
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="mx-4 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-0"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Catalog
                </Button>
                
                {user ? (
                  <>
                    <Link
                      to="/create-listing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600"
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
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setShowAuth(true);
                      setMobileMenuOpen(false);
                    }}
                    className="mx-4 h-10 rounded-full bg-emerald-600 text-white font-semibold"
                  >
                    Sell Car
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <FiltersModal open={showFilters} onClose={() => setShowFilters(false)} />
    </>
  );
}
