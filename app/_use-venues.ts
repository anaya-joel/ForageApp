import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Venue } from '../data/venues';

type VenueRow = {
  id: string;
  name: string;
  category: string;
  color: string;
  neighborhood: string;
  price_tier: string;
  description: string;
  hours: string;
};

function toVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    color: row.color,
    neighborhood: row.neighborhood,
    priceTier: row.price_tier,
    description: row.description,
    hours: row.hours,
  };
}

async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data as VenueRow[]).map(toVenue);
}

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: fetchVenues,
  });
}
