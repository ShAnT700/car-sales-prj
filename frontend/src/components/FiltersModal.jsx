import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, X } from "lucide-react";

const CAR_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
  "Ferrari", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep",
  "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Maserati", "Mazda",
  "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru",
  "Tesla", "Toyota", "Volkswagen", "Volvo"
];

const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];

const YEARS = Array.from({ length: 35 }, (_, i) => 2025 - i);

export default function FiltersModal({ open, onClose }) {
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

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
    });
    navigate(`/?${params.toString()}`);
    onClose();
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
              onValueChange={(v) => setFilters({ ...filters, make: v, model: "" })}
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
            <Input
              data-testid="filter-model"
              placeholder="Any Model"
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              className="h-12 bg-slate-50"
            />
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

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            data-testid="filter-clear-btn"
            onClick={handleClear}
            className="flex-1 h-12 rounded-full"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
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
