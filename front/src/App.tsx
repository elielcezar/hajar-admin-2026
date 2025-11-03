import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Properties from "./pages/admin/Properties";
import PropertyForm from "./pages/admin/PropertyForm";
import Users from "./pages/admin/Users";
import UserForm from "./pages/admin/UserForm";
import Profile from "./pages/admin/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="imoveis" element={<Properties />} />
            <Route path="imoveis/novo" element={<PropertyForm />} />
            <Route path="imoveis/:id/editar" element={<PropertyForm />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="usuarios/novo" element={<UserForm />} />
            <Route path="usuarios/:id/editar" element={<UserForm />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
