import { Link } from "react-router-dom";
import { MapPin, Gauge } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CarCard({ car }) {
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

  const imageUrl = car.images?.[0] 
    ? `${BACKEND_URL}${car.images[0]}`
    : "https://images.unsplash.com/photo-1552300878-295b1871e1b4?auto=format&fit=crop&w=800&q=80";

  return (
    <Link
      to={`/car/${car.id}`}
      data-testid={`car-card-${car.id}`}
      className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white car-card"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Make & Model */}
        <h3 className="font-manrope font-bold text-lg text-slate-900 truncate">
          {car.year} {car.make} {car.model}
        </h3>

        {/* Price */}
        <div className="mt-2">
          <span className="inline-block text-emerald-700 font-bold text-xl bg-emerald-50 px-3 py-1 rounded-full">
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Mileage & Location */}
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            <span>{formatMileage(car.mileage)} mi</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{car.city}</span>
          </div>
        </div>

        {/* Drive Type Badge */}
        <div className="mt-3">
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {car.drive_type}
          </span>
        </div>
      </div>
    </Link>
  );
}
