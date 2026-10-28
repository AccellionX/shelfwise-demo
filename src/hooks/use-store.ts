"use client";

import { useSyncExternalStore } from "react";
import { getState, subscribe } from "@/lib/store";
import type { AppState } from "@/lib/types";

/** Cached SSR snapshot; must be referentially stable. */
const SERVER_SNAPSHOT: AppState = {
  version: 1,
  seededAt: "",
  settings: {
    shopName: "Harbour Lane Books",
    defaultReorderPoint: 3,
    genres: [],
    shelfLocations: [],
    demoBannerDismissed: true,
  },
  suppliers: [],
  books: [],
  sales: [],
  movements: [],
  reorderList: [],
};

function getServerSnapshot(): AppState {
  return SERVER_SNAPSHOT;
}

const getClientHydrated = () => true;
const getServerHydrated = () => false;

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerSnapshot);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientHydrated, getServerHydrated);
}
