import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, X, Bookmark, ChevronUp } from "lucide-react";

const CAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ferrari", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep",
  "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Maserati", "Mazda",
  "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

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

const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];
const YEARS = Array.from({ length: 35 }, (_, i) => 2025 - i);

const DISTANCES = [
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "250", label: "250 miles" },
  { value: "500", label: "500 miles" },
  { value: "any", label: "Any distance" }
];

// Racing Helmet Icon SVG
const RacingHelmetIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07L12 12l7.07 7.07C20.88 17.26 22 14.76 22 12c0-5.52-4.48-10-10-10zm0 2c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9L12 10.59 5.69 16.9C4.63 15.55 4 13.85 4 12c0-4.41 3.59-8 8-8z"/>
    <path d="M12 6c-3.31 0-6 2.69-6 6 0 1.1.3 2.14.82 3.03L12 9.86l5.18 5.17c.52-.89.82-1.93.82-3.03 0-3.31-2.69-6-6-6z"/>
  </svg>
);

export default function FullSearchPanel({ isOpen, onClose, onSearch }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [startY, setStartY] = useState(0);
  
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    zipCode: "",
    distance: "",
    yearFrom: "",
    yearTo: "",
    mileageFrom: "",
    mileageTo: "",
    priceFrom: "",
    priceTo: "",
    driveType: ""
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [saving, setSaving] = useState(false);

  // Touch handlers for swipe up to close
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    if (diff > 100) {
      onClose();
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "" && value !== "any") {
        params.set(key, value);
      }
    });
    navigate(`/?${params.toString()}`);
    onSearch?.();
    onClose();
  };

  const handleClear = () => {
    setFilters({
      make: "", model: "", zipCode: "", distance: "",
      yearFrom: "", yearTo: "", mileageFrom: "", mileageTo: "",
      priceFrom: "", priceTo: "", driveType: ""
    });
  };

  const handleMakeChange = (make) => {
    setFilters({ ...filters, make, model: "" });
  };

  const saveSearch = async () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }
    
    setSaving(true);
    try {
      const cleanFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "" && value !== "any") {
          cleanFilters[key] = value;
        }
      });
      
      await axios.post(`${API}/saved-searches`, {
        name: searchName.trim(),
        filters: cleanFilters
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Search saved!");
      setShowSaveDialog(false);
      setSearchName("");
    } catch (err) {
      toast.error("Failed to save search");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        data-testid="full-search-panel"
      >
        {/* Hide Filters Button - Always visible */}
        <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-slate-100">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="font-medium">Hide Filters</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <RacingHelmetIcon className="w-8 h-8 text-red-500" />
            <h2 className="font-manrope font-bold text-xl sm:text-2xl text-slate-900">
              Let's find new ride!
            </h2>
          </div>

          {/* Primary Filters - First Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Make */}
            <Select value={filters.make} onValueChange={handleMakeChange}>
              <SelectTrigger data-testid="filter-make" className="h-12 bg-slate-50">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Make</SelectItem>
                {CAR_MAKES.map((make) => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model */}
            <Select 
              value={filters.model} 
              onValueChange={(v) => setFilters({ ...filters, model: v })}
              disabled={!filters.make || filters.make === "all"}
            >
              <SelectTrigger data-testid="filter-model" className="h-12 bg-slate-50">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Model</SelectItem>
                {filters.make && filters.make !== "all" && CAR_MODELS[filters.make]?.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Zip Code */}
            <Input
              data-testid="filter-zip"
              placeholder="Zip Code"
              value={filters.zipCode}
              onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
              className="h-12 bg-slate-50"
            />

            {/* Distance */}
            <Select 
              value={filters.distance} 
              onValueChange={(v) => setFilters({ ...filters, distance: v })}
            >
              <SelectTrigger data-testid="filter-distance" className="h-12 bg-slate-50">
                <SelectValue placeholder="Distance" />
              </SelectTrigger>
              <SelectContent>
                {DISTANCES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Year Range */}
            <Select 
              value={filters.yearFrom} 
              onValueChange={(v) => setFilters({ ...filters, yearFrom: v })}
            >
              <SelectTrigger className="h-12 bg-slate-50">
                <SelectValue placeholder="Year From" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.yearTo} 
              onValueChange={(v) => setFilters({ ...filters, yearTo: v })}
            >
              <SelectTrigger className="h-12 bg-slate-50">
                <SelectValue placeholder="Year To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Input
              type="number"
              placeholder="Min Price ($)"
              value={filters.priceFrom}
              onChange={(e) => setFilters({ ...filters, priceFrom: e.target.value })}
              className="h-12 bg-slate-50"
            />

            <Input
              type="number"
              placeholder="Max Price ($)"
              value={filters.priceTo}
              onChange={(e) => setFilters({ ...filters, priceTo: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* Mileage Range */}
            <Input
              type="number"
              placeholder="Min Mileage"
              value={filters.mileageFrom}
              onChange={(e) => setFilters({ ...filters, mileageFrom: e.target.value })}
              className="h-12 bg-slate-50"
            />

            <Input
              type="number"
              placeholder="Max Mileage"
              value={filters.mileageTo}
              onChange={(e) => setFilters({ ...filters, mileageTo: e.target.value })}
              className="h-12 bg-slate-50"
            />

            {/* Drive Type */}
            <Select 
              value={filters.driveType} 
              onValueChange={(v) => setFilters({ ...filters, driveType: v })}
            >
              <SelectTrigger className="h-12 bg-slate-50">
                <SelectValue placeholder="Drive Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {DRIVE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Search Dialog */}
          {showSaveDialog && user && (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl">
              <Label className="text-sm">Save this search as:</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="e.g. BMW under $50k"
                  className="flex-1 h-10"
                />
                <Button
                  onClick={saveSearch}
                  disabled={saving}
                  className="h-10 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving ? "..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSaveDialog(false)}
                  className="h-10 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="h-12 px-4 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
            
            {user && !showSaveDialog && (
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="h-12 px-4 rounded-full"
                title="Save this search"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={handleSearch}
              className="flex-1 h-12 rounded-full bg-red-500 text-white hover:bg-red-600"
              data-testid="search-btn"
            >
              <Search className="w-4 h-4 mr-2" />
              Show Matches
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
