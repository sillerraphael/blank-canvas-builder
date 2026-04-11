import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import MapLayout from "./components/MapLayout";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import CommunityInitiatives from "./pages/CommunityInitiatives.tsx";
import Subscriptions from "./pages/Subscriptions.tsx";
import BayernIDLogin from "./pages/BayernIDLogin.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function SessionSync() {
  useSupabaseSession();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionSync />
      <BrowserRouter>
        <Routes>
          {/* Routes with persistent map background */}
          <Route element={<MapLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/initiativen" element={<CommunityInitiatives />} />
            <Route path="/abonnements" element={<Subscriptions />} />
          </Route>
          {/* Standalone routes */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/bayernid-login" element={<BayernIDLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
