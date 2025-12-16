import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import QuickSearch from "../components/QuickSearch";
import CarCard from "../components/CarCard";
import FiltersModal from "../components/FiltersModal";
import { Button } from "../components/ui/button";
import { SlidersHorizontal, Car, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  // Collapse search and scroll to results when filters are applied
  useEffect(() => {
    if (hasFilters && resultsRef.current) {
      setSearchCollapsed(true);
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasFilters]);

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
  if (searchParams.get('yearFrom') || searchParams.get('yearTo')) {
    activeFilters.push(`${searchParams.get('yearFrom') || 'Any'} - ${searchParams.get('yearTo') || 'Any'}`);
  }

  // Limit listings on mobile
  const displayListings = listings;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="home-page">
      {/* Hero Section - Compact */}
      <section className="relative bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight text-center mb-6">
            Good cars are selling here!
          </h1>

          {/* Fast Search - Collapsible */}
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSearchCollapsed(!searchCollapsed)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-700" />
                <span className="font-manrope font-semibold text-slate-900">Fast search</span>
              </div>
              {searchCollapsed ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              )}
            </button>
            
            {!searchCollapsed && <QuickSearch onSearch={() => setSearchCollapsed(true)} />}
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section ref={resultsRef} className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with filters */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-manrope font-bold text-xl sm:text-2xl text-slate-900">
                {hasFilters ? "Search Results" : "Latest Listings"}
              </h2>
              {hasFilters && activeFilters.length > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  Filters: {activeFilters.join(", ")}
                </p>
              )}
            </div>
            
            {hasFilters && (
              <Button
                data-testid="show-filters-btn"
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            )}
          </div>

          {/* Listings Grid - 2 columns on mobile, max 15 on mobile */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-manrope font-semibold text-xl text-slate-600">
                No listings found
              </h3>
              <p className="text-slate-500 mt-2">
                {hasFilters 
                  ? "Try adjusting your search filters"
                  : "Be the first to list your car!"
                }
              </p>
            </div>
          ) : (
            <div 
              data-testid="listings-grid"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
            >
              {displayListings.slice(0, window.innerWidth < 640 ? 15 : displayListings.length).map((car) => (
                <CarCard key={car.id} car={car} compact={window.innerWidth < 640} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FiltersModal open={showFilters} onClose={() => setShowFilters(false)} />
    </div>
  );
}
