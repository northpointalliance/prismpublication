import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PortalAuthProvider } from "@/components/portal/PortalAuthProvider";
import {
  RequirePortalLogin,
  RequireWorkspaceRole,
  RequireWorkspaceSelection,
  RequireAdminAccess,
} from "@/components/portal/PortalRouteGuards";

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

const Index = lazy(() => import("./pages/Index"));
const Demo = lazy(() => import("./pages/Demo"));
const Product = lazy(() => import("./pages/Product"));
const UseCases = lazy(() => import("./pages/UseCases"));
const Publishers = lazy(() => import("./pages/Publishers"));
const Advertisers = lazy(() => import("./pages/Advertisers"));
const Company = lazy(() => import("./pages/Company"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Docs = lazy(() => import("./pages/Docs"));
const Contact = lazy(() => import("./pages/Contact"));
const AppLogin = lazy(() => import("./pages/AppLogin"));
const ChooseWorkspace = lazy(() => import("./pages/ChooseWorkspace"));
const AdvertiserPortal = lazy(() => import("./pages/AdvertiserPortal"));
const PublisherPortal = lazy(() => import("./pages/PublisherPortal"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PortalAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product" element={<Product />} />
              <Route path="/use-cases" element={<UseCases />} />
              <Route path="/publishers" element={<Publishers />} />
              <Route path="/advertisers" element={<Advertisers />} />
              <Route path="/sdk" element={<Navigate to="/demo" replace />} />
              <Route path="/company" element={<Company />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/demo" element={<Demo />} />
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
                </Route>

                <Route element={<RequireAdminAccess />}>
                  <Route path="/notadmin" element={<AdminPortal />} />
                  <Route path="/app/admin" element={<Navigate to="/notadmin" replace />} />
                </Route>
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PortalAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </PayPalScriptProvider>
);

export default App;
