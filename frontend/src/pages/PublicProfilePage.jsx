import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import CarCard from "../components/CarCard";
import { User, Heart, Bookmark, Car, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    fetchProfile();
    if (currentUser && token) {
      fetchMyFavoriteIds();
    }
  }, [userId, currentUser, token]);

  const fetchMyFavoriteIds = async () => {
    try {
      const res = await axios.get(`${API}/favorites/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoriteIds(res.data);
    } catch (e) {}
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users/${userId}/public`);
      setProfile(res.data.user);
      setListings(res.data.listings || []);
      setFavorites(res.data.favorites || []);
      setSavedSearches(res.data.saved_searches || []);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <User className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="font-manrope font-bold text-xl text-slate-600">User not found</h2>
        <Link to="/" className="mt-4 text-emerald-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "listings", label: "Listings", icon: Car, count: listings.length },
    ...(profile.show_favorites ? [{ id: "favorites", label: "Favorites", icon: Heart, count: favorites.length }] : []),
    ...(profile.show_saved_searches ? [{ id: "searches", label: "Searches", icon: Bookmark, count: savedSearches.length }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="public-profile-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img 
                  src={profile.avatar.startsWith('/') ? `${BACKEND_URL}${profile.avatar}` : profile.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="font-manrope font-bold text-xl sm:text-2xl text-slate-900">
                {profile.nickname || profile.name}
              </h1>
              <p className="text-slate-500 mt-1">
                {listings.length} listing{listings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "listings" && (
          <div>
            {listings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Car className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-600">No listings yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {listings.map((car) => (
                  <CarCard 
                    key={car.id} 
                    car={car}
                    isFavorite={favoriteIds.includes(car.id)}
                    onFavoriteChange={fetchMyFavoriteIds}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && profile.show_favorites && (
          <div>
            {favorites.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Heart className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-600">No favorites yet</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {favorites.map((car) => (
                  <CarCard 
                    key={car.id} 
                    car={car}
                    isFavorite={favoriteIds.includes(car.id)}
                    onFavoriteChange={fetchMyFavoriteIds}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "searches" && profile.show_saved_searches && (
          <div>
            {savedSearches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <Bookmark className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-600">No saved searches</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSearches.map((search) => (
                  <Link
                    key={search.id}
                    to={`/?${new URLSearchParams(search.filters).toString()}`}
                    className="block bg-white rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="font-semibold text-slate-900">{search.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {Object.entries(search.filters).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'All listings'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
