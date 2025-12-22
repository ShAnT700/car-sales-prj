import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import CarCard from "../components/CarCard";
import { Car, Loader2 } from "lucide-react";

// Car Wheel Icon
const CarWheelIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFilters, setHasFilters] = useState(false);
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
      const filterKeys = ['make', 'model', 'yearFrom', 'yearTo', 'mileageFrom', 'mileageTo', 'priceFrom', 'priceTo', 'driveType', 'zipCode', 'cleanTitle'];
      
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
          <h1 className="font-manrope font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight text-center">
            Good cars are selling here!
          </h1>
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

      {/* Search panel is now controlled globally by GlobalSearchBar */}
    </div>
  );
}
