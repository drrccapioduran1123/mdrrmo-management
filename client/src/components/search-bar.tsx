import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }: SearchBarProps) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 min-w-[280px] focus-within:scale-[1.02] ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        border: "2px solid rgba(121, 101, 193, 0.4)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
      }}
    >
      <Search className="w-5 h-5" style={{ color: "#E3D095" }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-base font-medium"
        style={{ color: "#E3D095" }}
        data-testid="input-search"
      />
    </div>
  );
}
