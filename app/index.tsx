/**
 * FORAGE — HomeScreen.jsx
 *
 * Drop this file into your Expo project at: app/index.jsx  (or screens/HomeScreen.jsx)
 *
 * SETUP — run these commands in your project root BEFORE using this file:
 *   npx expo install expo-font expo-splash-screen react-native-safe-area-context react-native-svg
 *   npx expo install @expo-google-fonts/libre-baskerville @expo-google-fonts/plus-jakarta-sans
 *   npm install lucide-react-native
 *
 * PUT logo_app.png in:  assets/images/scout.png
 */

import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock,
  Heart,
  Home,
  MapPin,
  Navigation,
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ActiveOutingWarningSheet from './_active-outing-warning-sheet';
import { getCatIcon } from './_category-icons';
import OverallRatingPrompt from './_overall-rating-prompt';
import StopRatingSheet from './_stop-rating-sheet';
import { useStopCompletion } from './_use-stop-completion';
import { C } from '../data/colors';
import { VENUES, type Venue } from '../data/venues';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getScoutSuggestion,
  getDrafts,
  getMostRecentDraft,
  type OutingPlan,
} from './_outing-store';
import {
  Animated,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Line, Svg } from 'react-native-svg';

SplashScreen.preventAutoHideAsync();

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const F = {
  serif:  'LibreBaskerville_700Bold',
  reg:    'PlusJakartaSans_400Regular',
  med:    'PlusJakartaSans_500Medium',
  semi:   'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  SAMPLE DATA  (replace with API / state)
// ─────────────────────────────────────────

const SAVED_PLACE_COUNT = 4; // >= 3 shows Build Around card

type PressHandlerProps = {
  onPress?: () => void;
};

type ActiveOutingCardProps = {
  plan: OutingPlan;
  onNextStop?: () => void;
  onSeeDetails?: () => void;
  onPreviousStop?: () => void;
  isFinalStop?: boolean;
};

function formatStartTime(startTime: number | null): string {
  if (startTime == null) return '—';
  return new Date(startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Opens the user's default maps app with a name+neighborhood text search.
 * Stop/Venue has no lat/lng yet — see DECISIONS.md.
 */
function openDirections(stop: { name: string; neighborhood: string }) {
  const query = encodeURIComponent(`${stop.name}, ${stop.neighborhood}, Washington DC`);
  const url = Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url);
}

type ProgressStripProps = {
  total: number;
  completed: number;
};

// ─────────────────────────────────────────
//  SMALL SHARED COMPONENTS
// ─────────────────────────────────────────

/** Amber dot for "Scout's Pick" and "Active Outing" labels */
function AmberDot({ pulse = false }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return <Animated.View style={[styles.amberDot, { opacity }]} />;
}

/** Category circle used in stop lists */
function CategoryCircle({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <View style={[styles.catCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
  );
}


/** For You card — 160 × 232 */
function ForYouCard({ item }: { item: Venue }) {
  const [saved, setSaved] = useState(false);
  const CatIcon = getCatIcon(item.category);
  return (
    <Pressable style={styles.fyCard} onPress={() => {}}>
      {/* Photo area */}
      <View style={styles.fyPhoto}>
        {/* Placeholder — swap for <Image> once real venue photos are available */}
        <View style={styles.fyPhotoPlaceholder}>
          <CatIcon size={40} color={item.color} />
        </View>
        {/* Category pill */}
        <View style={[styles.fyCatPill, { backgroundColor: item.color }]}>
          <Text style={styles.fyCatText} numberOfLines={1}>{item.category}</Text>
        </View>
        {/* Heart */}
        <Pressable
          style={styles.fyHeart}
          onPress={() => setSaved(s => !s)}
          hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
        >
          <Heart
            size={13}
            color={saved ? C.eat : C.textTert}
            fill={saved ? C.eat : 'none'}
          />
        </Pressable>
        <View style={styles.fyScrim} />
      </View>
      {/* Info strip */}
      <View style={styles.fyInfo}>
        <View style={styles.fyNameWrap}>
          <Text style={styles.fyName} numberOfLines={2}>{item.name}</Text>
        </View>
        <View style={styles.fyDivider} />
        <View style={styles.fyMeta}>
          <View style={styles.fyMetaLeft}>
            <MapPin size={10} color={C.textSec} />
            <Text style={styles.fyNeighborhood} numberOfLines={1}>{item.neighborhood}</Text>
          </View>
          <Text style={styles.fyPrice}>{item.priceTier}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  SCOUT CARD  (State A primary card)
// ─────────────────────────────────────────

function ScoutCard({ onPress, plan }: PressHandlerProps & { plan: OutingPlan }) {
  const { name, vibeTags, stops } = plan;
  const stopCount = stops.length;
  const mappedStops = stops.map(s => ({
    category: s.category,
    place: s.name,
    neighborhood: s.neighborhood,
    color: s.color,
    Icon: getCatIcon(s.category),
  }));
  return (
    <Pressable style={styles.scoutCard} onPress={onPress}>
      {/* Stop count pill */}
      <View style={styles.stopCountPill}>
        <Text style={styles.stopCountText}>{stopCount} stops</Text>
      </View>

      {/* Header */}
      <View style={styles.scoutHeader}>
        <View style={styles.scoutLabelRow}>
          <AmberDot />
          <Text style={styles.scoutLabelText}>SCOUT'S PICK</Text>
        </View>
        <Text style={styles.scoutOutingName}>{name}</Text>
        <View style={styles.vibeTags}>
          {vibeTags.map(tag => (
            <View key={tag} style={styles.vibeTag}>
              <Text style={styles.vibeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stop list */}
      <View style={styles.stopList}>
        <View style={styles.stopDivider} />
        {mappedStops.map((stop) => {
          const StopIcon = stop.Icon;
          return (
            <View key={stop.place}>
              <View style={styles.stopRow}>
                <View style={[styles.stopColorBar, { backgroundColor: stop.color }]} />
                <StopIcon size={13} color={stop.color} />
                <View style={styles.stopTextBlock}>
                  <Text style={[styles.stopCategoryLabel, { color: stop.color }]}>{stop.category}</Text>
                  <Text style={styles.stopPlaceName}>{stop.place}</Text>
                </View>
                <View style={styles.stopNeighborhoodRight}>
                  <MapPin size={9} color={C.textSec} />
                  <Text style={styles.stopNeighborhoodText}>{stop.neighborhood}</Text>
                </View>
              </View>
              <View style={styles.stopDivider} />
            </View>
          );
        })}
      </View>

      {/* CTA affordance */}
      <View style={styles.scoutCTA}>
        <Text style={styles.scoutCTAText}>See full plan</Text>
        <ChevronRight size={11} color={C.amber} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  FOR YOU SECTION  (all states)
// ─────────────────────────────────────────

const FOR_YOU_COUNT = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Randomly picks up to `count` venues, round-robining across categories so the result isn't dominated by one category. */
function pickForYouVenues(venues: Venue[], count: number): Venue[] {
  const byCategory = new Map<string, Venue[]>();
  for (const v of venues) {
    const list = byCategory.get(v.category) ?? [];
    list.push(v);
    byCategory.set(v.category, list);
  }
  const groups = shuffle([...byCategory.values()]).map(shuffle);

  const result: Venue[] = [];
  let i = 0;
  while (result.length < count && groups.some(g => g.length > 0)) {
    const group = groups[i % groups.length];
    if (group.length > 0) result.push(group.shift()!);
    i++;
  }
  return result;
}

/** 
 * Cached for the current app session only — resets on cold start since 
 * there's no persistence layer (matches the project's broader no-persistence 
 * v1 scope). Not truly "daily"; stable only while the app stays running.
 */
let forYouCache: { date: string; venueIds: string[] } | null = null;

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Picks the day's For You venues once and reuses them for every render/mount that day. */
function getDailyForYouSelection(): Venue[] {
  const today = getLocalDateString(new Date());
  if (forYouCache && forYouCache.date === today) {
    const byId = new Map(VENUES.map(v => [v.id, v] as const));
    const cached = forYouCache.venueIds.map(id => byId.get(id)).filter((v): v is Venue => v != null);
    if (cached.length === forYouCache.venueIds.length) return cached;
  }
  const selection = pickForYouVenues(VENUES, FOR_YOU_COUNT);
  forYouCache = { date: today, venueIds: selection.map(v => v.id) };
  return selection;
}

function ForYouSection() {
  const items = useMemo(() => getDailyForYouSelection(), []);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>For You</Text>
        <Pressable
          onPress={() => setExpanded(e => !e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAll}>{expanded ? 'Show less ‹' : 'See all ›'}</Text>
        </Pressable>
      </View>
      {expanded ? (
        <View style={styles.fyGrid}>
          {VENUES.map(item => (
            <ForYouCard key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fyRow}
          renderItem={({ item }) => <ForYouCard item={item} />}
          snapToInterval={170} // card width 160 + gap 10
          decelerationRate="fast"
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────
//  BUILD AROUND CARD  (conditional)
// ─────────────────────────────────────────

function BuildAroundCard() {
  if (SAVED_PLACE_COUNT < 3) return null;
  return (
    <Pressable style={[styles.card, styles.buildCard]}>
      <View style={styles.buildLeft}>
        <View style={styles.buildRow}>
          <View style={styles.buildIconWrap}>
            <Bookmark size={18} color={C.amber} />
          </View>
          <Text style={styles.buildTitle}>Build Around Saved Places</Text>
        </View>
        <Text style={styles.buildDesc}>Turn your saved spots into a real outing.</Text>
        <Text style={styles.buildCTA}>Try it now →</Text>
      </View>
      {/* Mini map placeholder — replace with a real map image */}
      <View style={styles.miniMap} />
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  OUTING DRAFT CARD  (State B)
// ─────────────────────────────────────────

function OutingDraftCard({ onPress, draft }: PressHandlerProps & { draft: OutingPlan }) {
  const name       = draft.name;
  const stopCount  = draft.stops.length;
  const stopColors = draft.stops.map(s => s.color).slice(0, 3);
  const extraStops = Math.max(0, draft.stops.length - 3);
  const dateLabel  = draft.lastEdited
    ? new Date(draft.lastEdited).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  return (
    <>
      <Pressable style={[styles.card, styles.draftCard]} onPress={onPress}>
        {/* Left: clock + text */}
        <View style={styles.draftLeft}>
          <View style={styles.clockCircle}>
            <Clock size={18} color={C.amber} />
          </View>
          <View style={styles.draftText}>
            <Text style={styles.draftLabel}>OUTING DRAFT</Text>
            <Text style={styles.draftName} numberOfLines={1}>{name}</Text>
            <Text style={styles.draftMeta}>{dateLabel}  ·  {stopCount} stops</Text>
          </View>
        </View>
        {/* Right: stop circles */}
        <View style={styles.stopCircles}>
          {stopColors.map((color, i) => (
            <View
              key={i}
              style={[
                styles.draftStopCircle,
                { backgroundColor: color, marginLeft: i === 0 ? 0 : -8, zIndex: stopColors.length - i },
              ]}
            />
          ))}
          {extraStops > 0 && (
            <View style={[styles.draftStopCircle, styles.draftStopExtra, { marginLeft: -8 }]}>
              <Text style={styles.draftExtraText}>+{extraStops}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* View draft list — outside card, below it */}
      {(getDrafts().length - 1) >= 1 && (
        <Pressable style={styles.draftListLink} onPress={() => {}}>
          <Text style={styles.draftListText}>View draft list</Text>
          <ChevronRight size={12} color={C.textSec} />
        </Pressable>
      )}

      {/* Scout also suggests label */}
      <Text style={styles.scoutAlsoLabel}>SCOUT ALSO SUGGESTS</Text>
    </>
  );
}

// ─────────────────────────────────────────
//  ACTIVE OUTING CARD  (State C)
// ─────────────────────────────────────────

function DashedHLine() {
  const [w, setW] = useState(0);
  return (
    <View style={styles.progLine} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={1.5}>
          <Line x1="0" y1="0.75" x2={w} y2="0.75" stroke={C.textTert} strokeWidth={1.5} strokeDasharray="3 6" />
        </Svg>
      )}
    </View>
  );
}

function ProgressStrip({ total, completed }: ProgressStripProps) {
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
                : <DashedHLine />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function ActiveOutingCard({ plan, onNextStop, onSeeDetails, onPreviousStop, isFinalStop }: ActiveOutingCardProps) {
  const [stopSaved, setStopSaved] = useState(false);

  const totalStops     = plan.stops.length;
  const completedStops = plan.currentStopIndex;
  const currentStop    = plan.stops[plan.currentStopIndex];
  const nextStop       = plan.stops[plan.currentStopIndex + 1];

  if (!currentStop) return null;

  return (
    <View style={[styles.card, styles.activeCard]}>
      {/* Top row */}
      <View style={styles.activeTopRow}>
        <View style={styles.activeLabelRow}>
          <AmberDot pulse />
          <Text style={styles.activeLabelText}>ACTIVE OUTING</Text>
        </View>
        <Text style={styles.activeStartTime}>Started {formatStartTime(plan.startTime)}</Text>
      </View>

      {/* Outing name */}
      <Text style={styles.activeOutingName} numberOfLines={1}>{plan.name}</Text>

      {/* Progress strip */}
      <ProgressStrip total={totalStops} completed={completedStops} />

      {/* Current stop block */}
      <View style={styles.curStopBlock}>
        <Text style={styles.curStopLabel}>CURRENT STOP</Text>
        <View style={styles.curStopRow}>
          {/* Photo placeholder */}
          <View style={[styles.curPhoto, { backgroundColor: currentStop.color }]} />
          {/* Info */}
          <View style={styles.curInfo}>
            <View style={[styles.curCatPill, { backgroundColor: currentStop.color }]}>
              <Text style={styles.curCatText}>{currentStop.category}</Text>
            </View>
            <Text style={styles.curPlaceName}>{currentStop.name}</Text>
            <Text style={styles.curNeighborhood}>{currentStop.neighborhood}</Text>
          </View>
        </View>
        {/* Heart — top-right corner of block */}
        <Pressable
          style={styles.curHeart}
          onPress={() => setStopSaved(s => !s)}
          hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
        >
          <Heart
            size={13}
            color={stopSaved ? C.eat : C.textTert}
            fill={stopSaved ? C.eat : 'none'}
          />
        </Pressable>
      </View>

      {/* Next up row */}
      {nextStop && (
        <View style={styles.nextUpRow}>
          <View style={styles.nextUpLeft}>
            <View style={[styles.nextUpCircle, { backgroundColor: nextStop.color }]} />
            <View style={styles.nextUpText}>
              <Text style={styles.nextUpLabel}>NEXT UP</Text>
              <Text style={styles.nextUpPlace} numberOfLines={1}>{nextStop.name}</Text>
            </View>
          </View>
          <Pressable style={styles.directionsBtn} onPress={() => openDirections(nextStop)}>
            <Navigation size={12} color="#FFFFFF" />
            <Text style={styles.directionsBtnText}>Directions</Text>
          </Pressable>
        </View>
      )}

      {/* Previous stop — hidden on stop 1 */}
      {completedStops >= 1 && (
        <Pressable style={styles.prevStop} onPress={onPreviousStop}>
          <ArrowLeft size={14} color={C.textTert} />
          <Text style={styles.prevStopText}>Previous stop</Text>
        </Pressable>
      )}

      {/* Next Stop button */}
      <Pressable style={styles.nextStopBtn} onPress={onNextStop}>
        <Text style={styles.nextStopBtnText}>{isFinalStop ? 'Finish Outing' : 'Next Stop  →'}</Text>
      </Pressable>

      {/* See full outing details */}
      <Pressable onPress={onSeeDetails}>
        <Text style={styles.seeDetailsText}>See full outing details</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────
//  BOTTOM NAV  (visual stub — replace with
//  Expo Router tabs or React Navigation)
// ─────────────────────────────────────────

function BottomNav({ activeTab = 'Home', onFabPress }: { activeTab?: string; onFabPress?: () => void }) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { name: 'Home',    Icon: Home },
    { name: 'Explore', Icon: MapPin },
    { name: 'Outing',  Icon: null },  // FAB
    { name: 'Friends', Icon: Users },
    { name: 'Profile', Icon: User },
  ];
  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      {tabs.map(tab => {
        if (tab.name === 'Outing') {
          return (
            <View key="fab" style={styles.fabWrap}>
              <Pressable style={styles.fab} onPress={onFabPress}>
                <LinearGradient
                  colors={[C.fabTop, C.fabBottom]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.fabGradient}
                >
                  <Sparkles size={24} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          );
        }
        const isActive = activeTab === tab.name;
        const iconColor = isActive ? C.amberNav : C.textTert;
        const Icon = tab.Icon;

        if(!Icon) return null;

        return (
          <Pressable key={tab.name} style={styles.navTab}>
            <Icon size={22} color={iconColor} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────
//  GREETING
// ─────────────────────────────────────────

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return `Good morning, ${name}.`;
  if (h >= 12 && h < 18) return `Good afternoon, ${name}.`;
  if (h >= 18 && h < 24) return `Good evening, ${name}.`;
  return `Hey, ${name}.`;
}

// ─────────────────────────────────────────
//  MAIN HOME SCREEN
// ─────────────────────────────────────────

export default function HomeScreen() {
  const [, setRefreshTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshTick(t => t + 1);
    }, [])
  );

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    LibreBaskerville_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const stopCompletion = useStopCompletion('');

  const [showFabWarning, setShowFabWarning]         = useState(false);
  const [pendingFabRedirect, setPendingFabRedirect]  = useState(false);

  if (!fontsLoaded && !fontError) return null;

  if (stopCompletion.activePrompt === 'overall' && stopCompletion.finishedPlan) {
    return (
      <OverallRatingPrompt
        outingId={stopCompletion.finishedPlan.id}
        stops={stopCompletion.finishedPlan.stops}
        onSubmit={rating => {
          stopCompletion.finishOuting();
          if (pendingFabRedirect) {
            setPendingFabRedirect(false);
            router.push('/outing-questions');
          }
        }}
      />
    );
  }

  // 'C' = active outing · 'B' = draft in progress · 'A' = no outing
  const activeOuting  = stopCompletion.plan;
  const drafts        = getDrafts();
  const derivedState  = activeOuting !== null ? 'C' : drafts.length > 0 ? 'B' : 'A';

  function onNextStop() {
    stopCompletion.handleCompleteStop();
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={styles.greeting}>{getGreeting('Joel')}</Text>

        {/* ── STATE C: Active outing hero ── */}
        {derivedState === 'C' && activeOuting && (
          <>
            <ActiveOutingCard
              plan={activeOuting}
              onNextStop={onNextStop}
              onSeeDetails={() => router.push('/active-outing')}
              onPreviousStop={stopCompletion.handlePreviousStop}
              isFinalStop={stopCompletion.isFinalStop}
            />
            <StopRatingSheet
              stop={stopCompletion.ratedStop ?? activeOuting.stops[activeOuting.currentStopIndex]}
              visible={stopCompletion.activePrompt === 'stop'}
              onRate={stars => console.log('[home] stop rated', stopCompletion.ratedStop?.stopInstanceId, stars)}
              onSave={saved => console.log('[home] stop saved', stopCompletion.ratedStop?.stopInstanceId, saved)}
              onDismiss={stopCompletion.dismissStopPrompt}
            />
            <ActiveOutingWarningSheet
              planName={stopCompletion.plan?.name ?? ''}
              stopsCompleted={stopCompletion.plan?.currentStopIndex ?? 0}
              totalStops={stopCompletion.plan?.stops.length ?? 0}
              visible={showFabWarning}
              onKeepGoing={() => setShowFabWarning(false)}
              onEndAndStartNew={() => {
                setShowFabWarning(false);
                setPendingFabRedirect(true);
                stopCompletion.handleEndOuting();
              }}
            />
          </>
        )}

        {/* ── STATE A: Scout suggestion ── */}
        {derivedState === 'A' && (
          <ScoutCard onPress={() => router.push('/outing-preview')} plan={getScoutSuggestion()} />
        )}

        {/* ── STATE B: Draft + Scout also suggests ── */}
        {derivedState === 'B' && (
          <>
            {getMostRecentDraft() != null && (
              <OutingDraftCard
                onPress={() => router.push({ pathname: '/outing-preview', params: { draftId: getMostRecentDraft()!.id } })}
                draft={getMostRecentDraft()!}
              />
            )}
            {/* Full Scout card below the label */}
            <ScoutCard onPress={() => router.push('/outing-preview')} plan={getScoutSuggestion()} />
          </>
        )}

        {/* For You — always shown */}
        <ForYouSection />

        {/* Build Around — shown when user has 3+ saved places */}
        <BuildAroundCard />
      </ScrollView>

      {/* Bottom nav */}
      <BottomNav
        activeTab="Home"
        onFabPress={() => {
          if (stopCompletion.plan) {
            setShowFabWarning(true);
          } else {
            router.push('/outing-questions');
          }
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
  },

  // ── Greeting ──
  greeting: {
    fontFamily: F.serif,
    fontSize: 36,
    color: C.textPrimary,
    lineHeight: 44,
    marginBottom: 20,
  },

  // ── Amber dot ──
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.amber,
    marginRight: 6,
  },

  // ── Card base ──
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  catCircle: {
    flexShrink: 0,
  },
  
  // ── Scout Card ──
  scoutCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stopCountPill: {
    position: 'absolute',
    top: 18,
    right: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stopCountText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textSec,
  },
  scoutHeader: {
    paddingRight: 80,
  },
  scoutLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoutLabelText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.amber,
    letterSpacing: 1.2,
  },
  scoutOutingName: {
    fontFamily: F.serif,
    fontSize: 22,
    color: C.textPrimary,
    lineHeight: 27,
    marginBottom: 8,
  },
  vibeTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
  },
  vibeTag: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  vibeTagText: {
    fontFamily: F.med,
    fontSize: 10,
    color: C.textSec,
  },

  // Stop list
  stopList: {
    marginTop: 16,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  stopColorBar: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: 'stretch',
  },
  stopTextBlock: {
    flex: 1,
    gap: 2,
  },
  stopCategoryLabel: {
    fontFamily: F.reg,
    fontSize: 10,
    color: C.textTert,
  },
  stopPlaceName: {
    fontFamily: F.med,
    fontSize: 15,
    color: C.textPrimary,
  },
  stopNeighborhoodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  stopNeighborhoodText: {
    fontFamily: F.reg,
    fontSize: 10,
    color: C.textSec,
    textAlign: 'right',
  },
  stopDivider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 11,
  },
  scoutCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
  },
  scoutCTAText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.amber,
  },

  // ── For You ──
  sectionBlock: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: F.serif,
    fontSize: 22,
    color: C.textPrimary,
  },
  seeAll: {
    fontFamily: F.reg,
    fontSize: 13,
    color: '#524B45',
  },
  fyRow: {
    paddingRight: 14,
    gap: 10,
  },
  fyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fyCard: {
    width: 160,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  fyPhoto: {
    height: 148,
    backgroundColor: C.bg,
  },
  fyPhotoPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.25,
  },
  fyScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fyCatPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 20,
    height: 24,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  fyCatText: {
    fontFamily: F.semi,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  fyHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fyInfo: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    height: 89,
  },
  fyNameWrap: {
    height: 40,
    marginBottom: 6,
  },
  fyName: {
    fontFamily: F.serif,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  fyDivider: {
    height: 1,
    backgroundColor: '#E3DACD',
    marginBottom: 6,
  },
  fyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fyMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  fyNeighborhood: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
    flexShrink: 1,
  },
  fyPrice: {
    fontFamily: F.med,
    fontSize: 11,
    color: C.textSec,
    flexShrink: 0,
    paddingLeft: 6,
  },

  // ── Build Around ──
  buildCard: {
    marginTop: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  buildLeft: {
    flex: 1,
  },
  buildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  buildIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buildTitle: {
    fontFamily: F.serif,
    fontSize: 15,
    color: C.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  buildDesc: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
    lineHeight: 16,
    marginBottom: 12,
  },
  buildCTA: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.amber,
  },
  miniMap: {
    width: 100,
    height: 88,
    borderRadius: 10,
    backgroundColor: C.mapGreen,
    flexShrink: 0,
    // Replace this with an actual static map image or react-native-maps
  },

  // ── Draft Card ──
  draftCard: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 90,
  },
  draftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  clockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  draftText: {
    flex: 1,
    minWidth: 0,
  },
  draftLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.amber,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  draftName: {
    fontFamily: F.serif,
    fontSize: 17,
    color: C.textPrimary,
    marginBottom: 3,
  },
  draftMeta: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  stopCircles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  draftStopCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: C.card,
  },
  draftStopExtra: {
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftExtraText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textSec,
  },
  draftListLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 8,
    paddingLeft: 2,
  },
  draftListText: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  scoutAlsoLabel: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.textSec,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
  },

  // ── Active Outing Card ──
  activeCard: {
    padding: 18,
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLabelText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.amber,
    letterSpacing: 1.2,
  },
  activeStartTime: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  activeOutingName: {
    fontFamily: F.serif,
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 29,
    marginBottom: 16,
  },

  // Progress strip
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
    borderColor: C.textSec,
  },
  progNodeText: {
    fontFamily: F.semi,
    fontSize: 12,
  },
  progLine: {
    flex: 1,
    height: 1.5,
    marginTop: 15,
  },
  progLineDone: {
    backgroundColor: C.amber,
  },

  // Current stop block
  curStopBlock: {
    backgroundColor: C.progressBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  curStopLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.textSec,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  curStopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  curPhoto: {
    width: 90,
    height: 82,
    borderRadius: 10,
    flexShrink: 0,
    // Replace with actual place photo: <Image source={{ uri: place.photo }} ... />
  },
  curInfo: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  curCatPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    height: 22,
    paddingHorizontal: 10,
    paddingLeft: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  curCatText: {
    fontFamily: F.semi,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  curPlaceName: {
    fontFamily: F.serif,
    fontSize: 18,
    color: C.textPrimary,
    lineHeight: 22,
  },
  curNeighborhood: {
    fontFamily: F.reg,
    fontSize: 11,
    color: C.textSec,
  },
  curHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Next up
  nextUpRow: {
    backgroundColor: C.nextUpBg,
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  nextUpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  nextUpCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    flexShrink: 0,
  },
  nextUpText: {
    flex: 1,
    minWidth: 0,
  },
  nextUpLabel: {
    fontFamily: F.semi,
    fontSize: 9,
    color: C.textSec,
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
    backgroundColor: C.amber,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  directionsBtnText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: '#FFFFFF',
  },

  // Prev stop
  prevStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  prevStopText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textPrimary,
  },

  // Next stop button
  nextStopBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: C.fabTop,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nextStopBtnText: {
    fontFamily: F.semi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  seeDetailsText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textPrimary,
    textAlign: 'center',
  },

  // ── Bottom Nav ──
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navLabel: {
    fontFamily: F.reg,
    fontSize: 10,
    color: C.textTert,
  },
  navLabelActive: {
    fontFamily: F.semi,
    color: C.amberNav,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    top: -30,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(180,95,20,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
