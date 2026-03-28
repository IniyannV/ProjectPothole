/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useAppData } from '../context/AppDataContext';
import { CommunityHotspot } from '../services/userData';
import {
  DEFAULT_DEMO_MAP_LOCATION_ID,
  DEMO_MAP_LOCATIONS,
} from '../src/constants/demoLocations';

type FilterKey = 'all' | 'pothole' | 'rough' | 'good' | 'monitored';

type Hotspot = {
  id: string;
  name: string;
  type: Exclude<FilterKey, 'all'>;
  severity: 'low' | 'medium' | 'high';
  reports: number;
  cost: string;
  color: string;
  coord: [number, number];
  updatedAtMs?: number;
};

type LocationStatus = 'locating' | 'live' | 'denied' | 'error';

const GROUPING_DISTANCE_METERS = 35;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: [number, number], b: [number, number]): number {
  const earthRadius = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function severityRank(value: Hotspot['severity']): number {
  if (value === 'high') {
    return 3;
  }
  if (value === 'medium') {
    return 2;
  }
  return 1;
}

function severityToColor(severity: Hotspot['severity']): string {
  if (severity === 'high') {
    return '#E24B4A';
  }
  if (severity === 'medium') {
    return '#EF9F27';
  }
  return '#378ADD';
}

function coerceHotspot(input: CommunityHotspot): Hotspot {
  return {
    ...input,
    color: severityToColor(input.severity),
  };
}

function groupNearbyHotspots(hotspots: Hotspot[]): Hotspot[] {
  const grouped: Array<Hotspot & { memberCount: number }> = [];

  hotspots.forEach(hotspot => {
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    grouped.forEach((candidate, index) => {
      const distance = distanceMeters(candidate.coord, hotspot.coord);
      if (distance <= GROUPING_DISTANCE_METERS && distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex === -1) {
      grouped.push({
        ...hotspot,
        memberCount: 1,
      });
      return;
    }

    const target = grouped[nearestIndex];
    const nextCount = target.memberCount + 1;
    const targetSeverityRank = severityRank(target.severity);
    const incomingSeverityRank = severityRank(hotspot.severity);
    const nextSeverity =
      incomingSeverityRank > targetSeverityRank
        ? hotspot.severity
        : target.severity;
    const nextType =
      incomingSeverityRank > targetSeverityRank ? hotspot.type : target.type;

    target.coord = [
      (target.coord[0] * target.memberCount + hotspot.coord[0]) / nextCount,
      (target.coord[1] * target.memberCount + hotspot.coord[1]) / nextCount,
    ];
    target.memberCount = nextCount;
    target.reports += hotspot.reports;
    target.severity = nextSeverity;
    target.type = nextType;
    target.color = severityToColor(nextSeverity);
    target.updatedAtMs = Math.max(
      target.updatedAtMs ?? 0,
      hotspot.updatedAtMs ?? 0,
    );
    target.id = `${target.id}|${hotspot.id}`;
    target.name =
      target.memberCount > 1 ? `Grouped ${target.type}` : target.name;
  });

  return grouped.map(item => {
    const { memberCount, ...rest } = item;
    return rest;
  });
}

function makeMapHtml(hotspots: Hotspot[], selectedId: string | null) {
  const hotspotsJson = JSON.stringify(hotspots);
  const selectedJson = selectedId == null ? 'null' : JSON.stringify(selectedId);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
    <style>
      html, body, #map {
        height: 100%;
        margin: 0;
        background: #060c14;
      }
      .maplibregl-canvas {
        outline: none;
      }
      .maplibregl-popup-content {
        background: rgba(8, 14, 22, 0.95);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      }
      .maplibregl-popup-tip {
        border-top-color: rgba(8, 14, 22, 0.95) !important;
        border-bottom-color: rgba(8, 14, 22, 0.95) !important;
      }
      .maplibregl-popup-close-button {
        color: rgba(255, 255, 255, 0.6);
      }
      .map-label {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 1.35;
      }
      .user-dot {
        width: 16px;
        height: 16px;
        border-radius: 8px;
        background: #378ADD;
        border: 2px solid #fff;
        box-shadow: 0 0 20px rgba(55, 138, 221, 0.9);
      }
      .user-ring {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        border: 1px solid rgba(55, 138, 221, 0.5);
        background: rgba(55, 138, 221, 0.14);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/deck.gl@9.0.35/dist.min.js"></script>
    <script>
      const hotspots = ${hotspotsJson};
      const selectedId = ${selectedJson};

      function hexToRgb(hex) {
        const normalized = (hex || '#378ADD').replace('#', '');
        const value = normalized.length === 3
          ? normalized.split('').map((x) => x + x).join('')
          : normalized;
        const int = parseInt(value, 16);
        return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
      }

      const hotspotData = hotspots.map((h) => ({
        ...h,
        position: [h.coord[0], h.coord[1]],
        rgb: hexToRgb(h.color),
      }));

      const maxReports = hotspotData.reduce(
        (max, hotspot) => Math.max(max, hotspot.reports || 0),
        1,
      );

      function reportScale(reports) {
        if (!Number.isFinite(reports) || reports <= 0) {
          return 0;
        }

        // Log scaling keeps very large clusters readable without exploding marker size.
        return Math.min(1, Math.log1p(reports) / Math.log1p(maxReports));
      }

      const map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: hotspotData.length ? hotspotData[0].position : [0, 0],
        zoom: hotspotData.length ? 13.8 : 2,
        pitch: 52,
        bearing: 25,
        antialias: true,
        attributionControl: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
      map.touchZoomRotate.enableRotation();
      map.dragRotate.enable();
      map.touchPitch.enable();

      function createDeckLayers(data, focusedId) {
        return [
          new deck.ScatterplotLayer({
            id: 'hotspot-outer-aura',
            data,
            pickable: false,
            stroked: false,
            radiusUnits: 'pixels',
            getPosition: (d) => d.position,
            getFillColor: (d) => {
              const scale = reportScale(d.reports);
              const alpha = Math.round(30 + scale * 55);
              return [...d.rgb, alpha];
            },
            getRadius: (d) => {
              const scale = reportScale(d.reports);
              const base = 28 + scale * 20;
              return d.id === focusedId ? base * 1.2 : base;
            },
            radiusMinPixels: 28,
            radiusMaxPixels: 64,
            parameters: { depthTest: false },
          }),
          new deck.ScatterplotLayer({
            id: 'hotspot-glow',
            data,
            pickable: false,
            stroked: false,
            radiusUnits: 'pixels',
            getPosition: (d) => d.position,
            getFillColor: (d) => {
              const scale = reportScale(d.reports);
              const alpha = Math.round(74 + scale * 80);
              return [...d.rgb, alpha];
            },
            getRadius: (d) => {
              const scale = reportScale(d.reports);
              const base = 22 + scale * 16;
              return d.id === focusedId ? base * 1.18 : base;
            },
            radiusMinPixels: 20,
            radiusMaxPixels: 50,
            parameters: { depthTest: false },
          }),
          new deck.ScatterplotLayer({
            id: 'hotspot-core',
            data,
            pickable: true,
            autoHighlight: true,
            stroked: true,
            lineWidthUnits: 'pixels',
            lineWidthMinPixels: 1,
            radiusUnits: 'pixels',
            getPosition: (d) => d.position,
            getFillColor: (d) => {
              const scale = reportScale(d.reports);
              if (d.id === focusedId) {
                const alpha = Math.round(236 + scale * 19);
                return [255, 255, 255, alpha];
              }

              const alpha = Math.round(202 + scale * 53);
              return [...d.rgb, alpha];
            },
            getLineColor: () => [255, 255, 255, 210],
            getLineWidth: (d) => (d.id === focusedId ? 3 : 2),
            getRadius: (d) => {
              const scale = reportScale(d.reports);
              const base = 10 + scale * 9;
              return d.id === focusedId ? base * 1.25 : base;
            },
            radiusMinPixels: 10,
            radiusMaxPixels: 26,
            onClick: ({ object }) => {
              if (!object) {
                return;
              }
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'select', id: object.id }),
                );
              }
            },
          }),
          new deck.TextLayer({
            id: 'hotspot-labels',
            data,
            pickable: false,
            getPosition: (d) => d.position,
            getText: (d) => String(d.reports),
            getColor: () => [255, 255, 255, 245],
            sizeUnits: 'pixels',
            getSize: (d) => (d.id === focusedId ? 14 : 13),
            sizeMinPixels: 12,
            sizeMaxPixels: 16,
            getPixelOffset: [0, -24],
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
            fontFamily: 'Arial, sans-serif',
            billboard: true,
            background: true,
            getBackgroundColor: () => [8, 14, 22, 210],
            getBorderColor: () => [255, 255, 255, 80],
            getBorderWidth: 1,
            backgroundPadding: [5, 2],
          }),
        ];
      }

      let userMarker = null;
      let hasCenteredOnUser = false;

      function updateUserLocation(lng, lat, shouldRecenter) {
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return;
        }

        if (!userMarker) {
          const userEl = document.createElement('div');
          userEl.className = 'user-ring';
          const userDot = document.createElement('div');
          userDot.className = 'user-dot';
          userEl.appendChild(userDot);

          userMarker = new maplibregl.Marker({ element: userEl, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map);
        } else {
          userMarker.setLngLat([lng, lat]);
        }

        if (shouldRecenter && !hasCenteredOnUser) {
          hasCenteredOnUser = true;
          map.easeTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 15.2),
            duration: 700,
          });
        }
      }

      window.__updateUserLocation = updateUserLocation;

      map.on('load', () => {
        const deckOverlay = new deck.MapboxOverlay({
          interleaved: true,
          layers: createDeckLayers(hotspotData, selectedId),
          getCursor: ({ isDragging }) => (isDragging ? 'grabbing' : 'grab'),
        });

        map.addControl(deckOverlay);

        if (selectedId != null) {
          const selectedHotspot = hotspotData.find((h) => h.id === selectedId);
          if (selectedHotspot) {
            new maplibregl.Popup({ offset: 16 })
              .setLngLat([selectedHotspot.coord[0], selectedHotspot.coord[1]])
              .setHTML(
                '<div class="map-label"> <b>' + selectedHotspot.name + '</b><br/>' + selectedHotspot.type + ' · ' + selectedHotspot.severity + '<br/>Reports: ' + selectedHotspot.reports + '</div>',
              )
              .addTo(map);
          }
        }

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }
      });

      map.on('click', () => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map-click' }));
        }
      });
    </script>
  </body>
</html>`;
}

export default function MapScreen() {
  const { communityHotspots, isAppDataLoading, appDataError, userData } =
    useAppData();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const hasCenteredOnUserRef = useRef(false);
  const didShowLocationAlertRef = useRef(false);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('locating');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const popupAnim = useRef(new Animated.Value(0)).current;
  const hotspots = useMemo(
    () => groupNearbyHotspots(communityHotspots.map(coerceHotspot)),
    [communityHotspots],
  );
  const debugModeEnabled = userData?.settings.debugMode ?? false;
  const demoMapLocationId =
    userData?.settings.demoMapLocation ?? DEFAULT_DEMO_MAP_LOCATION_ID;
  const selectedDemoLocation = useMemo(
    () =>
      DEMO_MAP_LOCATIONS.find(location => location.id === demoMapLocationId),
    [demoMapLocationId],
  );
  const shouldUseDemoLocation =
    debugModeEnabled && demoMapLocationId !== DEFAULT_DEMO_MAP_LOCATION_ID;

  const filtered = useMemo(
    () => hotspots.filter(h => filter === 'all' || h.type === filter),
    [filter, hotspots],
  );

  useEffect(() => {
    if (selected && !filtered.some(h => h.id === selected.id)) {
      setSelected(null);
      popupAnim.setValue(0);
    }
  }, [filtered, popupAnim, selected]);

  const mapHtml = useMemo(
    () => makeMapHtml(filtered, selected?.id ?? null),
    [filtered, selected?.id],
  );

  useEffect(() => {
    if (shouldUseDemoLocation && selectedDemoLocation) {
      hasCenteredOnUserRef.current = false;
      setLocationStatus('live');
      setUserLocation(selectedDemoLocation.coord);
      return;
    }

    let watchId: number | null = null;
    let isMounted = true;

    const updateFromCoords = (longitude: number, latitude: number) => {
      if (!isMounted) {
        return;
      }

      setLocationStatus('live');

      setUserLocation(prev => {
        if (!prev) {
          return [longitude, latitude];
        }

        const [prevLng, prevLat] = prev;
        if (
          Math.abs(prevLng - longitude) < 0.00001 &&
          Math.abs(prevLat - latitude) < 0.00001
        ) {
          return prev;
        }

        return [longitude, latitude];
      });
    };

    const showLocationAlert = () => {
      if (didShowLocationAlertRef.current) {
        return;
      }

      didShowLocationAlertRef.current = true;
      Alert.alert(
        'Location Permission Needed',
        'Enable location access in Settings to show your live position on the map.',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings().catch(() => {
                // Ignore settings open failures.
              });
            },
          },
        ],
      );
    };

    const startLocationTracking = () => {
      Geolocation.getCurrentPosition(
        pos => {
          updateFromCoords(pos.coords.longitude, pos.coords.latitude);
        },
        err => {
          if (err?.code === 1) {
            setLocationStatus('denied');
            showLocationAlert();
          } else {
            setLocationStatus('error');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );

      watchId = Geolocation.watchPosition(
        pos => {
          updateFromCoords(pos.coords.longitude, pos.coords.latitude);
        },
        err => {
          if (err?.code === 1) {
            setLocationStatus('denied');
            showLocationAlert();
          } else {
            setLocationStatus('error');
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 4000,
          fastestInterval: 2000,
          useSignificantChanges: false,
        },
      );
    };

    const requestLocationAccess = async () => {
      if (Platform.OS === 'ios') {
        const authStatus = Geolocation.requestAuthorization?.() as
          | string
          | undefined;
        if (authStatus === 'denied' || authStatus === 'restricted') {
          setLocationStatus('denied');
          showLocationAlert();
          return;
        } else {
          setLocationStatus('locating');
        }
        startLocationTracking();
        return;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access',
          message:
            'Project Pothole uses your location to place you on the map.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setLocationStatus('locating');
        startLocationTracking();
      } else {
        setLocationStatus('denied');
        showLocationAlert();
      }
    };

    requestLocationAccess();

    return () => {
      isMounted = false;
      if (watchId != null) {
        Geolocation.clearWatch(watchId);
      }
      Geolocation.stopObserving();
    };
  }, [selectedDemoLocation, shouldUseDemoLocation]);

  useEffect(() => {
    if (!isMapReady || !webViewRef.current || !userLocation) {
      return;
    }

    const [lng, lat] = userLocation;
    const shouldRecenter = !hasCenteredOnUserRef.current;
    if (shouldRecenter) {
      hasCenteredOnUserRef.current = true;
    }

    webViewRef.current.injectJavaScript(
      `window.__updateUserLocation && window.__updateUserLocation(${lng}, ${lat}, ${shouldRecenter}); true;`,
    );
  }, [isMapReady, userLocation]);

  function handleSelect(hotspot: Hotspot) {
    setSelected(hotspot);
    Animated.spring(popupAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  }

  function dismissPopup() {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelected(null));
  }

  function onMapMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'select') {
        const hotspot = filtered.find(h => h.id === payload.id);
        if (hotspot) {
          handleSelect(hotspot);
        }
      } else if (payload?.type === 'ready') {
        setIsMapReady(true);
      } else if (payload?.type === 'map-click') {
        dismissPopup();
      }
    } catch {
      // ignore malformed map messages
    }
  }

  const filters: Array<{ key: FilterKey; label: string; color: string }> = [
    { key: 'all', label: 'All', color: '#E24B4A' },
    { key: 'pothole', label: 'Potholes', color: '#E24B4A' },
    { key: 'rough', label: 'Rough', color: '#EF9F27' },
    { key: 'good', label: 'Good', color: '#639922' },
    { key: 'monitored', label: 'Monitor', color: '#378ADD' },
  ];

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => setIsMapReady(false)}
        onMessage={onMapMessage}
      />

      {(isAppDataLoading || appDataError || filtered.length === 0) && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            {isAppDataLoading
              ? 'Loading map data...'
              : appDataError ||
                'No shared reports yet. Start driving to build the map.'}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filtersRow, { top: insets.top + 8 }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              filter === f.key && {
                backgroundColor: f.color + '22',
                borderColor: f.color + '88',
              },
            ]}
          > */}
            <Text
              style={[
                styles.filterText,
                filter === f.key
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.gpsBadge, { top: insets.top + 56 }]}>
        <Text
          style={[
            styles.gpsText,
            shouldUseDemoLocation
              ? styles.gpsDemo
              : locationStatus === 'live'
              ? styles.gpsLive
              : locationStatus === 'locating'
              ? styles.gpsLocating
              : locationStatus === 'denied'
              ? styles.gpsDenied
              : styles.gpsError,
          ]}
        >
          {shouldUseDemoLocation
            ? `Demo: ${selectedDemoLocation?.label ?? 'Selected'}`
            : locationStatus === 'live'
            ? 'Live GPS'
            : locationStatus === 'locating'
            ? 'Locating...'
            : locationStatus === 'denied'
            ? 'Location blocked'
            : 'Location unavailable'}
        </Text>
      </View>

      {selected && (
        <Animated.View
          style={[
            styles.popup,
            {
              opacity: popupAnim,
              transform: [
                {
                  translateY: popupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[styles.popupAccent, { backgroundColor: selected.color }]}
          />
          <View style={styles.popupContent}>
            <View style={styles.popupHeader}>
              <View>
                <Text style={[styles.popupType, { color: selected.color }]}>
                  {selected.type.toUpperCase()}
                </Text>
                <Text style={styles.popupName}>{selected.name}</Text>
              </View>
              <TouchableOpacity onPress={dismissPopup} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.popupGrid}>
              {[
                {
                  label: 'Reports',
                  val: selected.reports,
                  color: selected.color,
                },
                { label: 'Severity', val: selected.severity },
                { label: 'Est. Cost', val: selected.cost },
              ].map(r => (
                <View key={r.label} style={styles.popupStat}>
                  <Text style={styles.popupStatLabel}>{r.label}</Text>
                  <Text
                    style={[styles.popupStatVal, r.color && { color: r.color }]}
                  >
                    {r.val}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060c14' },
  map: { flex: 1 },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: 'rgba(6,12,20,0.9)',
  },
  logo: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 18,
    color: '#E24B4A',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(226,75,74,0.4)',
    backgroundColor: 'rgba(226,75,74,0.08)',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E24B4A' },
  liveText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    color: '#E24B4A',
    letterSpacing: 1,
  },

  statsRow: { position: 'absolute', top: 110, left: 0, right: 0 },
  gpsBadge: {
    position: 'absolute',
    top: 80,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(6,12,20,0.88)',
  },
  gpsText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  gpsLive: { color: '#66D67A' },
  gpsDemo: { color: '#64B5FF' },
  gpsLocating: { color: '#F3BE63' },
  gpsDenied: { color: '#E24B4A' },
  gpsError: { color: '#EF9F27' },
  statChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    backgroundColor: 'rgba(6,12,20,0.85)',
    alignItems: 'center',
  },
  statVal: { fontFamily: 'SpaceMono-Bold', fontSize: 14, fontWeight: '700' },
  statLabel: {
    fontFamily: 'DM Sans',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },

  filtersRow: { position: 'absolute', top: 10, left: 0, right: 0 },
  scrollContent: { paddingHorizontal: 16 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(6,12,20,0.8)',
  },
  filterText: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    letterSpacing: 0.05,
  },
  filterTextActive: { color: '#FFFFFF' },
  filterTextInactive: { color: 'rgba(255,255,255,0.4)' },
  statusBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(8,14,22,0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    textAlign: 'center',
  },

  popup: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,14,22,0.97)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  popupAccent: { height: 2, width: '100%' },
  popupContent: { padding: 16 },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  popupType: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 9,
    letterSpacing: 0.15,
    marginBottom: 3,
  },
  popupName: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeBtn: { padding: 4 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  popupGrid: { flexDirection: 'row', gap: 0 },
  popupStat: { flex: 1, alignItems: 'center' },
  popupStatLabel: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 3,
  },
  popupStatVal: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
});
