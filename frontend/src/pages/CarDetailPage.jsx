import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { 
  ArrowLeft, Phone, MapPin, Gauge, Calendar, 
  Car, Hash, FileText, ChevronLeft, ChevronRight,
  Loader2, X, ZoomIn, MessageSquare, Heart, User
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CarDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);

  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to add favorites");
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${car.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await axios.post(`${API}/favorites`, { listing_id: car.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        toast.success("Added to favorites!");
      }
    } catch (err) {
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user) return;
    
    setSendingMessage(true);
    try {
      await axios.post(`${API}/messages`, {
        listing_id: car.id,
        receiver_id: car.user_id,
        message: messageText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Message sent to seller!");
      setMessageText("");
      setShowMessageForm(false);
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchCar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user && token && car) {
      checkFavorite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, car]);

  useEffect(() => {
    if (car?.user_id) {
      fetchSeller(car.user_id);
    }
  }, [car?.user_id]);

  const checkFavorite = async () => {
    try {
      const res = await axios.get(`${API}/favorites/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorite(res.data.includes(car.id));
    } catch (e) {
      console.error("Failed to check favorite", e);
    }
  };

  const fetchSeller = async (userId) => {
    try {
      const res = await axios.get(`${API}/users/${userId}/public`);
      setSeller(res.data.user);
    } catch (err) {
      console.error("Failed to fetch seller:", err);
    }
  };

  const fetchCar = async () => {
    try {
      const res = await axios.get(`${API}/listings/${id}`);
      setCar(res.data);
    } catch (err) {
      console.error("Failed to fetch car:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    if (car?.images?.length > 1) {
      setCurrentImage((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    if (car?.images?.length > 1) {
      setCurrentImage((prev) => (prev - 1 + car.images.length) % car.images.length);
    }
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Car className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="font-manrope font-bold text-xl text-slate-600">Listing not found</h2>
        <Link to="/" className="mt-4 text-emerald-600 hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  const imageUrl = car.images?.[currentImage] 
    ? `${BACKEND_URL}${car.images[currentImage]}`
    : "https://images.unsplash.com/photo-1552300878-295b1871e1b4?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="min-h-screen bg-slate-50" data-testid="car-detail-page">
      {/* Back button */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/"
            data-testid="back-link"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div 
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in group"
              onClick={openLightbox}
            >
              <img
                src={imageUrl}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-testid="main-image"
              />
              
              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5 text-slate-600" />
              </div>
              
              {car.images?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    data-testid="prev-image-btn"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    data-testid="next-image-btn"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                    {currentImage + 1} / {car.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {car.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden gallery-thumb border-2 ${
                      idx === currentImage ? 'border-emerald-600' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={`${BACKEND_URL}${img}`}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title & Price & Favorite */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{car.year} {car.make} {car.model}</span>
                    {car.clean_title && (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
                        CT
                      </span>
                    )}
                  </h1>
                </div>
                {/* Favorite Button */}
                <Button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  variant="outline"
                  className={`h-12 w-12 p-0 rounded-full flex-shrink-0 ${
                    isFavorite ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}
                  data-testid="detail-favorite-btn"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <span className="inline-block text-emerald-700 font-bold text-2xl sm:text-3xl bg-emerald-50 px-4 py-2 rounded-full">
                  {formatPrice(car.price)}
                </span>
              </div>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                <Gauge className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Mileage</p>
                  <p className="font-semibold text-slate-900">{formatMileage(car.mileage)} mi</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Year</p>
                  <p className="font-semibold text-slate-900">{car.year}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                <Car className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Drive Type</p>
                  <p className="font-semibold text-slate-900">{car.drive_type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                <Hash className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">VIN</p>
                  <p className="font-semibold text-slate-900 text-sm truncate">{car.vin}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-semibold text-slate-900">{car.city}, {car.zip_code}</p>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-white rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Description</h3>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{car.description}</p>
            </div>

            {/* Contact & Seller */}
            <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
              {/* Seller profile block */}
              <Link
                to={`/user/${car.user_id}`}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                    {seller?.avatar ? (
                      <img
                        src={seller.avatar.startsWith('/') ? `${BACKEND_URL}${seller.avatar}` : seller.avatar}
                        alt={seller.nickname || seller.name || 'Seller avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400">Seller</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {seller?.nickname || seller?.name || car.user_name || 'Seller'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">View profile</span>
              </Link>

              {/* Call Seller button (separate) */}
              <a
                href={`tel:${car.phone}`}
                data-testid="contact-phone"
                className="inline-flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>Call Seller</span>
              </a>

              {/* Message Form */}
              {showMessageForm && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write your message to the seller..."
                    className="w-full h-24 p-3 bg-slate-800 text-white rounded-lg resize-none placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    data-testid="message-textarea"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setShowMessageForm(false)}
                      className="flex-1 py-2 px-4 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      className="flex-1 py-2 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      data-testid="send-message-btn"
                    >
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              )}
              
              {!showMessageForm && user && car.user_id !== user.id && (
                <button
                  onClick={() => setShowMessageForm(true)}
                  className="mt-4 w-full py-3 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  data-testid="open-message-btn"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message to Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <img
              src={imageUrl}
              alt={`${car.make} ${car.model}`}
              className="max-w-full max-h-full object-contain"
              data-testid="lightbox-image"
            />
            
            {/* Navigation */}
            {car.images?.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-2 rounded-full">
                  {currentImage + 1} / {car.images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
