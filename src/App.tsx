import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import Product from "./pages/Product";
import UseCases from "./pages/UseCases";
import SDK from "./pages/SDK";
import Publishers from "./pages/Publishers";
import Advertisers from "./pages/Advertisers";
import Company from "./pages/Company";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Admin from "./pages/Admin";
import Docs from "./pages/Docs";
import AppLogin from "./pages/AppLogin";
import ChooseWorkspace from "./pages/ChooseWorkspace";
import AdvertiserPortal from "./pages/AdvertiserPortal";
import PublisherPortal from "./pages/PublisherPortal";
import AdminPortal from "./pages/AdminPortal";
import { PortalAuthProvider } from "@/components/portal/PortalAuthProvider";
import {
  RequirePortalLogin,
  RequireWorkspaceRole,
  RequireWorkspaceSelection,
} from "@/components/portal/PortalRouteGuards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PortalAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/product" element={<Product />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/publishers" element={<Publishers />} />
            <Route path="/advertisers" element={<Advertisers />} />
            <Route path="/sdk" element={<SDK />} />
            <Route path="/company" element={<Company />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/admin" element={<Admin />} />

            <Route path="/app/login" element={<AppLogin />} />
            <Route path="/app" element={<Navigate to="/app/login" replace />} />

            <Route element={<RequirePortalLogin />}>
              <Route path="/app/choose-workspace" element={<ChooseWorkspace />} />

              <Route element={<RequireWorkspaceSelection />}>
                <Route element={<RequireWorkspaceRole role="advertiser" />}>
                  <Route path="/app/advertiser" element={<AdvertiserPortal />} />
                </Route>
                <Route element={<RequireWorkspaceRole role="publisher" />}>
                  <Route path="/app/publisher" element={<PublisherPortal />} />
                </Route>
                <Route element={<RequireWorkspaceRole role="admin" />}>
                  <Route path="/app/admin" element={<AdminPortal />} />
                </Route>
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PortalAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
