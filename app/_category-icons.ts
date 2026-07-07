import type { ComponentType } from 'react';
import { Coffee, Leaf, MapPin, Moon, Palette, ShoppingBag, Utensils, Star } from 'lucide-react-native';

export function getCatIcon(category: string): ComponentType<{ size: number; color: string }> {
  if (category.includes('EAT') || category.includes('DRINK')) return Utensils;
  if (category.includes('COFFEE'))                            return Coffee;
  if (category.includes('ARTS') || category.includes('CULTURE')) return Palette;
  if (category.includes('OUTDOORS'))                          return Leaf;
  if (category.includes('NIGHTLIFE'))                         return Moon;
  if (category.includes('MARKET'))                            return ShoppingBag;
  if (category.includes('EXPERIENCES'))                       return Star;
  return MapPin;
}
