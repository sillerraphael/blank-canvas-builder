# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses **bun** as the package manager.

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun run lint         # ESLint
bun run test         # Run tests once (vitest)
bun run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
bunx vitest run src/test/example.test.ts
```

## Architecture

This is a Munich city-planning map application with a German UI. Users can view map markers and street lines across two scenarios ("realitaet" = current state, "zukunft" = planned future), manage subscriptions to map events, and submit community initiatives.

### Routing & Layout

`MapLayout` is the persistent shell for most routes — the Leaflet map is **always rendered** in the background. Sub-pages (`/liste`, `/initiativen`, `/abonnements`) render as frosted-glass overlays on top of the map via React Router's `<Outlet>`. Standalone routes (`/onboarding`, `/bayernid-login`) bypass `MapLayout` entirely.

Child routes access shared map state (active scenario, disabled categories, flyTo) via `useMapOutletContext()`, which wraps `useOutletContext<MapOutletContext>()`.

### Data Flow

**Map data** is fetched from `https://blog.bauer-jakob.de/api/v1/map` via functions in `src/lib/mapApi.ts`. React Query hooks in `src/hooks/useMapData.ts` wrap these fetches and automatically fall back to static data in `src/data/mapData.ts` when the API fails.

**Community initiatives** are stored entirely in `localStorage` via `src/lib/initiativesStore.ts`.

**Subscriptions** are stored in Supabase (`subscriptions` table). The hooks in `src/hooks/useSubscriptions.ts` always read the user ID from the live Supabase session (`supabase.auth.getSession()`), not from local state, to satisfy RLS policies.

### Auth

`src/lib/authStore.ts` is a Zustand store that holds user identity and preferences. The canonical user ID **must always come from the Supabase session**, not the `MOCK_USER` constant or localStorage. `useSupabaseSession` (rendered as `<SessionSync />` in `App.tsx`) syncs the Supabase session into the store on mount and on auth state changes. The `bayernUser.id` in the store should always equal the Supabase `session.user.id`.

User location and onboarding completion are stored separately in localStorage (keyed by user ID) and are independent of auth identity.

### Key Libraries

- **Leaflet** + **leaflet.markercluster** for the interactive map (`src/components/MapView.tsx`)
- **Zustand** for auth state (`src/lib/authStore.ts`)
- **TanStack Query** for all server data fetching
- **Supabase** client at `src/integrations/supabase/client.ts`
- **shadcn/ui** components live in `src/components/ui/` — do not manually edit these

### Path Aliases

`@/` maps to `src/`. Always use `@/` imports rather than relative paths.
