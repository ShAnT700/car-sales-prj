import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, API } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, X, Bookmark } from "lucide-react";

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

export default function FiltersModal({ open, onClose }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    yearFrom: "",
    yearTo: "",
    mileageFrom: "",
    mileageTo: "",
    priceFrom: "",
    priceTo: "",
    driveType: "",
    zipCode: ""
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") params.set(key, value);
    });
    navigate(`/?${params.toString()}`);
    onClose();
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
        if (value && value !== "all" && value !== "") cleanFilters[key] = value;
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

  const handleClear = () => {
    setFilters({
      make: "",
      model: "",
      yearFrom: "",
      yearTo: "",
      mileageFrom: "",
      mileageTo: "",
      priceFrom: "",
      priceTo: "",
      driveType: "",
      zipCode: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="filters-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-manrope font-bold">
            Search Vehicles
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Make */}
          <div className="space-y-2">
            <Label>Make</Label>
            <Select 
              value={filters.make} 
              onValueChange={(v) => setFilters({ ...filters, make: v, model: "all" })}
            >
              <SelectTrigger data-testid="filter-make" className="h-12 bg-slate-50">
                <SelectValue placeholder="Any Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Make</SelectItem>
                {CAR_MAKES.map((make) => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select 
              value={filters.model} 
              onValueChange={(v) => setFilters({ ...filters, model: v })}
              disabled={!filters.make || filters.make === "all"}
            >
              <SelectTrigger data-testid="filter-model" className="h-12 bg-slate-50">
                <SelectValue placeholder="Any Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Model</SelectItem>
                {filters.make && filters.make !== "all" && CAR_MODELS[filters.make]?.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <Label>Year From</Label>
            <Select 
              value={filters.yearFrom} 
              onValueChange={(v) => setFilters({ ...filters, yearFrom: v })}
            >
              <SelectTrigger data-testid="filter-year-from" className="h-12 bg-slate-50">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Year To</Label>
            <Select 
              value={filters.yearTo} 
              onValueChange={(v) => setFilters({ ...filters, yearTo: v })}
            >
              <SelectTrigger data-testid="filter-year-to" className="h-12 bg-slate-50">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Price From ($)</Label>
            <Input
              data-testid="filter-price-from"
              type="number"
              placeholder="Min Price"
              value={filters.priceFrom}
              onChange={(e) => setFilters({ ...filters, priceFrom: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Price To ($)</Label>
            <Input
              data-testid="filter-price-to"
              type="number"
              placeholder="Max Price"
              value={filters.priceTo}
              onChange={(e) => setFilters({ ...filters, priceTo: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>

          {/* Mileage Range */}
          <div className="space-y-2">
            <Label>Mileage From</Label>
            <Input
              data-testid="filter-mileage-from"
              type="number"
              placeholder="Min Mileage"
              value={filters.mileageFrom}
              onChange={(e) => setFilters({ ...filters, mileageFrom: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Mileage To</Label>
            <Input
              data-testid="filter-mileage-to"
              type="number"
              placeholder="Max Mileage"
              value={filters.mileageTo}
              onChange={(e) => setFilters({ ...filters, mileageTo: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>

          {/* Drive Type */}
          <div className="space-y-2">
            <Label>Drive Type</Label>
            <Select 
              value={filters.driveType} 
              onValueChange={(v) => setFilters({ ...filters, driveType: v })}
            >
              <SelectTrigger data-testid="filter-drive-type" className="h-12 bg-slate-50">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {DRIVE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zip Code */}
          <div className="space-y-2">
            <Label>Zip Code</Label>
            <Input
              data-testid="filter-zip"
              placeholder="Enter Zip Code"
              value={filters.zipCode}
              onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
              className="h-12 bg-slate-50"
            />
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && user && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
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
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSaveDialog(false)}
                className="h-10"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            data-testid="filter-clear-btn"
            onClick={handleClear}
            className="h-12 px-4 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {user && !showSaveDialog && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              className="h-12 px-4 rounded-full"
              title="Save this search"
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            type="button"
            data-testid="filter-search-btn"
            onClick={handleSearch}
            className="flex-1 h-12 rounded-full bg-slate-900 text-white hover:bg-slate-800"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
