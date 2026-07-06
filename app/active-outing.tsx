/**
 * FORAGE — ActiveOutingScreen
 * app/active-outing.tsx
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  completeCurrentStop,
  endOuting,
  getCurrentPlan,
  goToPreviousStop,
  isOutingComplete,
  type OutingPlan,
  type Stop,
} from './_outing-store';
import {
  ArrowLeft,
  Bus,
  Car,
  Clock,
  Coffee,
  Footprints,
  Heart,
  House,
  Leaf,
  MapPin,
  Moon,
  Navigation,
  Palette,
  Utensils,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  progressBg:  '#F8F5F0',
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
//  HELPERS
// ─────────────────────────────────────────

function getCatIcon(category: string): React.ComponentType<{ size: number; color: string }> {
  if (category.includes('EAT') || category.includes('DRINK')) return Utensils;
  if (category.includes('COFFEE'))                            return Coffee;
  if (category.includes('ARTS') || category.includes('CULTURE')) return Palette;
  if (category.includes('OUTDOORS'))                          return Leaf;
  if (category.includes('NIGHTLIFE'))                         return Moon;
  return MapPin;
}

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

type TransportOpt = {
  mode: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  time: string;
  highlighted: boolean;
};

// ─────────────────────────────────────────
//  PROGRESS STRIP
// ─────────────────────────────────────────

function ProgressStrip({ total, completed }: { total: number; completed: number }) {
  return (
    <View style={styles.progressStrip}>
      {Array.from({ length: total }, (_, i) => {
        const isDone    = i < completed;
        const isCurrent = i === completed;
        return (
          <React.Fragment key={i}>
            <View style={styles.progNodeWrap}>
              <View style={[
                styles.progNode,
                isDone    && styles.progNodeDone,
                isCurrent && styles.progNodeCurrent,
                !isDone && !isCurrent && styles.progNodeUpcoming,
              ]}>
                <Text style={[
                  styles.progNodeText,
                  isDone    && { color: '#FFFFFF' },
                  isCurrent && { color: C.amber },
                  !isDone && !isCurrent && { color: C.textTert },
                ]}>
                  {isDone ? '✓' : i + 1}
                </Text>
              </View>
            </View>
            {i < total - 1 && (
              i < completed
                ? <View style={[styles.progLine, styles.progLineDone]} />
                : (
                  <View style={[styles.progLine, styles.progLineUpcomingBase]}>
                    {Array.from({ length: 60 }, (_, j) => (
                      <View key={j} style={styles.progDash} />
                    ))}
                  </View>
                )
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────
//  TRANSPORT CONNECTOR
// ─────────────────────────────────────────

function TransportConnector({ options }: { options: TransportOpt[] }) {
  const [expanded, setExpanded] = useState(false);
  if (options.length === 0) return null;

  const primary = options.find(o => o.highlighted) ?? options[0];
  const displayed = expanded ? options : [primary];

  return (
    <View style={styles.transConnector}>
      <View style={styles.transConnectorLine} />
      <Pressable
        onPress={() => setExpanded(e => !e)}
        hitSlop={{ top: 6, bottom: 6, left: 20, right: 20 }}
      >
        <View style={styles.transConnectorChips}>
          {displayed.map(opt => {
            const OptIcon = opt.Icon;
            return (
              <View
                key={opt.mode}
                style={[
                  styles.transConnectorChip,
                  opt.highlighted && styles.transConnectorChipHL,
                ]}
              >
                <OptIcon size={13} color={opt.highlighted ? C.amber : C.textTert} />
                <Text style={[styles.transConnectorTime, opt.highlighted && styles.transConnectorTimeHL]}>
                  {opt.time}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>
      <View style={styles.transConnectorLine} />
    </View>
  );
}

// ─────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────

export default function ActiveOutingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  const [plan, setPlan]               = useState<OutingPlan>(() => getCurrentPlan());
  const [savedStopIds, setSavedStopIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      setPlan(getCurrentPlan());
    }, [])
  );

  if (!fontsLoaded && !fontError) return null;

  const currentStop: Stop | undefined = plan.stops[plan.currentStopIndex];
  const nextStop: Stop | undefined    = plan.stops[plan.currentStopIndex + 1];

useEffect(() => {
  if (!currentStop) {
    endOuting();
    router.replace('/');
  }
}, [currentStop]);

if (!currentStop) return null;

  const CatIcon      = getCatIcon(currentStop.category);
  const isStopSaved  = savedStopIds.has(currentStop.id);
  const connector    = currentStop.connector;

// Only render the real transport mode from the connector data — the other
// two modes have no actual estimate, so we don't fabricate one.
const transportOptions: TransportOpt[] = connector ? [
  {
    mode:        connector.mode,
    Icon:        connector.mode === 'walk' ? Footprints : connector.mode === 'drive' ? Car : Bus,
    label:       connector.mode === 'walk' ? 'Walk' : connector.mode === 'drive' ? 'Drive' : 'Transit',
    time:        connector.time,
    highlighted: true,
  },
] : [];

  function handleToggleSave() {
    setSavedStopIds(prev => {
      const next = new Set(prev);
      if (next.has(currentStop!.id)) next.delete(currentStop!.id);
      else next.add(currentStop!.id);
      return next;
    });
  }

  function handlePreviousStop() {
    goToPreviousStop();
    setPlan(getCurrentPlan());
  }

  function handleCompleteStop() {
    completeCurrentStop();
    if (isOutingComplete()) {
      endOuting();
      router.replace('/');
    } else {
      setPlan(getCurrentPlan());
    }
  }

  // No confirmation sheet yet — end outing goes straight home (future prompt).
  function handleEndOuting() {
    endOuting();
    router.replace('/');
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {plan.name}
          </Text>
          <Pressable
            style={styles.headerHomeBtn}
            onPress={() => router.push('/')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <House size={20} color={C.textSec} />
          </Pressable>
        </View>
        <ProgressStrip
          total={plan.stops.length}
          completed={plan.currentStopIndex}
        />
      </View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── CURRENT STOP BLOCK ── */}
        <View style={styles.stopBlock}>

          {/* Photo placeholder */}
          <View style={[styles.stopPhoto, { backgroundColor: currentStop.color + '22' }]}>
            <View style={styles.stopPhotoIcon}>
              <CatIcon size={72} color={currentStop.color} />
            </View>
            <View style={[styles.catPill, { backgroundColor: currentStop.color }]}>
              <Text style={styles.catPillText}>{currentStop.category}</Text>
            </View>
            <Pressable
              style={styles.heartBtn}
              onPress={handleToggleSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={13}
                color={isStopSaved ? C.eat : C.textTert}
                fill={isStopSaved ? C.eat : 'none'}
              />
            </Pressable>
          </View>

          {/* Info area */}
          <View style={styles.stopInfo}>
            <Text style={styles.stopName}>{currentStop.name}</Text>

            <View style={styles.metaRow}>
              <MapPin size={12} color={C.textTert} />
              <Text style={styles.neighborhood}>{currentStop.neighborhood}</Text>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.price}>{currentStop.priceTier}</Text>
            </View>

            <Text style={styles.description} numberOfLines={3}>
              {currentStop.description}
            </Text>

            {/* Hours — Stop type has no hours field; hardcoded until data model is extended */}
            <View style={styles.hoursRow}>
              <Clock size={12} color={C.textTert} />
              <Text style={styles.hoursText}>Hours vary — check ahead</Text>
            </View>

            <Pressable style={[styles.directionsBtn, { alignSelf: 'flex-start' }]} onPress={() => {}}>
              <Navigation size={12} color={C.amber} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </Pressable>

          </View>
        </View>

        {/* ── TRANSPORT CONNECTOR ── */}
        {nextStop && transportOptions.length > 0 && (
          <TransportConnector options={transportOptions} />
        )}

        {/* ── NEXT UP CARD ── */}
        {nextStop && (
          <View style={styles.nextUpCard}>
            <View style={styles.nextUpRow}>
              <View style={styles.nextUpLeft}>
                <View style={[styles.nextUpCircle, { backgroundColor: nextStop.color }]} />
                <View style={styles.nextUpText}>
                  <Text style={styles.nextUpLabel}>NEXT UP</Text>
                  <Text style={styles.nextUpPlace} numberOfLines={1}>{nextStop.name}</Text>
                </View>
              </View>
              <Pressable style={styles.directionsBtn} onPress={() => {}}>
                <Navigation size={12} color={C.amber} />
                <Text style={styles.directionsBtnText}>Directions</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── PREVIOUS STOP ── */}
        {plan.currentStopIndex > 0 && (
          <Pressable style={styles.prevStop} onPress={handlePreviousStop}>
            <ArrowLeft size={14} color={C.textSec} />
            <Text style={styles.prevStopText}>Previous stop</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── FIXED BOTTOM CTA ── */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.completeBtn} onPress={handleCompleteStop}>
          <Text style={styles.completeBtnText}>
            {plan.currentStopIndex === plan.stops.length - 1 ? 'Finish Outing' : 'Complete Stop  →'}
          </Text>
        </Pressable>
        {plan.currentStopIndex !== plan.stops.length - 1 && (
          <Pressable style={styles.endOutingBtn} onPress={handleEndOuting}>
            <Text style={styles.endOutingText}>End outing</Text>
          </Pressable>
        )}
      </View>
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
    gap: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 30,
    flex: 1,
  },
  headerHomeBtn: {
    flexShrink: 0,
    padding: 4,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  // ── Progress strip ──
  progressStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progNodeWrap: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  progNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progNodeDone: {
    backgroundColor: C.amber,
  },
  progNodeCurrent: {
    backgroundColor: C.amberTint,
    borderWidth: 2,
    borderColor: C.amber,
  },
  progNodeUpcoming: {
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.textTert,
  },
  progNodeText: {
    fontFamily: F.semi,
    fontSize: 12,
  },
  progLabel: {
    fontFamily: F.semi,
    fontSize: 10,
  },
  progLine: {
    flex: 1,
    height: 1.5,
    marginTop: 15,
  },
  progLineDone: {
    backgroundColor: C.amber,
  },
  progLineUpcomingBase: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progDash: {
    width: 3,
    height: 1.5,
    backgroundColor: C.textTert,
    marginRight: 6,
    flexShrink: 0,
  },

  // ── Stop block ──
  stopBlock: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Photo
  stopPhoto: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopPhotoIcon: {
    opacity: 0.35,
  },
  catPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catPillText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  stopInfo: {
    padding: 14,
    gap: 8,
  },
  stopName: {
    fontFamily: F.serif,
    fontSize: 22,
    color: C.textPrimary,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  neighborhood: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
  },
  metaSep: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textTert,
  },
  price: {
    fontFamily: F.med,
    fontSize: 13,
    color: C.textSec,
  },
  description: {
    fontFamily: F.reg,
    fontSize: 14,
    color: C.textSec,
    lineHeight: 21,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hoursText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
    fontStyle: 'italic',
  },

  // ── Transport Connector ──
  transConnector: {
    alignItems: 'center',
    marginBottom: 6,
  },
  transConnectorLine: {
    width: 1.5,
    height: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.textTert,
  },
  transConnectorChips: {
    alignItems: 'center',
    gap: 6,
  },
  transConnectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  transConnectorChipHL: {
    backgroundColor: C.amberTint,
    borderColor: C.amberBorder,
  },
  transConnectorLabel: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textTert,
  },
  transConnectorLabelHL: {
    color: C.amber,
  },
  transConnectorSep: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
  },
  transConnectorTime: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textTert,
  },
  transConnectorTimeHL: {
    fontFamily: F.semi,
    color: C.amber,
  },

  // ── Next up ──
  nextUpCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  nextUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextUpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  nextUpCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
  },
  nextUpText: {
    flex: 1,
    minWidth: 0,
  },
  nextUpLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.textTert,
    letterSpacing: 1,
    marginBottom: 2,
  },
  nextUpPlace: {
    fontFamily: F.semi,
    fontSize: 13,
    color: C.textPrimary,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  directionsBtnText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.amber,
  },

  // ── Previous stop ──
  prevStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  prevStopText: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textSec,
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
    alignItems: 'center',
    gap: 10,
  },
  completeBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: C.fabTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    fontFamily: F.semi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  endOutingBtn: {
    paddingVertical: 4,
  },
  endOutingText: {
    fontFamily: F.reg,
    fontSize: 13,
    color: C.textTert,
  },
});
