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
    if (filters.model) params.set("model", filters.model);
    if (filters.zipCode) params.set("zipCode", filters.zipCode);
    if (filters.distance && filters.distance !== "any") params.set("distance", filters.distance);
    navigate(`/?${params.toString()}`);
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
          onValueChange={(v) => setFilters({ ...filters, make: v })}
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
        <Input
          data-testid="quick-model"
          placeholder="Model"
          value={filters.model}
          onChange={(e) => setFilters({ ...filters, model: e.target.value })}
          className="h-12 bg-slate-50 border-slate-200"
        />

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
