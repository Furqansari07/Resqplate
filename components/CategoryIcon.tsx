import {
  Soup,
  Croissant,
  Apple,
  ShoppingBasket,
  Milk,
  Package,
  UtensilsCrossed,
} from 'lucide-react';

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Cooked Meals': Soup,
  'Bakery Items': Croissant,
  'Fruits and Vegetables': Apple,
  Groceries: ShoppingBasket,
  'Dairy Products': Milk,
  'Packaged Food': Package,
  Beverages: Package,
  Other: UtensilsCrossed,
};

export default function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = categoryIconMap[category] || UtensilsCrossed;
  return <Icon className={className} />;
}