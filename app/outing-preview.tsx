/**
 * FORAGE — OutingPreviewScreen (Full Details + Edit Your Plan)
 * app/outing-preview.tsx
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useFocusEffect, useRouter } from 'expo-router';
import { setCurrentOutingName, setCurrentOutingVariant, getCurrentOutingVariant } from './_outing-store';
import {
  Bus,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Footprints,
  GripVertical,
  Heart,
  Leaf,
  MapPin,
  Moon,
  Palette,
  Pencil,
  Utensils,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { consumePendingSwap } from './_swap-store';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  bg:          '#F3EDE4',
  card:        '#FFFFFF',
  amber:       '#B86820',
  amberTint:   '#FEF4E8',
  amberBorder: '#DDB878',
  fabTop:      '#D4891F',
  fabBottom:   '#7A3F08',
  textPrimary: '#2A2420',
  textSec:     '#6B6460',
  textTert:    '#9A8E88',
  border:      '#EDE8E2',
  divider:     '#F5F0EA',
  eat:         '#B84E38',
  coffee:      '#6B4530',
  outdoors:    '#3A6445',
  arts:        '#5C4080',
  nightlife:   '#2A1F4E',
  markets:     '#A0622A',
  experiences: '#2A7080',
};

const F = {
  serif: 'LibreBaskerville_700Bold',
  reg:   'PlusJakartaSans_400Regular',
  med:   'PlusJakartaSans_500Medium',
  semi:  'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

type TransportMode = 'walk' | 'drive' | 'transit';

type Stop = {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  neighborhood: string;
  priceTier: string;
  connector?: { mode: TransportMode; time: string };
};

type CuratedPlace = {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  neighborhood: string;
  priceTier: string;
};

// ─────────────────────────────────────────
//  SAMPLE DATA
// ─────────────────────────────────────────

const INITIAL_STOPS: Stop[] = [
  {
    id: '1',
    name: 'Compass Coffee',
    category: 'COFFEE & CAFÉS',
    color: C.coffee,
    neighborhood: 'Shaw',
    priceTier: '$',
    description:
      'A Shaw neighborhood staple known for its single-origin pour-overs and cozy brick interior with exposed beams.',
    connector: { mode: 'walk', time: '8 min walk' },
  },
  {
    id: '2',
    name: 'Hirshhorn Museum',
    category: 'ARTS & CULTURE',
    color: C.arts,
    neighborhood: 'National Mall',
    priceTier: 'Free',
    description:
      "DC's modern and contemporary art museum set inside a striking cylindrical building on the National Mall.",
    connector: { mode: 'walk', time: '14 min walk' },
  },
  {
    id: '3',
    name: 'National Mall',
    category: 'OUTDOORS',
    color: C.outdoors,
    neighborhood: 'Downtown',
    priceTier: 'Free',
    description:
      'Stroll the iconic 2-mile greenway flanked by world-class museums and memorials. Best midday light here.',
    connector: { mode: 'walk', time: '20 min walk' },
  },
  {
    id: '4',
    name: 'The Dabney',
    category: 'EAT & DRINK',
    color: C.eat,
    neighborhood: 'Shaw',
    priceTier: '$$$',
    description:
      "A James Beard–nominated restaurant celebrating the Mid-Atlantic's finest ingredients over a wood-burning hearth.",
  },
];

const ALTERNATE_STOPS: Stop[] = [
  {
    id: 'a1',
    name: 'Bluestone Lane',
    category: 'COFFEE & CAFÉS',
    color: C.coffee,
    neighborhood: 'Logan Circle',
    priceTier: '$$',
    description:
      'Australian-style café known for specialty espresso drinks and all-day avocado toast in a light-filled space.',
    connector: { mode: 'walk', time: '6 min walk' },
  },
  {
    id: 'a2',
    name: 'National Portrait Gallery',
    category: 'ARTS & CULTURE',
    color: C.arts,
    neighborhood: 'Penn Quarter',
    priceTier: 'Free',
    description:
      'Presidential portraits and bold contemporary commissions inside a stunning neoclassical palace.',
    connector: { mode: 'transit', time: '18 min ride' },
  },
  {
    id: 'a3',
    name: 'Eastern Market',
    category: 'MARKETS',
    color: C.markets,
    neighborhood: 'Capitol Hill',
    priceTier: '$',
    description:
      "Capitol Hill's historic market with weekend vendors, local produce, and handcrafted goods since 1873.",
    connector: { mode: 'walk', time: '10 min walk' },
  },
  {
    id: 'a4',
    name: 'Cranes',
    category: 'EAT & DRINK',
    color: C.eat,
    neighborhood: 'Penn Quarter',
    priceTier: '$$$',
    description:
      'Japanese-Spanish kaiseki cuisine in a serene Penn Quarter setting — best seats at the omakase counter.',
  },
];

export const CURATED_PLACES: CuratedPlace[] = [
  { id: 'c1',  name: 'Bluestone Lane',            category: 'COFFEE & CAFÉS', color: C.coffee,    neighborhood: 'Logan Circle',     priceTier: '$$',   description: 'Australian-style café with specialty espresso drinks and all-day avocado toast.' },
  { id: 'c2',  name: 'Baked & Wired',             category: 'COFFEE & CAFÉS', color: C.coffee,    neighborhood: 'Georgetown',       priceTier: '$',    description: "Georgetown's beloved bakery-café famous for cupcakes and great pour-overs." },
  { id: 'c3',  name: 'Slipstream Coffee',          category: 'COFFEE & CAFÉS', color: C.coffee,    neighborhood: 'Columbia Heights', priceTier: '$',    description: 'Columbia Heights café with excellent filter coffee and a relaxed neighborhood vibe.' },
  { id: 'c4',  name: 'National Portrait Gallery',  category: 'ARTS & CULTURE', color: C.arts,      neighborhood: 'Penn Quarter',     priceTier: 'Free', description: 'Presidential portraits and bold contemporary commissions in a stunning neoclassical palace.' },
  { id: 'c5',  name: 'Smithsonian American Art',   category: 'ARTS & CULTURE', color: C.arts,      neighborhood: 'Penn Quarter',     priceTier: 'Free', description: "The nation's oldest federal art collection, with folk art, photography, and modern works." },
  { id: 'c6',  name: 'Meridian Hill Park',         category: 'OUTDOORS',       color: C.outdoors,  neighborhood: 'Columbia Heights', priceTier: 'Free', description: 'A cascading fountain park perched above Columbia Heights with skyline views.' },
  { id: 'c7',  name: 'Rock Creek Park',            category: 'OUTDOORS',       color: C.outdoors,  neighborhood: 'Northwest DC',     priceTier: 'Free', description: '1,700 acres of urban forest with trails, a planetarium, and creek-side picnic spots.' },
  { id: 'c8',  name: 'Gravelly Point Park',        category: 'OUTDOORS',       color: C.outdoors,  neighborhood: 'Arlington',        priceTier: 'Free', description: 'Watch planes land 200 feet overhead from a grassy riverside lawn along the Potomac.' },
  { id: 'c9',  name: 'Cranes',                     category: 'EAT & DRINK',    color: C.eat,       neighborhood: 'Penn Quarter',     priceTier: '$$$',  description: 'Japanese-Spanish kaiseki cuisine in a serene Penn Quarter setting.' },
  { id: 'c10', name: 'The Roost',                  category: 'EAT & DRINK',    color: C.eat,       neighborhood: 'Capitol Hill',     priceTier: '$$',   description: 'A rotating food hall with DC-born vendors across breakfast, lunch, and dinner.' },
  { id: 'c11', name: 'Eastern Market',             category: 'MARKETS',        color: C.markets,   neighborhood: 'Capitol Hill',     priceTier: '$',    description: "Capitol Hill's historic public market with local produce, art, and food vendors." },
  { id: 'c12', name: 'Flash Nightclub',            category: 'NIGHTLIFE',      color: C.nightlife, neighborhood: 'Penn Quarter',     priceTier: '$$',   description: "DC's premier underground electronic music venue with world-class DJs." },
];

const INITIAL_OUTING_NAME   = 'DC Art & Coffee Loop';
const ALTERNATE_OUTING_NAME = 'Capitol Hill Culture Day';

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────

export function getCatIcon(category: string): React.ComponentType<{ size: number; color: string }> {
  if (category.includes('EAT') || category.includes('DRINK')) return Utensils;
  if (category.includes('COFFEE'))                             return Coffee;
  if (category.includes('ARTS') || category.includes('CULTURE')) return Palette;
  if (category.includes('OUTDOORS'))                           return Leaf;
  if (category.includes('NIGHTLIFE'))                          return Moon;
  return MapPin;
}

function getTransportIcon(mode: TransportMode): React.ComponentType<{ size: number; color: string }> {
  if (mode === 'drive')   return Car;
  if (mode === 'transit') return Bus;
  return Footprints;
}

function estimatedHrs(stops: Stop[]) {
  return Math.max(1, Math.round(stops.length * 0.75));
}

const TIER_ORDER = ['Free', '$', '$$', '$$$'];

function tierRange(stops: Stop[]): string {
  const paid = stops.map((s) => s.priceTier).filter((t) => t !== 'Free');
  if (paid.length === 0) return 'Free';
  const sorted = [...paid].sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return min === max ? min : `${min}–${max}`;
}

function getScoutCopy(stops: Stop[]): string {
  const cats        = stops.map((s) => s.category);
  const hasCoffee   = cats.some((c) => c.includes('COFFEE'));
  const hasArts     = cats.some((c) => c.includes('ARTS'));
  const hasEat      = cats.some((c) => c.includes('EAT'));
  const hasOutdoors = cats.some((c) => c.includes('OUTDOORS'));

  if (hasCoffee && hasArts && hasEat && hasOutdoors)
    return "Coffee, culture, open air, and a proper meal.";
  if (hasCoffee && hasArts && hasEat)
    return "Coffee first, something worth seeing, then somewhere worth the splurge.";
  if (hasCoffee && hasArts)
    return "Caffeine first, then the kind of art that stays with you.";
  if (hasOutdoors && hasEat)
    return "Outside first, then somewhere worth the meal.";
  if (hasCoffee && hasOutdoors)
    return "Coffee and open air — a route for when you want the city without the noise.";
  return "A well-rounded route, assembled stop by stop.";
}

// ─────────────────────────────────────────
//  DIRTY BACK SHEET
// ─────────────────────────────────────────

function DirtyBackSheet({
  visible,
  onContinue,
  onSaveDraft,
  onDiscard,
}: {
  visible: boolean;
  onContinue: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onContinue}>
      <Pressable style={styles.sheetBackdrop} onPress={onContinue}>
        <Pressable
          style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Leaving already? Your plan's still open.</Text>
          <View style={styles.sheetDivider} />

          <Pressable style={styles.sheetOption} onPress={onContinue}>
            <Text style={styles.sheetOptionText}>Continue editing</Text>
          </Pressable>
          <View style={styles.sheetOptionDivider} />

          <Pressable style={styles.sheetOption} onPress={onSaveDraft}>
            <Text style={styles.sheetOptionText}>Save as draft</Text>
          </Pressable>
          <View style={styles.sheetOptionDivider} />

          <Pressable style={styles.sheetOption} onPress={onDiscard}>
            <Text style={[styles.sheetOptionText, styles.sheetOptionDestructive]}>Discard changes</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────
//  DRAFT CAP MODAL
// ─────────────────────────────────────────

const DRAFT_CAP = 5;

function DraftCapModal({
  visible,
  onViewDrafts,
  onDismiss,
}: {
  visible: boolean;
  onViewDrafts: () => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.sheetBackdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Draft limit reached</Text>
          <Text style={styles.sheetSubtitle}>
            You have 5 saved drafts — delete one to make room for this plan.
          </Text>
          <View style={styles.sheetDivider} />

          <Pressable style={styles.sheetOption} onPress={onViewDrafts}>
            <Text style={styles.sheetOptionText}>View drafts</Text>
          </Pressable>
          <View style={styles.sheetOptionDivider} />

          <Pressable style={styles.sheetOption} onPress={onDismiss}>
            <Text style={styles.sheetOptionText}>OK</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────
//  ADD STOP SHEET
// ─────────────────────────────────────────

function AddStopSheet({
  visible,
  onClose,
  onSelectForDetail,
  currentStops,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectForDetail: (place: CuratedPlace) => void;
  currentStops: Stop[];
}) {
  const insets = useSafeAreaInsets();

  // Categories already present in the current outing
  const currentCategories = new Set(currentStops.map((s) => s.category));

  // Group all curated places by category (preserving CURATED_PLACES order)
  const groups = new Map<string, CuratedPlace[]>();
  for (const place of CURATED_PLACES) {
    if (!groups.has(place.category)) groups.set(place.category, []);
    groups.get(place.category)!.push(place);
  }

  // Sort: categories already in the outing appear first ("Suggested"), then the rest
  const allCats = [...groups.keys()];
  const orderedSections = [
    ...allCats.filter((c) => currentCategories.has(c)).map((c) => ({ category: c, places: groups.get(c)!, suggested: true })),
    ...allCats.filter((c) => !currentCategories.has(c)).map((c) => ({ category: c, places: groups.get(c)!, suggested: false })),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.addSheetContainer, { paddingBottom: insets.bottom + 12 }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.addSheetTitle}>Add a stop</Text>
          <Text style={styles.addSheetSubtitle}>Choose from curated places</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.addSheetScroll}>
            {orderedSections.map((section) => (
              <View key={section.category}>
                {/* Section header */}
                <View style={styles.addSectionHeader}>
                  <Text style={styles.addSectionHeaderText}>{section.category}</Text>
                  {section.suggested && (
                    <View style={styles.suggestedBadge}>
                      <Text style={styles.suggestedBadgeText}>Suggested</Text>
                    </View>
                  )}
                </View>
                {/* Place rows — tap opens detail */}
                {section.places.map((place) => {
                  const PlaceIcon = getCatIcon(place.category);
                  return (
                    <Pressable
                      key={place.id}
                      style={styles.addSheetRow}
                      onPress={() => onSelectForDetail(place)}
                    >
                      <View style={[styles.addSheetThumb, { backgroundColor: place.color + '22' }]}>
                        <PlaceIcon size={20} color={place.color} />
                      </View>
                      <View style={styles.addSheetRowText}>
                        <Text style={styles.addSheetPlaceName}>{place.name}</Text>
                        <Text style={styles.addSheetPlaceMeta}>
                          {place.neighborhood} · {place.priceTier}
                        </Text>
                      </View>
                      <ChevronRight size={14} color={C.textTert} />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────
//  CONNECTOR STRIP
// ─────────────────────────────────────────

function ConnectorStrip({ connector }: { connector: { mode: TransportMode; time: string } }) {
  const TransIcon = getTransportIcon(connector.mode);
  return (
    <View style={styles.connectorStrip}>
      <TransIcon size={13} color={C.textTert} />
      <Text style={styles.connectorText}>{connector.time}</Text>
    </View>
  );
}

// ─────────────────────────────────────────
//  STOP CARD
// ─────────────────────────────────────────

function StopCard({
  stop,
  editMode,
  onSwap,
  onRemove,
  onPress,
}: {
  stop: Stop;
  editMode: boolean;
  onSwap: () => void;
  onRemove: () => void;
  onPress?: () => void;
}) {
  const CatIcon = getCatIcon(stop.category);
  return (
    <Pressable
      style={styles.stopCard}
      onPress={onPress}
    >
      {/* Photo area */}
      <View style={[styles.stopPhoto, { backgroundColor: stop.color + '22' }]}>
        <View style={styles.stopPhotoPlaceholder}>
          <CatIcon size={64} color={stop.color} />
        </View>
        <View style={[styles.stopCatPill, { backgroundColor: stop.color }]}>
          <Text style={styles.stopCatText}>{stop.category}</Text>
        </View>
      </View>

      {/* Info area */}
      <View style={styles.stopInfo}>
        <View style={styles.stopNameRow}>
          <Text style={styles.stopName}>{stop.name}</Text>
          {editMode && (
            <View style={styles.dragHandleWrap}>
              <GripVertical size={18} color={C.textTert} />
            </View>
          )}
        </View>

        <Text style={styles.stopDescription} numberOfLines={3}>
          {stop.description}
        </Text>

        {editMode && (
          <View style={styles.stopEditActions}>
            <Pressable onPress={onSwap} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.stopEditAction}>Swap</Text>
            </Pressable>
            <Pressable onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.stopEditAction}>Remove</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  ADD A STOP CARD
// ─────────────────────────────────────────

function AddStopCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.addStopCard} onPress={onPress}>
      <Text style={styles.addStopText}>+ Add a stop</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  REGENERATING STATE
// ─────────────────────────────────────────

function RegeneratingState() {
  return (
    <View style={styles.regenState}>
      <Text style={styles.regenText}>
        Working on it. I've been everywhere in this city — mostly after dark.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────
//  PLACE DETAIL MODAL
// ─────────────────────────────────────────

function PlaceDetailModal({
  stop,
  isSaved,
  onSave,
  onClose,
  onAddStop,
}: {
  stop: Stop | null;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
  onAddStop?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [photoIdx, setPhotoIdx] = useState(0);
  const PHOTO_COUNT = 3;

  useEffect(() => {
    if (stop) setPhotoIdx(0);
  }, [stop?.id]);

  const CatIcon = stop ? getCatIcon(stop.category) : null;

  return (
    <Modal visible={!!stop} animationType="slide" transparent={false} onRequestClose={onClose}>
      {stop && CatIcon && (
        <View style={[styles.detailScreen, { backgroundColor: C.bg }]}>
          <StatusBar barStyle="light-content" />

          {/* Swipeable photo area */}
          <View style={styles.detailPhotoWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / width));
              }}
              style={{ height: 280 }}
            >
              {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.detailPhotoSlide,
                    {
                      width,
                      backgroundColor:
                        stop.color + (i === 0 ? '33' : i === 1 ? '22' : '18'),
                    },
                  ]}
                >
                  <View style={styles.detailPhotoIcon}>
                    <CatIcon size={80} color={stop.color} />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Category pill — bottom left of photo */}
            <View style={[styles.detailCatPill, { backgroundColor: stop.color }]}>
              <Text style={styles.stopCatText}>{stop.category}</Text>
            </View>

            {/* Close / back — top left */}
            <Pressable
              style={[styles.detailCloseBtn, { top: insets.top + 12 }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={18} color="#FFFFFF" />
            </Pressable>

            {/* Heart / save — top right, 30px circle, 44×44pt hitSlop */}
            <Pressable
              style={[styles.detailHeartBtn, { top: insets.top + 12 }]}
              onPress={onSave}
              hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
            >
              <Heart
                size={13}
                color={isSaved ? C.eat : C.textTert}
                fill={isSaved ? C.eat : 'none'}
              />
            </Pressable>

            {/* Pager dots */}
            <View style={styles.detailPagerDots}>
              {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.detailPagerDot,
                    i === photoIdx && styles.detailPagerDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Info */}
          <View style={styles.detailInfo}>
            <Text style={styles.detailName}>{stop.name}</Text>
            <View style={styles.detailMetaRow}>
              <MapPin size={12} color={C.textTert} />
              <Text style={styles.detailNeighborhood}>{stop.neighborhood}</Text>
              <Text style={styles.detailSep}>·</Text>
              <Text style={styles.detailPrice}>{stop.priceTier}</Text>
            </View>
            <Text style={styles.detailDescription}>{stop.description}</Text>
          </View>

          {/* Add stop button — only present in the add-stop flow */}
          {onAddStop && (
            <View style={[styles.addStopBtnArea, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable style={styles.addStopBtn} onPress={onAddStop}>
                <Text style={styles.addStopBtnText}>Add stop</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────

export default function OutingPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [outingName, setOutingName]         = useState(() => getCurrentOutingVariant() === 'alternate' ? ALTERNATE_OUTING_NAME : INITIAL_OUTING_NAME);
  const [isEditingName, setIsEditingName]   = useState(false);
  const [editMode, setEditMode]             = useState(false);
  const [isDirty, setIsDirty]               = useState(false);
  const [stops, setStops]                   = useState<Stop[]>(() => getCurrentOutingVariant() === 'alternate' ? ALTERNATE_STOPS : INITIAL_STOPS);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDirtySheet, setShowDirtySheet] = useState(false);
  const [showAddSheet, setShowAddSheet]     = useState(false);
  const [savedPlaceIds, setSavedPlaceIds]   = useState<Set<string>>(new Set());
  const [detailStop, setDetailStop]         = useState<Stop | null>(null);
  const [addDetailPlace, setAddDetailPlace] = useState<CuratedPlace | null>(null);
  const [draftCount, setDraftCount]         = useState(0);
  const [showDraftCapModal, setShowDraftCapModal] = useState(false);

  const originalStopsRef = useRef<Stop[]>(getCurrentOutingVariant() === 'alternate' ? ALTERNATE_STOPS : INITIAL_STOPS);
  const originalNameRef  = useRef<string>(getCurrentOutingVariant() === 'alternate' ? ALTERNATE_OUTING_NAME : INITIAL_OUTING_NAME);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingSwap();
      if (!pending) return;
      setStops((s) =>
        s.map((stop) =>
          stop.id === pending.stopId
            ? {
                ...stop,
                id:           pending.place.id,
                name:         pending.place.name,
                category:     pending.place.category,
                color:        pending.place.color,
                description:  pending.place.description,
                neighborhood: pending.place.neighborhood,
                priceTier:    pending.place.priceTier,
              }
            : stop
        )
      );
      setIsDirty(true);
    }, [])
  );

  if (!fontsLoaded && !fontError) return null;

  // ── Handlers ──

  function handleBack() {
    if (editMode) {
      if (isDirty) {
        setShowDirtySheet(true);
      } else {
        setEditMode(false); // clean exit — return to Full Details
      }
    } else {
      router.back();
    }
  }

  function handleResetToScout() {
    setStops(originalStopsRef.current);
    setIsDirty(false);
  }

  function handleSaveDraft() {
    setShowDirtySheet(false);
    if (draftCount >= DRAFT_CAP) {
      setShowDraftCapModal(true);
    } else {
      setDraftCount((c) => c + 1);
      router.back();
    }
  }

  function handleDiscard() {
    setStops(originalStopsRef.current);
    setOutingName(originalNameRef.current);
    setIsDirty(false);
    setEditMode(false);
    setShowDirtySheet(false);
  }

  function handleGenerate() {
    setIsRegenerating(true);
    const isCurrentlyInitial = stops[0]?.id === INITIAL_STOPS[0]?.id;
    const next        = isCurrentlyInitial ? ALTERNATE_STOPS : INITIAL_STOPS;
    const nextName    = isCurrentlyInitial ? ALTERNATE_OUTING_NAME : INITIAL_OUTING_NAME;
    const nextVariant = isCurrentlyInitial ? 'alternate' : 'initial';
    setTimeout(() => {
      setStops(next);
      setOutingName(nextName);
      originalStopsRef.current = next;
      originalNameRef.current  = nextName;
      setCurrentOutingName(nextName);
      setCurrentOutingVariant(nextVariant);
      setIsDirty(false);
      setIsRegenerating(false);
      setEditMode(false); // discard any in-progress edits, return to Full Details
    }, 1800);
  }

  function handleRemoveStop(id: string) {
    setStops((s) => s.filter((stop) => stop.id !== id));
    setIsDirty(true);
  }

  function handleOpenSwap(stop: Stop, index: number) {
    const prevConnector = index > 0 ? stops[index - 1].connector : undefined;
    const travelHint = prevConnector?.time ?? stop.connector?.time ?? '10 min walk';
    router.push({
      pathname: '/swap-stop',
      params: {
        stopId:     stop.id,
        stopName:   stop.name,
        category:   stop.category,
        travelHint,
      },
    });
  }

  function handleAddPlace(place: CuratedPlace) {
    const newStop: Stop = {
      id:           place.id,
      name:         place.name,
      category:     place.category,
      color:        place.color,
      description:  place.description,
      neighborhood: place.neighborhood,
      priceTier:    place.priceTier,
      connector:    { mode: 'walk', time: '10 min walk' },
    };
    setStops((s) => {
      const updated = [...s];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          connector: { mode: 'walk', time: '10 min walk' },
        };
      }
      return [...updated, { ...newStop, connector: undefined }];
    });
    setIsDirty(true);
  }

  function handleSelectForDetail(place: CuratedPlace) {
    setAddDetailPlace(place);
    setShowAddSheet(false);
  }

  function handleBegin() {
    router.back();
  }

  function handleToggleSave(id: string) {
    setSavedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hrs   = estimatedHrs(stops);
  const tiers = tierRange(stops);
  const copy  = getScoutCopy(stops);

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── FIXED HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={C.textPrimary} />
          </Pressable>

          <View style={styles.headerContent}>
            {editMode ? (
              <>
                <Text style={styles.editModeTitle}>Edit your plan</Text>
                <Text style={styles.editModeSubheader}>Reorder, swap, or add stops.</Text>
              </>
            ) : isEditingName ? (
              <>
                <TextInput
                  style={styles.outingNameInput}
                  value={outingName}
                  onChangeText={setOutingName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => setIsEditingName(false)}
                  onBlur={() => setIsEditingName(false)}
                  selectTextOnFocus
                />
                <View style={styles.pillsRow}>
                  <View style={styles.pill}><Text style={styles.pillText}>{stops.length} stops</Text></View>
                  <View style={styles.pill}><Text style={styles.pillText}>~{hrs} hrs</Text></View>
                  <View style={styles.pill}><Text style={styles.pillText}>{tiers}</Text></View>
                </View>
                <Text style={styles.headerCaption}>{copy}</Text>
              </>
            ) : (
              <>
                <View style={styles.namePencilRow}>
                  <Text style={styles.outingName} numberOfLines={1} ellipsizeMode="tail">{outingName}</Text>
                  <Pressable
                    onPress={() => setIsEditingName(true)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Pencil size={14} color={C.textTert} />
                  </Pressable>
                </View>
                <View style={styles.pillsRow}>
                  <View style={styles.pill}><Text style={styles.pillText}>{stops.length} stops</Text></View>
                  <View style={styles.pill}><Text style={styles.pillText}>~{hrs} hrs</Text></View>
                  <View style={styles.pill}><Text style={styles.pillText}>{tiers}</Text></View>
                </View>
                <Text style={styles.headerCaption}>{copy}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE STOP LIST ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isRegenerating ? (
          <RegeneratingState />
        ) : (
          <>
            {stops.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <StopCard
                  stop={stop}
                  editMode={editMode}
                  onSwap={() => handleOpenSwap(stop, index)}
                  onRemove={() => handleRemoveStop(stop.id)}
                  onPress={() => setDetailStop(stop)}
                />
                {index < stops.length - 1 && stop.connector && (
                  <ConnectorStrip connector={stop.connector} />
                )}
              </React.Fragment>
            ))}

            {editMode && (
              <AddStopCard onPress={() => setShowAddSheet(true)} />
            )}
          </>
        )}
      </ScrollView>

      {/* ── FIXED BOTTOM CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.beginBtn} onPress={handleBegin}>
          <Text style={styles.beginBtnText}>Begin</Text>
        </Pressable>

        {/* Secondary action pills — below Begin */}
        <View style={styles.ctaSecondaryRow}>
          {!editMode && (
            <Pressable style={styles.actionPill} onPress={() => setEditMode(true)}>
              <Text style={styles.secondaryLink}>Edit</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionPill, isRegenerating && { opacity: 0.5 }]}
            onPress={handleGenerate}
            disabled={isRegenerating}
          >
            <Text style={styles.secondaryLink}>Generate new outing</Text>
          </Pressable>
          {editMode && isDirty && (
            <Pressable style={styles.actionPillQuiet} onPress={handleResetToScout}>
              <Text style={styles.secondaryLinkQuiet}>Reset to Scout's plan</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── DIRTY BACK SHEET ── */}
      <DirtyBackSheet
        visible={showDirtySheet}
        onContinue={() => setShowDirtySheet(false)}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
      />

      {/* ── DRAFT CAP MODAL ── */}
      <DraftCapModal
        visible={showDraftCapModal}
        onViewDrafts={() => { setShowDraftCapModal(false); router.back(); }}
        onDismiss={() => setShowDraftCapModal(false)}
      />

      {/* ── ADD STOP SHEET ── */}
      <AddStopSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSelectForDetail={handleSelectForDetail}
        currentStops={stops}
      />

      {/* ── PLACE DETAIL MODAL (existing stop tap) ── */}
      <PlaceDetailModal
        stop={detailStop}
        isSaved={detailStop ? savedPlaceIds.has(detailStop.id) : false}
        onSave={() => detailStop && handleToggleSave(detailStop.id)}
        onClose={() => setDetailStop(null)}
      />

      {/* ── PLACE DETAIL MODAL (add-stop flow) ── */}
      <PlaceDetailModal
        stop={addDetailPlace as Stop | null}
        isSaved={addDetailPlace ? savedPlaceIds.has(addDetailPlace.id) : false}
        onSave={() => addDetailPlace && handleToggleSave(addDetailPlace.id)}
        onClose={() => setAddDetailPlace(null)}
        onAddStop={addDetailPlace ? () => { handleAddPlace(addDetailPlace); setAddDetailPlace(null); } : undefined}
      />
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // ── Header ──
  header: {
    backgroundColor: C.bg,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    paddingTop: 4,
  },
  namePencilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outingName: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    flexShrink: 1,
  },
  outingNameInput: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.amber,
    marginBottom: 0,
  },

  // Pills row (stop count / duration / price)
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    backgroundColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: F.med,
    fontSize: 12,
    color: C.textSec,
  },

  // Caption line inside header
  headerCaption: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 20,
    marginTop: 8,
  },

  editModeTitle: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
  },
  editModeSubheader: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    marginTop: 4,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  // ── Stop card ──
  stopCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 0,
  },
  stopPhoto: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopPhotoPlaceholder: {
    opacity: 0.35,
  },
  stopCatPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stopCatText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stopInfo: {
    padding: 12,
  },
  stopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stopName: {
    fontFamily: F.serif,
    fontSize: 19,
    color: C.textPrimary,
    flex: 1,
  },
  dragHandleWrap: {
    flexShrink: 0,
    marginLeft: 8,
  },
  stopDescription: {
    fontFamily: F.reg,
    fontSize: 14,
    color: C.textSec,
    lineHeight: 20,
  },
  stopEditActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  stopEditAction: {
    fontFamily: F.semi,
    fontSize: 11,
    color: C.amber,
  },

  // ── Connector strip ──
  connectorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  connectorText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
  },

  // ── Add a stop card ──
  addStopCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopText: {
    fontFamily: F.semi,
    fontSize: 13,
    color: C.amber,
  },

  // ── Regenerating state ──
  regenState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  regenText: {
    fontFamily: F.med,
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    lineHeight: 21,
  },

  // ── Bottom CTA ──
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  beginBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.fabTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Secondary action pills inside bottomCTA (below Begin)
  ctaSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  actionPill: {
    borderWidth: 1,
    borderColor: C.amberBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  actionPillQuiet: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  secondaryLink: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.amber,
  },
  secondaryLinkQuiet: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textTert,
  },

  // ── Dirty back sheet ──
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: F.serif,
    fontSize: 18,
    color: C.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 19,
    marginBottom: 16,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginBottom: 8,
  },
  sheetOption: {
    paddingVertical: 16,
  },
  sheetOptionText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: C.textPrimary,
  },
  sheetOptionDestructive: {
    color: C.eat,
  },
  sheetOptionDivider: {
    height: 1,
    backgroundColor: C.divider,
  },

  // ── Add stop sheet ──
  addSheetContainer: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  addSheetTitle: {
    fontFamily: F.serif,
    fontSize: 20,
    color: C.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  addSheetSubtitle: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  addSheetScroll: {
    paddingHorizontal: 20,
  },
  addSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  addSheetThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addSheetRowText: {
    flex: 1,
  },
  addSheetPlaceName: {
    fontFamily: F.semi,
    fontSize: 14,
    color: C.textPrimary,
    marginBottom: 2,
  },
  addSheetPlaceMeta: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },

  // ── Place Detail Modal ──
  detailScreen: {
    flex: 1,
  },
  detailPhotoWrap: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  detailPhotoSlide: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPhotoIcon: {
    opacity: 0.25,
  },
  detailCatPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailCloseBtn: {
    position: 'absolute',
    left: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeartBtn: {
    position: 'absolute',
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPagerDots: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  detailPagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  detailPagerDotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  detailInfo: {
    paddingHorizontal: 18,
    paddingTop: 20,
    flex: 1,
  },
  detailName: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  detailNeighborhood: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
  },
  detailSep: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textTert,
  },
  detailPrice: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
  },
  detailDescription: {
    fontFamily: F.reg,
    fontSize: 15,
    color: C.textSec,
    lineHeight: 23,
  },

  // ── Add stop sheet — section headers ──
  addSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 6,
  },
  addSectionHeaderText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.textTert,
    letterSpacing: 0.8,
  },
  suggestedBadge: {
    backgroundColor: C.amberTint,
    borderWidth: 1,
    borderColor: C.amberBorder,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  suggestedBadgeText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.amber,
    letterSpacing: 0.4,
  },

  // ── Add stop button (in PlaceDetailModal) ──
  addStopBtnArea: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  addStopBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.fabTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
