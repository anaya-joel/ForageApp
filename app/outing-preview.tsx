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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bus,
  Car,
  ChevronLeft,
  ChevronRight,
  Footprints,
  GripVertical,
  Heart,
  MapPin,
  Pencil,
} from 'lucide-react-native';
import { getCatIcon } from './_category-icons';
import { C } from '../data/colors';
import { VENUES, type Venue } from '../data/venues';
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
import {
  ALTERNATE_PLAN,
  beginOuting,
  getCurrentPlan,
  getDraftById,
  INITIAL_PLAN,
  saveDraftFromCurrent,
  setCurrentPlan,
  type OutingPlan,
  type Stop,
  type TransportMode,
} from './_outing-store';
import { consumePendingSwap } from './_swap-store';

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const F = {
  serif: 'LibreBaskerville_700Bold',
  reg:   'PlusJakartaSans_400Regular',
  med:   'PlusJakartaSans_500Medium',
  semi:  'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────


// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────


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
  onSelectForDetail: (place: Venue) => void;
  currentStops: Stop[];
}) {
  const insets = useSafeAreaInsets();

  // Categories already present in the current outing
  const currentCategories = new Set(currentStops.map((s) => s.category));

  // Group all curated places by category (preserving VENUES order)
  const groups = new Map<string, Venue[]>();
  for (const place of VENUES) {
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
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [plan, setPlan]                     = useState<OutingPlan>(() => {
    if (draftId) {
      const draft = getDraftById(draftId);
      if (!draft) {
        console.warn(`[outing-preview] Draft "${draftId}" not found, falling back to current plan`);
        return getCurrentPlan();
      }
      return draft;
    }
    return getCurrentPlan();
  });
  const [isEditingName, setIsEditingName]   = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editMode, setEditMode]             = useState(false);
  const [isDirty, setIsDirty]               = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDirtySheet, setShowDirtySheet] = useState(false);
  const [showAddSheet, setShowAddSheet]     = useState(false);
  const [savedPlaceIds, setSavedPlaceIds]   = useState<Set<string>>(new Set());
  const [detailStop, setDetailStop]         = useState<Stop | null>(null);
  const [showDraftCapModal, setShowDraftCapModal] = useState(false);
  const [addDetailPlace, setAddDetailPlace] = useState<Venue | null>(null);

  const originalPlanRef = useRef<OutingPlan>(
    draftId ? (getDraftById(draftId) ?? getCurrentPlan()) : getCurrentPlan()
  );

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingSwap();
      if (!pending) return;
      setPlan((p) => {
        const newStops = p.stops.map((stop) =>
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
        );
        const updated = { ...p, stops: newStops };
        setCurrentPlan(updated);
        return updated;
      });
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
        setIsEditingName(false);
        setIsEditingCaption(false);
      }
    } else {
      router.back();
    }
  }

  function handleResetToScout() {
    setPlan(originalPlanRef.current);
    setCurrentPlan(originalPlanRef.current);
    setIsDirty(false);
  }

  function handleSaveDraft() {
    setShowDirtySheet(false);
    setCurrentPlan(plan);
    const result = saveDraftFromCurrent();
    if (result.capReached) {
      setShowDraftCapModal(true);
    } else {
      router.back();
    }
  }

  function handleDiscard() {
    setPlan(originalPlanRef.current);
    setCurrentPlan(originalPlanRef.current);
    setIsDirty(false);
    setEditMode(false);
    setIsEditingName(false);
    setIsEditingCaption(false);
    setShowDirtySheet(false);
  }

  function handleGenerate() {
    setIsRegenerating(true);
    const next = plan.variant === 'initial' ? ALTERNATE_PLAN : INITIAL_PLAN;
    const nextCopy: OutingPlan = { ...next, stops: [...next.stops] };
    setTimeout(() => {
      setPlan(nextCopy);
      setCurrentPlan(nextCopy);
      originalPlanRef.current = nextCopy;
      setIsDirty(false);
      setIsRegenerating(false);
      setEditMode(false);
      setIsEditingName(false);
      setIsEditingCaption(false);
    }, 1800);
  }

  function handleRemoveStop(id: string) {
    setPlan((p) => {
      const updated = { ...p, stops: p.stops.filter((stop) => stop.id !== id) };
      setCurrentPlan(updated);
      return updated;
    });
    setIsDirty(true);
  }

  function handleOpenSwap(stop: Stop, index: number) {
    const prevConnector = index > 0 ? plan.stops[index - 1].connector : undefined;
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

  function handleAddPlace(place: Venue) {
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
    setPlan((p) => {
      const updated = [...p.stops];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          connector: { mode: 'walk', time: '10 min walk' },
        };
      }
      const newPlan = { ...p, stops: [...updated, { ...newStop, connector: undefined }] };
      setCurrentPlan(newPlan);
      return newPlan;
    });
    setIsDirty(true);
  }

  function handleSelectForDetail(place: Venue) {
    setAddDetailPlace(place);
    setShowAddSheet(false);
  }

  function handleBegin() {
    setCurrentPlan(plan);
    beginOuting();
    router.replace('/active-outing');
  }

  function handleToggleSave(id: string) {
    setSavedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hrs   = estimatedHrs(plan.stops);
  const tiers = tierRange(plan.stops);

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
            {editMode && isEditingName ? (
              <TextInput
                style={styles.outingNameInput}
                value={plan.name}
                onChangeText={(text) => {
                  setPlan((p) => {
                    const updated = { ...p, name: text };
                    setCurrentPlan(updated);
                    return updated;
                  });
                  setIsDirty(true);
                }}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => setIsEditingName(false)}
                onBlur={() => setIsEditingName(false)}
                selectTextOnFocus
              />
            ) : (
              <View style={styles.namePencilRow}>
                <Text style={styles.outingName} numberOfLines={1} ellipsizeMode="tail">{plan.name}</Text>
                {editMode && (
                  <Pressable
                    onPress={() => setIsEditingName(true)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Pencil size={14} color={C.textTert} />
                  </Pressable>
                )}
              </View>
            )}

            {editMode && isEditingCaption ? (
              <TextInput
                style={styles.captionInput}
                value={plan.caption}
                onChangeText={(text) => {
                  setPlan((p) => {
                    const updated = { ...p, caption: text };
                    setCurrentPlan(updated);
                    return updated;
                  });
                  setIsDirty(true);
                }}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={() => setIsEditingCaption(false)}
                onBlur={() => setIsEditingCaption(false)}
                selectTextOnFocus
              />
            ) : (
              <View style={styles.captionPencilRow}>
                <Text style={styles.headerCaption}>{plan.caption}</Text>
                {editMode && (
                  <Pressable
                    onPress={() => setIsEditingCaption(true)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Pencil size={12} color={C.textTert} />
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.pillsRow}>
              <View style={styles.pill}><Text style={styles.pillText}>{plan.stops.length} stops</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>~{hrs} hrs</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>{tiers}</Text></View>
            </View>
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
            {plan.stops.map((stop, index) => (
              <React.Fragment key={stop.id}>
                <StopCard
                  stop={stop}
                  editMode={editMode}
                  onSwap={() => handleOpenSwap(stop, index)}
                  onRemove={() => handleRemoveStop(stop.id)}
                  onPress={() => setDetailStop(stop)}
                />
                {index < plan.stops.length - 1 && stop.connector && (
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
        currentStops={plan.stops}
      />

      {/* ── PLACE DETAIL MODAL ── */}
      <PlaceDetailModal
        stop={detailStop}
        isSaved={detailStop ? savedPlaceIds.has(detailStop.id) : false}
        onSave={() => detailStop && handleToggleSave(detailStop.id)}
        onClose={() => setDetailStop(null)}
      />

      {/* ── ADD-STOP DETAIL MODAL ── */}
      <PlaceDetailModal
        stop={addDetailPlace as Stop | null}
        isSaved={addDetailPlace ? savedPlaceIds.has(addDetailPlace.id) : false}
        onSave={() => addDetailPlace && handleToggleSave(addDetailPlace.id)}
        onClose={() => { setAddDetailPlace(null); setShowAddSheet(true); }}
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
  captionPencilRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
  },
  captionInput: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 20,
    marginTop: 8,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.amber,
  },

  // Pills row (stop count / duration / price)
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  pill: {
    backgroundColor: C.pillMuted,
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
