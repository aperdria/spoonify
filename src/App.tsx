
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AddRecipe from "./pages/AddRecipe";
import RecipeView from "./pages/RecipeView";
import TagManager from "./pages/TagManager";
import GroceryBasket from "./pages/GroceryBasket";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get the base path for routing - this should match the Vite base config
const getBasename = () => {
  // In development, no basename needed
  if (import.meta.env.DEV) {
    return '';
  }
  // In production on GitHub Pages, use the repository name
  return '/spoonify';
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/recipe/add" element={<AddRecipe />} />
          <Route path="/recipe/:id" element={<RecipeView />} />
          <Route path="/tags" element={<TagManager />} />
          <Route path="/basket" element={<GroceryBasket />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
