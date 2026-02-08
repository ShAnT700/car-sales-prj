import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Plus, Edit, Trash2, Car, Loader2, Eye } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MyListingsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (!user) {
      return;
    }

    fetchListings();
  }, [user, token, navigate]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API}/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(res.data);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    
    try {
      await axios.delete(`${API}/listings/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(listings.filter(l => l.id !== deleteId));
      toast.success("Listing deleted successfully");
    } catch (err) {
      toast.error("Failed to delete listing");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="my-listings-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-manrope font-bold text-3xl text-slate-900">
              My Listings
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your car listings
            </p>
          </div>
          
          <Link to="/create-listing">
            <Button
              data-testid="create-listing-btn"
              className="h-11 px-6 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Listing
            </Button>
          </Link>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-xl text-slate-600">
              No listings yet
            </h3>
            <p className="text-slate-500 mt-2 mb-6">
              Create your first car listing to start selling
            </p>
            <Link to="/create-listing">
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4" data-testid="my-listings-list">
            {listings.map((car) => (
              <div
                key={car.id}
                data-testid={`my-listing-${car.id}`}
                className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Image */}
                <div className="w-full sm:w-48 h-36 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={car.images?.[0] ? `${BACKEND_URL}${car.images[0]}` : "https://images.unsplash.com/photo-1552300878-295b1871e1b4?auto=format&fit=crop&w=400&q=80"}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-manrope font-bold text-lg text-slate-900">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-emerald-600 font-bold text-xl mt-1">
                      {formatPrice(car.price)}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {car.city}, {car.zip_code} • {car.mileage.toLocaleString()} mi
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Link to={`/car/${car.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/edit-listing/${car.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`delete-listing-${car.id}`}
                      onClick={() => setDeleteId(car.id)}
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
