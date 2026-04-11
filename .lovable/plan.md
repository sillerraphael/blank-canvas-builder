
Goal: make subscriptions reliably use the real Supabase-authenticated user instead of stale local mock state, then verify whether any remaining issue is backend RLS/schema related.

What I found
- The strongest root cause is a user ID mismatch.
- Network logs show the active Supabase session token belongs to user `2b1661ea-ac06-4817-a191-c27e74be8fe7`.
- But the app still queries subscriptions with `user_id=eq.00000000-0000-0000-0000-000000000001`.
- That hardcoded UUID comes from `MOCK_USER` in `src/lib/authStore.ts`.
- So the subscription hooks are currently reading `bayernUser.id` from localStorage/Zustand instead of deriving identity from the real Supabase session.
- This explains why reads come back empty and why inserts likely fail with RLS when clicking “Abonnieren”.

Why it still breaks after the earlier login changes
- `useSubscriptions()` and `useToggleSubscription()` use `useAuthStore().bayernUser?.id`.
- `authStore` initializes from localStorage only and has no `supabase.auth.getSession()` / `onAuthStateChange()` sync.
- If old mock data remains in `bayern_id_user`, the UI thinks you are logged in, but subscriptions operate against the wrong UUID.
- The current login UI may set the correct user after a fresh login, but stale local auth can still win on reload/startup.

Implementation plan
1. Replace local-only auth identity with Supabase session syncing
- Update `src/lib/authStore.ts` to support initializing from the actual Supabase session.
- Add a small session-sync flow based on:
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange(...)`
- Keep display data in the store if needed, but source the canonical user ID from Supabase auth, not the mock user.
- On logout, clear local store and Supabase session consistently.

2. Remove subscription dependence on stale `bayernUser.id`
- Update `src/hooks/useSubscriptions.ts` so fetch/insert/delete use the authenticated Supabase user ID.
- Best approach: read `session.user.id` from Supabase-backed auth state, not from a manually persisted mock object.
- Keep the `user_id` insert explicit so it satisfies common RLS patterns.

3. Harden login-state gating in the UI
- Update components that check `isLoggedIn`/`hasCompletedOnboarding` so they don’t show logged-in subscription UI when there is no real Supabase session.
- Review:
  - `src/components/TopNavbar.tsx`
  - `src/components/MapView.tsx`
  - `src/pages/Subscriptions.tsx`
  - `src/components/MapLayout.tsx`

4. Preserve onboarding/location without breaking auth
- Keep onboarding completion and saved location as app state/local preferences.
- Separate those concerns from authenticated identity so a stored location cannot override the real user ID.

5. Improve subscription error visibility
- Replace the generic toast in `src/components/MapView.tsx` with the actual Supabase error message when available.
- This will expose whether any remaining problem is RLS, FK, duplicate key, or missing row.

6. Verify whether a backend issue remains
- After the frontend fix, test subscription requests again.
- If inserts still fail, the remaining issue is almost certainly in Supabase:
  - missing/incorrect RLS policy on `subscriptions`
  - nullable or mismatched `user_id`
  - FK mismatch on `event_id`
  - unique constraint/duplicate behavior
- I could not inspect the Supabase table schema from this read-only session because schema access failed, so backend verification is currently out of scope until implementation/testing mode or DB access is available.

Likely backend policy to confirm if needed
- `subscriptions.user_id` should be non-null UUID.
- Typical insert/select/delete RLS should align with `auth.uid() = user_id`.
- If not already present, that backend fix may still be required after the frontend sync.

Files most likely to change
- `src/lib/authStore.ts`
- `src/hooks/useSubscriptions.ts`
- `src/components/MapView.tsx`
- `src/components/TopNavbar.tsx`
- `src/pages/BayernIDLogin.tsx`
- `src/pages/Subscriptions.tsx`
- possibly `src/components/MapLayout.tsx`

Technical note
```text
Current bad flow:
localStorage mock user -> authStore.bayernUser.id -> subscriptions query/insert

Target flow:
Supabase session user.id -> authStore synced state -> subscriptions query/insert
                      \
                       local prefs only for onboarding/location
```

Out of scope / blocked right now
- I cannot directly edit the code in this read-only mode.
- I also could not fetch the Supabase table schema, so I cannot confirm the exact RLS policy from here.

Success criteria
- Subscription GET requests use the same UUID as the Supabase bearer token user.
- Clicking “Abonnieren” creates a row successfully.
- Refreshing the page does not revert to the mock UUID.
- If a failure remains, the toast surfaces the exact Supabase error so the backend issue can be fixed immediately.
