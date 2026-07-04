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
 *
 * The homeState variable ('A' | 'B' | 'C') will eventually come from
 * your app-level state/context (Redux, Zustand, etc.). For now it's local.
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
  Coffee,
  Heart,
  Home,
  Leaf,
  MapPin,
  Moon,
  Navigation,
  Palette,
  Sparkles,
  User,
  Users,
  Utensils,
} from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentOutingName } from './_outing-store';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────

const C = {
  bg:          '#F3EDE4',
  card:        '#FFFFFF',
  amber:       '#B86820',
  amberNav:    '#C8841F',
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
  nextUpBg:    '#F3EDE4',
  mapGreen:    '#4A7A5A',
  // Category colours
  eat:         '#B84E38',
  coffee:      '#6B4530',
  outdoors:    '#3A6445',
  arts:        '#5C4080',
  experiences: '#2A7080',
  nightlife:   '#2A1F4E',
  markets:     '#A0622A',
};

const F = {
  serif:  'LibreBaskerville_700Bold',
  reg:    'PlusJakartaSans_400Regular',
  med:    'PlusJakartaSans_500Medium',
  semi:   'PlusJakartaSans_600SemiBold',
};

// ─────────────────────────────────────────
//  SAMPLE DATA  (replace with API / state)
// ─────────────────────────────────────────

const SCOUT_SUGGESTION = {
  name: 'DC Art & Coffee Loop',
  vibeTags: ['Artsy', 'Walkable', 'Cultural'],
  stopCount: 4,
  stops: [
    { category: 'Coffee & Cafés',  place: 'Compass Coffee',    neighborhood: 'Shaw',       color: C.coffee  },
    { category: 'Arts & Culture',  place: 'Hirshhorn Museum',  neighborhood: 'The Mall',   color: C.arts    },
    { category: 'Outdoors',        place: 'National Mall',     neighborhood: 'Downtown',   color: C.outdoors},
    { category: 'Eat & Drink',     place: 'The Dabney',        neighborhood: 'Shaw',       color: C.eat     },
  ],
};

const CURRENT_DRAFT = {
  name: 'City Coffee Crawl',
  dateLabel: 'Sat, May 17',
  stopCount: 3,
  stopColors: [C.coffee, C.eat, C.arts],
  extraStops: 2,
};

const OTHER_DRAFT_COUNT = 2;

const ACTIVE_OUTING = {
  name: 'Spring Art & Park Walk',
  startTime: '9:14 AM',
  totalStops: 5,
  completedStops: 2,
  currentStop: {
    label: 'CURRENT STOP 3 OF 5',
    place: 'National Gallery of Art',
    neighborhood: 'National Mall',
    categoryLabel: 'ARTS & CULTURE',
    categoryColor: C.arts,
  },
  nextStop: {
    label: 'NEXT UP · STOP 4',
    place: 'Dumbarton Oaks',
    categoryColor: C.outdoors,
  },
};

const FOR_YOU_PLACES = [
  { id: '1', name: 'The Dabney',        neighborhood: 'Shaw',             price: '$$$',  color: C.eat,        catLabel: 'EAT & DRINK'     },
  { id: '2', name: 'Slipstream Coffee', neighborhood: 'Columbia Heights', price: '$$',   color: C.coffee,     catLabel: 'COFFEE & CAFÉS'  },
  { id: '3', name: 'Hirshhorn Museum',  neighborhood: 'The Mall',         price: 'Free', color: C.arts,       catLabel: 'ARTS & CULTURE'  },
  { id: '4', name: 'Rock Creek Park',   neighborhood: 'Northwest DC',     price: 'Free', color: C.outdoors,   catLabel: 'OUTDOORS'        },
  { id: '5', name: 'Flash Nightclub',   neighborhood: 'Penn Quarter',     price: '$$',   color: C.nightlife,  catLabel: 'NIGHTLIFE'       },
];

const SAVED_PLACE_COUNT = 4; // >= 3 shows Build Around card
type ForYouPlace = {
  id: string;
  name: string;
  neighborhood: string;
  price: string;
  color: string;
  catLabel: string;
};

type PressHandlerProps = {
  onPress?: () => void;
};

type ActiveOutingCardProps = {
  onNextStop?: () => void;
  onSeeDetails?: () => void;
};

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

function getCatIcon(catLabel: string): React.ComponentType<{ size: number; color: string }> {
  if (catLabel.includes('EAT') || catLabel.includes('DRINK')) return Utensils;
  if (catLabel.includes('COFFEE'))                            return Coffee;
  if (catLabel.includes('ARTS') || catLabel.includes('CULTURE')) return Palette;
  if (catLabel.includes('OUTDOORS'))                          return Leaf;
  if (catLabel.includes('NIGHTLIFE'))                         return Moon;
  return MapPin;
}

/** For You card — 160 × 232 */
function ForYouCard({ item }: { item: ForYouPlace }) {
  const [saved, setSaved] = useState(false);
  const CatIcon = getCatIcon(item.catLabel);
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
          <Text style={styles.fyCatText} numberOfLines={1}>{item.catLabel}</Text>
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
          <Text style={styles.fyPrice}>{item.price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
//  SCOUT CARD  (State A primary card)
// ─────────────────────────────────────────

function ScoutCard({ onPress, overrideName }: PressHandlerProps & { overrideName?: string }) {
  const { vibeTags, stopCount, stops } = SCOUT_SUGGESTION;
  const name = overrideName ?? SCOUT_SUGGESTION.name;
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
        {/* Dashed connector line behind circles */}
        <View style={styles.stopConnector} />
        {stops.map((stop) => (
          <View key={stop.place}>
            <View style={styles.stopRow}>
              <View style={[styles.stopCircle, { backgroundColor: stop.color }]} />
              <View style={styles.stopTextBlock}>
                <Text style={styles.stopCategoryLabel}>{stop.category}</Text>
                <Text style={styles.stopPlaceName}>{stop.place}</Text>
              </View>
              <Text style={styles.stopNeighborhood}>{stop.neighborhood}</Text>
            </View>
            <View style={styles.stopDivider} />
          </View>
        ))}
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

function ForYouSection() {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>For You</Text>
        <Text style={styles.seeAll}>See all ›</Text>
      </View>
      <FlatList
        data={FOR_YOU_PLACES}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fyRow}
        renderItem={({ item }) => <ForYouCard item={item} />}
        snapToInterval={170} // card width 160 + gap 10
        decelerationRate="fast"
      />
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

function OutingDraftCard({ onPress }: PressHandlerProps) {
  const { name, dateLabel, stopCount, stopColors, extraStops } = CURRENT_DRAFT;
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
          <View style={[styles.draftStopCircle, styles.draftStopExtra, { marginLeft: -8 }]}>
            <Text style={styles.draftExtraText}>+{extraStops}</Text>
          </View>
        </View>
      </Pressable>

      {/* View draft list — outside card, below it */}
      {OTHER_DRAFT_COUNT >= 1 && (
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
              <Text style={[
                styles.progLabel,
                (isDone || isCurrent) ? { color: C.amber } : { color: C.textTert },
              ]}>
                {i + 1}
              </Text>
            </View>
            {i < total - 1 && (
              <View style={[styles.progLine, i < completed ? styles.progLineDone : styles.progLineUpcoming]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function ActiveOutingCard({ onNextStop, onSeeDetails }: ActiveOutingCardProps) {
  const { name, startTime, totalStops, completedStops, currentStop, nextStop } = ACTIVE_OUTING;
  const [stopSaved, setStopSaved] = useState(false);

  return (
    <View style={[styles.card, styles.activeCard]}>
      {/* Top row */}
      <View style={styles.activeTopRow}>
        <View style={styles.activeLabelRow}>
          <AmberDot pulse />
          <Text style={styles.activeLabelText}>ACTIVE OUTING</Text>
        </View>
        <Text style={styles.activeStartTime}>Started {startTime}</Text>
      </View>

      {/* Outing name */}
      <Text style={styles.activeOutingName} numberOfLines={1}>{name}</Text>

      {/* Progress strip */}
      <ProgressStrip total={totalStops} completed={completedStops} />

      {/* Current stop block */}
      <View style={styles.curStopBlock}>
        <Text style={styles.curStopLabel}>{currentStop.label}</Text>
        <View style={styles.curStopRow}>
          {/* Photo placeholder */}
          <View style={[styles.curPhoto, { backgroundColor: currentStop.categoryColor }]} />
          {/* Info */}
          <View style={styles.curInfo}>
            <View style={[styles.curCatPill, { backgroundColor: currentStop.categoryColor }]}>
              <Text style={styles.curCatText}>{currentStop.categoryLabel}</Text>
            </View>
            <Text style={styles.curPlaceName}>{currentStop.place}</Text>
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
      <View style={styles.nextUpRow}>
        <View style={styles.nextUpLeft}>
          <View style={[styles.nextUpCircle, { backgroundColor: nextStop.categoryColor }]} />
          <View>
            <Text style={styles.nextUpLabel}>{nextStop.label}</Text>
            <Text style={styles.nextUpPlace}>{nextStop.place}</Text>
          </View>
        </View>
        <Pressable style={styles.directionsBtn} onPress={() => {}}>
          <Navigation size={12} color={C.amber} />
          <Text style={styles.directionsBtnText}>Directions</Text>
        </Pressable>
      </View>

      {/* Previous stop — hidden on stop 1 */}
      {completedStops >= 1 && (
        <Pressable style={styles.prevStop} onPress={() => {}}>
          <ArrowLeft size={14} color={C.textTert} />
          <Text style={styles.prevStopText}>Previous stop</Text>
        </Pressable>
      )}

      {/* Next Stop button */}
      <Pressable style={styles.nextStopBtn} onPress={onNextStop}>
        <Text style={styles.nextStopBtnText}>Next Stop  →</Text>
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

function BottomNav({ activeTab = 'Home' }) {
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
              <Pressable style={styles.fab}>
                <Sparkles size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.navLabel}>Outing</Text>
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
  // 'A' = no outing · 'B' = draft in progress · 'C' = active outing
  const [homeState, setHomeState] = useState('A');
  const [currentOutingName, setCurrentOutingName] = useState(getCurrentOutingName());

  useFocusEffect(
    useCallback(() => {
      setCurrentOutingName(getCurrentOutingName());
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

  if (!fontsLoaded && !fontError) return null;

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

        {/* ── STATE A: Scout suggestion ── */}
        {homeState === 'A' && (
          <ScoutCard onPress={() => router.push('/outing-preview')} overrideName={currentOutingName} />
        )}

        {/* ── STATE B: Draft + Scout also suggests ── */}
        {homeState === 'B' && (
          <>
            <OutingDraftCard onPress={() => router.push('/outing-preview')} />
            {/* Full Scout card below the label */}
            <ScoutCard onPress={() => router.push('/outing-preview')} overrideName={currentOutingName} />
          </>
        )}

        {/* ── STATE C: Active outing hero ── */}
        {homeState === 'C' && (
          <ActiveOutingCard
            onNextStop={() => {/* navigate to Active Outing Detail */}}
            onSeeDetails={() => {/* navigate to Active Outing Detail */}}
          />
        )}

        {/* For You — always shown */}
        <ForYouSection />

        {/* Build Around — shown when user has 3+ saved places */}
        <BuildAroundCard />

        {/* DEV ONLY: state switcher — remove before shipping */}
        <View style={styles.devSwitcher}>
          {['A', 'B', 'C'].map(s => (
            <Pressable
              key={s}
              style={[styles.devBtn, homeState === s && styles.devBtnActive]}
              onPress={() => setHomeState(s)}
            >
              <Text style={[styles.devBtnText, homeState === s && { color: '#fff' }]}>
                State {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <BottomNav activeTab="Home" />
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
    marginBottom: 6,
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
    marginBottom: 10,
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
    position: 'relative',
  },
  stopConnector: {
    position: 'absolute',
    left: 19,     // center of 40px circle
    top: 20,
    bottom: 20,
    width: 2,
    borderStyle: 'dashed',
    borderLeftWidth: 2,
    borderColor: '#D0C8C0',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 12,
  },
  stopCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
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
  stopNeighborhood: {
    fontFamily: F.reg,
    fontSize: 10,
    color: C.textTert,
    textAlign: 'right',
    flexShrink: 0,
  },
  stopDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginLeft: 52,   // indent past circle
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
    color: C.textSec,
  },
  fyRow: {
    paddingRight: 14,
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
    height: 84,
  },
  fyNameWrap: {
    height: 35,
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
    backgroundColor: C.divider,
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
    marginBottom: 8,
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
    marginBottom: 10,
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
    marginBottom: 14,
  },
  progNodeWrap: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  progNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    borderWidth: 1.5,
    borderColor: C.border,
  },
  progNodeText: {
    fontFamily: F.semi,
    fontSize: 11,
  },
  progLabel: {
    fontFamily: F.semi,
    fontSize: 10,
  },
  progLine: {
    flex: 1,
    height: 1.5,
    marginTop: 14, // centers with node (28px / 2 = 14)
  },
  progLineDone: {
    backgroundColor: C.amber,
  },
  progLineUpcoming: {
    backgroundColor: C.border,
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
    color: C.textTert,
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
  },
  nextUpCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  directionsBtnText: {
    fontFamily: F.semi,
    fontSize: 10,
    color: C.amber,
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
    color: C.textSec,
  },

  // Next stop button
  nextStopBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: C.amber, // replace with LinearGradient for the full gradient
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // For gradient: wrap in expo-linear-gradient <LinearGradient colors={[C.fabTop, C.fabBottom]} start={{x:0,y:0}} end={{x:1,y:1}}>
  },
  nextStopBtnText: {
    fontFamily: F.semi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  seeDetailsText: {
    fontFamily: F.reg,
    fontSize: 12,
    color: C.textSec,
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
    backgroundColor: C.amber, // replace with LinearGradient
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(180,95,20,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.48,
    shadowRadius: 18,
    elevation: 8,
  },

  // ── Dev switcher (remove before shipping) ──
  devSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    justifyContent: 'center',
  },
  devBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDE8E2',
  },
  devBtnActive: {
    backgroundColor: C.textPrimary,
  },
  devBtnText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.textPrimary,
  },
});
