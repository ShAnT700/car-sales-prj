import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Gauge, Heart, User } from "lucide-react";
import { useAuth, API } from "../App";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Clean Title Badge
const CleanTitleBadge = () => (
  <div 
    className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center"
    title="Clean Title"
  >
    CT
  </div>
);

export default function CarCard({ car, isFavorite = false, onFavoriteChange }) {
  const { user, token } = useAuth();
  const [favorite, setFavorite] = useState(isFavorite);
  const [loading, setLoading] = useState(false);
  const [localCount, setLocalCount] = useState(car.favorite_count ?? 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage) => {
    if (mileage >= 1000) {
      return `${Math.round(mileage / 1000)}k`;
    }
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const formatCount = (count) => {
    if (count >= 1000) {
      return `${Math.round(count / 100) / 10}K`;
    }
    return count;
  };

  const imageUrl = car.images?.[0] 
    ? `${BACKEND_URL}${car.images[0]}`
    : "https://images.unsplash.com/photo-1552300878-295b1871e1b4?auto=format&fit=crop&w=800&q=80";

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }

    setLoading(true);
    try {
      if (favorite) {
        await axios.delete(`${API}/favorites/${car.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(false);
        setLocalCount(prev => Math.max(0, prev - 1));
        toast.success("Removed from favorites");
      } else {
        await axios.post(`${API}/favorites`, { listing_id: car.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorite(true);
        setLocalCount(prev => prev + 1);
        toast.success("Added to favorites");
      }
      onFavoriteChange?.();
    } catch (err) {
      toast.error("Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/car/${car.id}`}
      data-testid="listing-card"
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white car-card"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Seller avatar circle */}
        <Link
          to={`/user/${car.user_id}`}
          onClick={(e) => e.stopPropagation()}
          data-testid="seller-avatar"
          className="absolute top-2 left-2 w-9 h-9 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center hover:scale-105 transition-transform z-10"
        >
          {car.user_avatar ? (
            <img
              src={car.user_avatar.startsWith('/') ? `${BACKEND_URL}${car.user_avatar}` : car.user_avatar}
              alt={car.user_name || 'Seller avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-slate-500" />
          )}
        </Link>

        {car.clean_title && (
          <div className="absolute bottom-2 right-2">
            <CleanTitleBadge />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-4">
        {/* Model & Price on one line */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-manrope font-bold text-slate-900 truncate text-xs sm:text-base flex-1">
            {car.make} {car.model}
          </h3>
          <span className="inline-block text-emerald-700 font-bold bg-emerald-50 rounded-full text-xs sm:text-sm px-2 py-0.5 whitespace-nowrap flex-shrink-0">
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Mileage, City & Like button on second line */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-slate-500 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>{formatMileage(car.mileage)} mi</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[60px] sm:max-w-[80px]">{car.city}</span>
            </div>
          </div>

          {/* Like button */}
          <button
            onClick={toggleFavorite}
            disabled={loading}
            data-testid="favorite-btn"
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
              favorite 
                ? 'bg-red-50 text-red-500' 
                : 'bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${favorite ? 'fill-current scale-110' : ''}`} 
            />
            <span 
              className={`text-xs sm:text-sm font-medium ${favorite ? 'text-red-500' : 'text-slate-500'}`}
              data-testid="favorite-count"
            >
              {formatCount(localCount)}
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}
