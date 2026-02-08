import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Upload, X, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ferrari", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep",
  "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Maserati", "Mazda",
  "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];
const YEARS = Array.from({ length: 35 }, (_, i) => 2025 - i);

const CAR_MODELS = {
  "Acura": ["MDX", "RDX", "TLX", "ILX", "NSX"],
  "Audi": ["A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7", "M3", "M5"],
  "Buick": ["Enclave", "Encore", "Envision"],
  "Cadillac": ["Escalade", "CT5", "XT5", "XT6"],
  "Chevrolet": ["Silverado", "Tahoe", "Suburban", "Camaro", "Corvette", "Malibu", "Equinox"],
  "Chrysler": ["300", "Pacifica"],
  "Dodge": ["Charger", "Challenger", "Durango", "Ram"],
  "Ferrari": ["488", "F8", "Roma", "SF90", "Portofino"],
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Bronco", "Edge"],
  "GMC": ["Sierra", "Yukon", "Acadia", "Terrain"],
  "Honda": ["Accord", "Civic", "CR-V", "Pilot", "HR-V", "Odyssey"],
  "Hyundai": ["Sonata", "Elantra", "Tucson", "Santa Fe", "Palisade"],
  "Infiniti": ["Q50", "Q60", "QX50", "QX60", "QX80"],
  "Jaguar": ["F-Pace", "E-Pace", "XF", "XE", "F-Type"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator"],
  "Kia": ["Telluride", "Sorento", "Sportage", "K5", "Stinger"],
  "Lamborghini": ["Urus", "Huracan", "Aventador"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Defender", "Discovery"],
  "Lexus": ["ES", "IS", "RX", "NX", "GX", "LX"],
  "Lincoln": ["Navigator", "Aviator", "Corsair"],
  "Maserati": ["Ghibli", "Levante", "Quattroporte"],
  "Mazda": ["CX-5", "CX-9", "Mazda3", "Mazda6", "MX-5"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "G-Class"],
  "Mini": ["Cooper", "Countryman", "Clubman"],
  "Mitsubishi": ["Outlander", "Eclipse Cross", "Mirage"],
  "Nissan": ["Altima", "Maxima", "Rogue", "Pathfinder", "Murano", "GT-R"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Ram": ["1500", "2500", "3500"],
  "Subaru": ["Outback", "Forester", "Crosstrek", "Ascent", "WRX"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "4Runner", "Tacoma", "Tundra"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Atlas", "Golf"],
  "Volvo": ["XC40", "XC60", "XC90", "S60", "V60"]
};

const CITIES = [
  "Los Angeles", "New York", "Miami", "Chicago", "Houston", "Dallas",
  "San Francisco", "San Diego", "Seattle", "Boston", "Atlanta", "Orlando",
  "Phoenix", "Denver", "Las Vegas"
];

export default function CreateListingPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(!!id);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    price: "",
    drive_type: "",
    city: "",
    zip_code: "",
    phone: user?.phone || "",
    vin: "",
    description: "",
    clean_title: "no"
  });

  const isEditing = !!id;

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (!user) {
      return;
    }
    
    if (isEditing) {
      fetchListing();
    }
  }, [user, token, navigate, id, isEditing]);

  const fetchListing = async () => {
    try {
      const res = await axios.get(`${API}/listings/${id}`);
      const car = res.data;
      
      if (car.user_id !== user.id) {
        toast.error("You can only edit your own listings");
        navigate("/my-listings");
        return;
      }
      
      setForm({
        make: car.make,
        model: car.model,
        year: String(car.year),
        mileage: String(car.mileage),
        price: String(car.price),
        drive_type: car.drive_type,
        city: car.city,
        zip_code: car.zip_code,
        phone: car.phone,
        vin: car.vin,
        description: car.description,
        clean_title: car.clean_title ? "yes" : "no"
      });
      setExistingImages(car.images || []);
    } catch (err) {
      toast.error("Failed to load listing");
      navigate("/my-listings");
    } finally {
      setFetchingData(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Image ${file.name} is larger than 10MB`);
      } else {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file)
        });
      }
    });

    if (validFiles.length === 0) return;

    setImages([...images, ...validFiles]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeExistingImage = (index) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };

  const totalImages = images.length + existingImages.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isEditing && totalImages < 1) {
      toast.error("Please upload at least 1 image");
      return;
    }
    
    if (form.description.length < 30) {
      toast.error("Description must be at least 30 characters");
      return;
    }

    if (form.description.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        // Update listing (without images for now)
        await axios.put(
          `${API}/listings/${id}`,
          {
            make: form.make,
            model: form.model,
            year: parseInt(form.year),
            mileage: parseInt(form.mileage),
            price: parseInt(form.price),
            drive_type: form.drive_type,
            city: form.city,
            zip_code: form.zip_code,
            phone: form.phone,
            vin: form.vin,
            description: form.description,
            clean_title: form.clean_title === "yes",
            images: existingImages
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Add new images if any
        if (images.length > 0) {
          const imageFormData = new FormData();
          images.forEach(img => imageFormData.append("images", img.file));
          imageFormData.append("authorization", `Bearer ${token}`);
          
          await axios.post(`${API}/listings/${id}/images`, imageFormData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        
        toast.success("Listing updated successfully!");
      } else {
        // Create new listing
        const formData = new FormData();
        formData.append("make", form.make);
        formData.append("model", form.model);
        formData.append("year", form.year);
        formData.append("mileage", form.mileage);
        formData.append("price", form.price);
        formData.append("drive_type", form.drive_type);
        formData.append("city", form.city);
        formData.append("zip_code", form.zip_code);
        formData.append("phone", form.phone);
        formData.append("vin", form.vin);
        formData.append("description", form.description);
        formData.append("clean_title", form.clean_title === "yes" ? "true" : "false");
        formData.append("authorization", `Bearer ${token}`);
        
        images.forEach(img => {
          formData.append("images", img.file);
        });

        await axios.post(`${API}/listings`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        toast.success("Listing created successfully!");
      }
      
      navigate("/my-listings");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (fetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="create-listing-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-manrope font-bold text-3xl text-slate-900">
            {isEditing ? "Edit Listing" : "Create New Listing"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-manrope font-semibold text-lg text-slate-900 mb-4">
              Photos {!isEditing && <span className="text-red-500">*</span>}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {isEditing 
                ? "Add more photos or keep existing ones"
                : "Upload at least 1 photo of your vehicle (max 10MB each)"
              }
            </p>

            {/* Image Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
              {/* Existing Images */}
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={`${BACKEND_URL}${img}`}
                    alt={`Existing ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* New Images */}
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={img.preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500">Add Photo</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              data-testid="image-input"
            />

            {totalImages < 1 && !isEditing && (
              <p className="text-sm text-red-500">
                At least 1 photo required
              </p>
            )}
          </div>

          {/* Clean Title */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-manrope font-semibold text-lg text-slate-900 mb-4">
              Clean Title
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, clean_title: "yes" })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  form.clean_title === "yes"
                    ? "bg-emerald-500 border-emerald-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, clean_title: "no" })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  form.clean_title === "no"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-manrope font-semibold text-lg text-slate-900 mb-4">
              Vehicle Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.make} 
                  onValueChange={(v) => setForm({ ...form, make: v, model: "" })}
                  required
                >
                  <SelectTrigger data-testid="listing-make" className="h-12 bg-slate-50">
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_MAKES.map((make) => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.model} 
                  onValueChange={(v) => setForm({ ...form, model: v })}
                  disabled={!form.make}
                  required
                >
                  <SelectTrigger data-testid="listing-model" className="h-12 bg-slate-50">
                    <SelectValue placeholder={form.make ? "Select Model" : "Select Make first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {form.make && CAR_MODELS[form.make]?.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.year} 
                  onValueChange={(v) => setForm({ ...form, year: v })}
                  required
                >
                  <SelectTrigger data-testid="listing-year" className="h-12 bg-slate-50">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Drive Type <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.drive_type} 
                  onValueChange={(v) => setForm({ ...form, drive_type: v })}
                  required
                >
                  <SelectTrigger data-testid="listing-drive-type" className="h-12 bg-slate-50">
                    <SelectValue placeholder="Select Drive Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mileage <span className="text-red-500">*</span></Label>
                <Input
                  data-testid="listing-mileage"
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  className="h-12 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Price (USD) <span className="text-red-500">*</span></Label>
                <Input
                  data-testid="listing-price"
                  type="number"
                  placeholder="e.g. 25000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="h-12 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>VIN <span className="text-red-500">*</span></Label>
                <Input
                  data-testid="listing-vin"
                  placeholder="17-character VIN"
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                  className="h-12 bg-slate-50 font-mono"
                  maxLength={17}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-manrope font-semibold text-lg text-slate-900 mb-4">
              Location & Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City <span className="text-red-500">*</span></Label>
                <Select
                  value={form.city}
                  onValueChange={(v) => setForm({ ...form, city: v })}
                  required
                >
                  <SelectTrigger data-testid="listing-city" className="h-12 bg-slate-50">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zip Code <span className="text-red-500">*</span></Label>
                <Input
                  data-testid="listing-zip"
                  placeholder="e.g. 90001"
                  value={form.zip_code}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 5).replace(/[^0-9]/g, "");
                    setForm({ ...form, zip_code: v });
                  }}
                  className="h-12 bg-slate-50"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  data-testid="listing-phone"
                  type="tel"
                  placeholder="e.g. +1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9+\-()\s]/g, "");
                    setForm({ ...form, phone: v });
                  }}
                  pattern="[0-9+()\-\s]{7,20}"
                  className="h-12 bg-slate-50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-manrope font-semibold text-lg text-slate-900 mb-4">
              Description
            </h2>

            <Textarea
              data-testid="listing-description"
              placeholder="Describe your vehicle... (30-1000 characters)"
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setForm({ ...form, description: e.target.value });
                }
              }}
              className="min-h-[150px] bg-slate-50 resize-none"
              required
            />
            <p className="text-sm text-slate-500 mt-2">
              {form.description.length}/1000 characters
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 h-12 rounded-full"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="submit-listing-btn"
              className="flex-1 h-12 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Listing" : "Create Listing"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
