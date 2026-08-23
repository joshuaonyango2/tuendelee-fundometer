import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import JoinEvent from "./pages/JoinEvent";
import ImpactStoriesPage from "./pages/ImpactStoriesPage";
import EventRoom from "./pages/EventRoom";
import MeetingRoom from "./pages/MeetingRoom";
import EventManagement from "./pages/EventManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/join" element={<JoinEvent />} />
          <Route path="/event/:eventId" element={<EventRoom />} />
          <Route path="/event/:eventId/manage" element={<EventManagement />} />
          <Route path="/meeting/:platform/:meetingId" element={<MeetingRoom />} />
          <Route path="/meeting/room/:meetingId" element={<MeetingRoom />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
