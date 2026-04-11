import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { MapFlyTo } from "@/components/MapView";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { TopNavbar } from "@/components/TopNavbar";
import { MapView } from "@/components/MapView";
import { ChatPanel } from "@/components/ChatPanel";
import { type ScenarioId } from "@/data/mapData";
import { useAuthStore } from "@/lib/authStore";
import { getActiveLayersFromPriorities, getMappedCategoryIds } from "@/lib/priorityLayerMapping";
import { useMapCategories } from "@/hooks/useMapData";

export default function MapLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, hasCompletedOnboarding, priorities } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
    }
  }, [isLoggedIn, hasCompletedOnboarding, navigate]);

  const [activeScenario, setActiveScenario] = useState<ScenarioId>("realitaet");
  const [isPlacingInitiative, setIsPlacingInitiative] = useState(false);

  const { data: categoryData } = useMapCategories();
  const allCategoryIds = useMemo(
    () => categoryData?.allCategories.map((c) => c.id) ?? [],
    [categoryData]
  );

  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const flyToRef = useRef<MapFlyTo | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    if (hasCompletedOnboarding && allCategoryIds.length > 0) {
      const activeLayers = getActiveLayersFromPriorities(priorities);
      if (activeLayers.size > 0) {
        const mappedIds = getMappedCategoryIds();
        setDisabledCategories(
          new Set(allCategoryIds.filter((id) => mappedIds.has(id) && !activeLayers.has(id)))
        );
      }
      initializedRef.current = true;
    }
  }, [hasCompletedOnboarding, allCategoryIds, priorities]);

  const toggleCategory = useCallback((id: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const enableCategory = useCallback((id: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const disableCategory = useCallback((id: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const showOnlyCategory = useCallback((id: string) => {
    setDisabledCategories(new Set(allCategoryIds.filter((cid) => cid !== id)));
  }, [allCategoryIds]);

  const disableAllCategories = useCallback(() => {
    setDisabledCategories(new Set(allCategoryIds));
  }, [allCategoryIds]);

  const isMapPage = location.pathname === "/";
  const hasOverlay = !isMapPage; // sub-pages get the glass overlay

  return (
    <div className="h-screen w-full overflow-hidden bg-background flex flex-col">
      <TopNavbar onNewInitiative={() => {
        if (location.pathname !== "/") navigate("/");
        setIsPlacingInitiative(true);
      }} />

      {/* Persistent map - always rendered */}
      <main className="flex-1 relative min-h-0">
        <MapView
          activeScenario={activeScenario}
          onScenarioChange={setActiveScenario}
          disabledCategories={disabledCategories}
          onToggleCategory={toggleCategory}
          isPlacingInitiative={isPlacingInitiative}
          onSetPlacingInitiative={setIsPlacingInitiative}
          flyToRef={flyToRef}
        />

        {/* Chat panel only on map page */}
        {isMapPage && (
          <ChatPanel
            activeScenario={activeScenario}
            disabledCategories={disabledCategories}
            onEnableCategory={enableCategory}
            onDisableCategory={disableCategory}
            onShowOnlyCategory={showOnlyCategory}
            onDisableAllCategories={disableAllCategories}
            onScenarioChange={setActiveScenario}
            onFlyTo={(lat, lng, zoom) => flyToRef.current?.(lat, lng, zoom)}
          />
        )}

        {/* Overlay pages (Initiative, Abonnements) */}
        {hasOverlay && (
          <div className="absolute inset-0 z-[45] flex flex-col">
            {/* Frosted glass backdrop */}
            <div className="absolute inset-0 backdrop-blur-md bg-background/60" />
            {/* Page content */}
            <div className="relative z-[1] overflow-y-auto h-full pt-[72px]">
              <Outlet />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
