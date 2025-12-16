import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search } from "lucide-react";

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

const DISTANCES = [
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "250", label: "250 miles" },
  { value: "500", label: "500 miles" },
  { value: "any", label: "Any distance" }
];

export default function QuickSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    zipCode: "",
    distance: ""
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.make && filters.make !== "all") params.set("make", filters.make);
    if (filters.model && filters.model !== "all") params.set("model", filters.model);
    if (filters.zipCode) params.set("zipCode", filters.zipCode);
    if (filters.distance && filters.distance !== "any") params.set("distance", filters.distance);
    navigate(`/?${params.toString()}`);
  };

  const handleMakeChange = (make) => {
    setFilters({ ...filters, make, model: "" });
  };

  return (
    <div 
      data-testid="quick-search"
      className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100"
    >
      <h2 className="font-manrope font-bold text-xl text-slate-900 mb-4">
        Find Your Next Ride
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Make */}
        <Select 
          value={filters.make} 
          onValueChange={handleMakeChange}
        >
          <SelectTrigger data-testid="quick-make" className="h-12 bg-slate-50 border-slate-200">
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
          <SelectTrigger data-testid="quick-model" className="h-12 bg-slate-50 border-slate-200">
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
          data-testid="quick-zip"
          placeholder="Zip Code"
          value={filters.zipCode}
          onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
          className="h-12 bg-slate-50 border-slate-200"
        />

        {/* Distance */}
        <Select 
          value={filters.distance} 
          onValueChange={(v) => setFilters({ ...filters, distance: v })}
        >
          <SelectTrigger data-testid="quick-distance" className="h-12 bg-slate-50 border-slate-200">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent>
            {DISTANCES.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Button */}
        <Button
          data-testid="quick-search-btn"
          onClick={handleSearch}
          className="h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all"
        >
          <Search className="w-4 h-4 mr-2" />
          Show Matches
        </Button>
      </div>
    </div>
  );
}
