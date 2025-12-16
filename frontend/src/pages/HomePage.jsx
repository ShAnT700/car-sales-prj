import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import QuickSearch from "../components/QuickSearch";
import CarCard from "../components/CarCard";
import FiltersModal from "../components/FiltersModal";
import { Button } from "../components/ui/button";
import { SlidersHorizontal, Car, Loader2 } from "lucide-react";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      const filterKeys = ['make', 'model', 'yearFrom', 'yearTo', 'mileageFrom', 'mileageTo', 'priceFrom', 'priceTo', 'driveType', 'zipCode'];
      
      filterKeys.forEach(key => {
        const value = searchParams.get(key);
        if (value) {
          // Convert camelCase to snake_case for API
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

  return (
    <div className="min-h-screen bg-slate-50" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center mb-8">
            <h1 className="font-manrope font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight">
              Find Your Perfect Car
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Browse thousands of quality vehicles from trusted sellers across the nation
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-4xl mx-auto">
            <QuickSearch />
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with filters */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-manrope font-bold text-2xl text-slate-900">
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

          {/* Listings Grid */}
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {listings.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      <FiltersModal open={showFilters} onClose={() => setShowFilters(false)} />
    </div>
  );
}
