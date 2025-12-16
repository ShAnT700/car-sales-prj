import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Bookmark, Loader2, Search, Trash2, Play } from "lucide-react";

export default function SavedSearchesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchSearches();
  }, [user, navigate]);

  const fetchSearches = async () => {
    try {
      const res = await axios.get(`${API}/saved-searches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearches(res.data);
    } catch (err) {
      toast.error("Failed to load saved searches");
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id) => {
    try {
      await axios.delete(`${API}/saved-searches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearches(searches.filter(s => s.id !== id));
      toast.success("Search deleted");
    } catch (err) {
      toast.error("Failed to delete search");
    }
  };

  const runSearch = (search) => {
    const params = new URLSearchParams(search.filters);
    navigate(`/?${params.toString()}`);
  };

  const formatFilters = (filters) => {
    const parts = [];
    if (filters.make) parts.push(filters.make);
    if (filters.model) parts.push(filters.model);
    if (filters.yearFrom || filters.yearTo) parts.push(`${filters.yearFrom || 'Any'}-${filters.yearTo || 'Any'}`);
    if (filters.priceFrom || filters.priceTo) parts.push(`$${filters.priceFrom || '0'}-$${filters.priceTo || '∞'}`);
    return parts.join(', ') || 'All listings';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="saved-searches-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-6 h-6 text-blue-500" />
          <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-slate-900">
            Saved Searches
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-xl text-slate-600">
              No saved searches
            </h3>
            <p className="text-slate-500 mt-2">
              Save your search filters to quickly find cars later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{search.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{formatFilters(search.filters)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runSearch(search)}
                    className="rounded-full"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSearch(search.id)}
                    className="rounded-full text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
