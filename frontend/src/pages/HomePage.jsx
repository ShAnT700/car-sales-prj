import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import CarCard from "../components/CarCard";
import FullSearchPanel from "../components/FullSearchPanel";
import { Button } from "../components/ui/button";
import { SlidersHorizontal, Car, Loader2, ChevronDown, ChevronUp } from "lucide-react";

// Racing Helmet Icon
const RacingHelmetIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L12 12l7.07 7.07C20.88 17.26 22 14.76 22 12c0-5.52-4.48-10-10-10zm0 2c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9L12 10.59 5.69 16.9C4.63 15.55 4 13.85 4 12c0-4.41 3.59-8 8-8z"/>
    <path d="M12 6c-3.31 0-6 2.69-6 6 0 1.1.3 2.14.82 3.03L12 9.86l5.18 5.17c.52-.89.82-1.93.82-3.03 0-3.31-2.69-6-6-6z"/>
  </svg>
);

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFilters, setHasFilters] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetchListings();
    if (user && token) {
      fetchFavoriteIds();
    }
  }, [searchParams, user, token]);

  useEffect(() => {
    if (hasFilters && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasFilters]);

  const fetchFavoriteIds = async () => {
    try {
      const res = await axios.get(`${API}/favorites/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoriteIds(res.data);
    } catch (e) {}
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      const filterKeys = ['make', 'model', 'yearFrom', 'yearTo', 'mileageFrom', 'mileageTo', 'priceFrom', 'priceTo', 'driveType', 'zipCode'];
      
      filterKeys.forEach(key => {
        const value = searchParams.get(key);
        if (value) {
          const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          params[apiKey] = value;
        }
      });

      setHasFilters(Object.keys(params).length > 0);
      
      const res = await axios.get(`${API}/listings`, { params });
      setListings(res.data);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeFilters = [];
  if (searchParams.get('make')) activeFilters.push(searchParams.get('make'));
  if (searchParams.get('model')) activeFilters.push(searchParams.get('model'));

  return (
    <div className="min-h-screen bg-slate-50" data-testid="home-page">
      {/* Hero Section - Compact */}
      <section className="relative bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="font-manrope font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight text-center mb-4">
            Good cars are selling here!
          </h1>

          {/* Search Trigger Button */}
          <button
            onClick={() => setSearchPanelOpen(true)}
            className="w-full max-w-2xl mx-auto flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-100 hover:border-red-200 transition-colors"
            data-testid="open-search-btn"
          >
            <div className="flex items-center gap-3">
              <RacingHelmetIcon className="w-7 h-7 text-red-500" />
              <span className="font-manrope font-bold text-lg text-slate-900">Let's find new ride!</span>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </section>

      {/* Listings Section */}
      <section ref={resultsRef} className="py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with filters */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="font-manrope font-bold text-lg sm:text-xl text-slate-900">
                {hasFilters ? "Search Results" : "Latest Listings"}
              </h2>
              {hasFilters && activeFilters.length > 0 && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {activeFilters.join(" · ")}
                </p>
              )}
            </div>
            
            {hasFilters && (
              <Button
                data-testid="edit-filters-btn"
                variant="outline"
                onClick={() => setSearchPanelOpen(true)}
                className="rounded-full text-sm"
                size="sm"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-14 h-14 text-slate-300 mx-auto mb-3" />
              <h3 className="font-manrope font-semibold text-lg text-slate-600">
                No listings found
              </h3>
              <p className="text-slate-500 mt-1 text-sm">
                {hasFilters 
                  ? "Try adjusting your search filters"
                  : "Be the first to list your car!"
                }
              </p>
            </div>
          ) : (
            <div 
              data-testid="listings-grid"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5"
            >
              {listings.slice(0, 15).map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  isFavorite={favoriteIds.includes(car.id)}
                  onFavoriteChange={fetchFavoriteIds}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Full Search Panel */}
      <FullSearchPanel 
        isOpen={searchPanelOpen} 
        onClose={() => setSearchPanelOpen(false)}
        onSearch={() => {}}
      />
    </div>
  );
}
