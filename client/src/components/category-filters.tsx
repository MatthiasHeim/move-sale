import { Button } from "@/components/ui/button";

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { value: "all", label: "Alle" },
  { value: "furniture", label: "Möbel" },
  { value: "equipment", label: "Geräte" },
  { value: "decor", label: "Deko" },
];

export default function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="category-filters">
          {categories.map(category => (
            <Button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              variant={selectedCategory === category.value ? "default" : "secondary"}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[44px] ${
                selectedCategory === category.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary/20"
              }`}
              data-testid={`category-filter-${category.value}`}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
