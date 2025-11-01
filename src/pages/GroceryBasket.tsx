
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, Check, ArrowLeft, Plus, Minus, ClipboardCheck, 
  PlusCircle, RefreshCw, Search, Share2, Link, X 
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  getCurrentBasket, 
  removeRecipeFromBasket,
  updateItemChecked, 
  clearCheckedItems,
  clearBasket,
  shareBasket
} from '@/services/basketService';
import { GroceryBasket, GroceryItem } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GroceryBasketPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  // Maintain a stable item order so toggling checked state doesn't reorder the list
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'category' | 'recipe'>('category');
  
  // Get current basket
  const { 
    data: basket, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['basket'],
    queryFn: getCurrentBasket
  });
  
  // Build a map of items for quick lookup
  const itemMap = (basket?.items || []).reduce<Record<string, GroceryItem>>((m, it) => {
    m[it.id] = it;
    return m;
  }, {});

  // Initialize and maintain stable item order derived from server items.
  // We preserve existing order across refetches and only append new items at the end.
  useEffect(() => {
    if (!basket) return;
    const ids = basket.items.map(i => i.id);
    if (itemOrder.length === 0) {
      setItemOrder(ids);
      return;
    }
    // Keep previous order for IDs still present, append any new IDs
    const kept = itemOrder.filter(id => ids.includes(id));
    const appended = ids.filter(id => !itemOrder.includes(id));
    const merged = [...kept, ...appended];
    // If items were removed, ensure merged equals current ids order with kept first
    if (JSON.stringify(merged) !== JSON.stringify(itemOrder)) {
      setItemOrder(merged);
    }
  }, [basket]);

  // Group items by category using stable itemOrder
  const groupedItemsByCategory = (itemOrder || []).reduce<Record<string, GroceryItem[]>>((acc, id) => {
    const item = itemMap[id];
    if (!item) return acc;
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}) || {};

  // Group items by recipe using stable itemOrder
  const groupedItemsByRecipe = (itemOrder || []).reduce<Record<string, GroceryItem[]>>((acc, id) => {
    const item = itemMap[id];
    if (!item) return acc;
    item.recipeIds.forEach(recipeId => {
      if (!acc[recipeId]) acc[recipeId] = [];
      if (!acc[recipeId].some(existing => existing.id === item.id)) {
        acc[recipeId].push(item);
      }
    });
    return acc;
  }, {}) || {};
  
  // Sort categories and filter items by search term
  const sortedCategories = Object.keys(groupedItemsByCategory).sort();
  // Filter items but preserve stable order
  const filteredItems = (itemOrder || [])
    .map(id => itemMap[id])
    .filter(Boolean)
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Handle removing recipe from basket
  const removeRecipeMutation = useMutation({
    mutationFn: (recipeId: string) => removeRecipeFromBasket(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      toast({
        title: "Recipe removed",
        description: "Recipe has been removed from your basket",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove recipe from basket",
        variant: "destructive",
      });
    }
  });
  
  // Handle updating item checked status
  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string, checked: boolean }) => 
      updateItemChecked(itemId, checked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] });
    }
  });
  
  // Handle clearing checked items
  const clearCheckedMutation = useMutation({
    mutationFn: (basketId: string) => clearCheckedItems(basketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      toast({
        title: "Cleared checked items",
        description: "All checked items have been removed from your basket",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear checked items",
        variant: "destructive",
      });
    }
  });
  
  // Handle clearing the entire basket
  const clearBasketMutation = useMutation({
    mutationFn: (basketId: string) => clearBasket(basketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      toast({
        title: "Basket cleared",
        description: "Your basket has been emptied",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear basket",
        variant: "destructive",
      });
    }
  });
  
  // Handle sharing the basket
  const shareBasketMutation = useMutation({
    mutationFn: (basketId: string) => shareBasket(basketId),
    onSuccess: (url) => {
      if (url) {
        setShareUrl(url);
        setShareDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate share link",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to share basket",
        variant: "destructive",
      });
    }
  });
  
  const handleShareBasket = () => {
    if (basket?.id) {
      shareBasketMutation.mutate(basket.id);
    }
  };
  
  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      });
    }
  };
  
  // Check if any items are checked
  const hasCheckedItems = basket?.items.some(item => item.checked) || false;
  
  // Count items by status
  const totalItems = basket?.items.length || 0;
  const checkedItems = basket?.items.filter(item => item.checked).length || 0;
  
  // Find recipe by id
  const findRecipe = (recipeId: string) => {
    return basket?.recipes.find(recipe => recipe.id === recipeId);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          
          <Card className="shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <ShoppingCart size={22} />
                  Grocery Basket
                </CardTitle>
                <CardDescription>
                  Manage your grocery list and recipe ingredients
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareBasket}
                  disabled={!basket || basket.recipes.length === 0 || shareBasketMutation.isPending}
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      disabled={!basket || basket.recipes.length === 0}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear entire basket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all recipes and ingredients from your grocery basket.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (basket?.id) {
                            clearBasketMutation.mutate(basket.id);
                          }
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Clear Basket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your basket...</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Could not load your basket</p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </div>
              ) : (
                <>
                  {/* Recipes in basket */}
                  <div>
                    <h3 className="font-medium mb-3">Recipes in Basket ({basket?.recipes.length || 0})</h3>
                    
                    {basket?.recipes && basket.recipes.length > 0 ? (
                      <div className="space-y-3">
                        {basket.recipes.map(recipe => (
                          <div key={recipe.id} className="flex items-center justify-between p-3 rounded-md border">
                            <div className="flex-1">
                              <h4 className="font-medium">{recipe.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {recipe.servings} servings (original: {recipe.originalServings})
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeRecipeMutation.mutate(recipe.id)}
                                disabled={removeRecipeMutation.isPending}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No recipes in your basket yet</p>
                        <Button onClick={() => navigate('/')}>Browse Recipes</Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Shopping list */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Shopping List ({totalItems} items)</h3>
                        <Select 
                          value={viewMode} 
                          onValueChange={(value: 'category' | 'recipe') => setViewMode(value)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="View by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="category">By Category</SelectItem>
                            <SelectItem value="recipe">By Recipe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {checkedItems} of {totalItems} checked
                      </div>
                    </div>
                    
                    {totalItems > 0 ? (
                      <>
                        <div className="mb-4 relative">
                          <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        </div>
                        
                        <div className="flex justify-between mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => {
                              // Mark all items as checked/unchecked
                              const areAllChecked = basket?.items.every(item => item.checked);
                              basket?.items.forEach(item => {
                                toggleItemMutation.mutate({ 
                                  itemId: item.id, 
                                  checked: !areAllChecked 
                                });
                              });
                            }}
                          >
                            <ClipboardCheck size={14} className="mr-2" />
                            {basket?.items.every(item => item.checked) 
                              ? "Uncheck All" 
                              : "Check All"}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            disabled={!hasCheckedItems || clearCheckedMutation.isPending}
                            onClick={() => {
                              if (basket?.id) {
                                clearCheckedMutation.mutate(basket.id);
                              }
                            }}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Clear Checked
                          </Button>
                        </div>
                        
                        {searchTerm ? (
                          // Search results view
                          <div className="space-y-2 mb-6">
                            {filteredItems.length > 0 ? (
                              filteredItems.map(item => (
                                <div 
                                  key={item.id}
                                  className={`flex items-center p-3 rounded-md border
                                    ${item.checked ? 'bg-muted/50' : ''}`}
                                >
                                  <Checkbox 
                                    checked={item.checked} 
                                    onCheckedChange={(checked) => {
                                      toggleItemMutation.mutate({ 
                                        itemId: item.id, 
                                        checked: checked as boolean 
                                      });
                                    }}
                                    className="mr-3"
                                  />
                                  <div className="flex-1">
                                    <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                                      {item.amount && <span className="mr-1">{item.amount}</span>}
                                      {item.unit && <span className="mr-1">{item.unit}</span>}
                                      {item.name}
                                    </span>
                                  </div>
                                  <Badge variant="outline">{item.category || 'Other'}</Badge>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No items matching "{searchTerm}"
                              </div>
                            )}
                          </div>
                        ) : viewMode === 'category' ? (
                          // Categorized view
                          <Accordion type="multiple" defaultValue={sortedCategories} className="space-y-4">
                            {sortedCategories.map(category => (
                              <AccordionItem value={category} key={category} className="border rounded-md px-3">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                  <div className="flex items-center gap-2">
                                    <span>{category}</span>
                                    <Badge variant="secondary">
                                      {groupedItemsByCategory[category].length}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 py-2">
                                    {groupedItemsByCategory[category].map(item => (
                                      <div 
                                        key={item.id}
                                        className={`flex items-center p-2 rounded-md 
                                          ${item.checked ? 'bg-muted/50' : ''}`}
                                      >
                                        <Checkbox 
                                          checked={item.checked} 
                                          onCheckedChange={(checked) => {
                                            toggleItemMutation.mutate({ 
                                              itemId: item.id, 
                                              checked: checked as boolean 
                                            });
                                          }}
                                          className="mr-3"
                                        />
                                        <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                                          {item.amount && <span className="mr-1">{item.amount}</span>}
                                          {item.unit && <span className="mr-1">{item.unit}</span>}
                                          {item.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          // Recipe view
                          <Accordion type="multiple" defaultValue={Object.keys(groupedItemsByRecipe)} className="space-y-4">
                            {Object.entries(groupedItemsByRecipe).map(([recipeId, items]) => {
                              const recipe = findRecipe(recipeId);
                              return (
                                <AccordionItem 
                                  value={recipeId} 
                                  key={recipeId} 
                                  className="border rounded-md px-3"
                                >
                                  <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                      <span>{recipe ? recipe.title : "Unknown Recipe"}</span>
                                      <Badge variant="secondary">
                                        {items.length}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2 py-2">
                                      {items.map(item => (
                                        <div 
                                          key={item.id}
                                          className={`flex items-center p-2 rounded-md 
                                            ${item.checked ? 'bg-muted/50' : ''}`}
                                        >
                                          <Checkbox 
                                            checked={item.checked} 
                                            onCheckedChange={(checked) => {
                                              toggleItemMutation.mutate({ 
                                                itemId: item.id, 
                                                checked: checked as boolean 
                                              });
                                            }}
                                            className="mr-3"
                                          />
                                          <div className="flex-1">
                                            <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                                              {item.amount && <span className="mr-1">{item.amount}</span>}
                                              {item.unit && <span className="mr-1">{item.unit}</span>}
                                              {item.name}
                                            </span>
                                          </div>
                                          <Badge variant="outline">{item.category || 'Other'}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                        <p className="text-muted-foreground">Your shopping list is empty</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Share Dialog */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Grocery Basket</DialogTitle>
                <DialogDescription>
                  Share this link with others to let them see your grocery list
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex items-center gap-2 mt-4">
                <Input value={shareUrl || ''} readOnly />
                <Button variant="secondary" onClick={copyShareLink}>
                  <Link size={14} className="mr-2" />
                  Copy
                </Button>
              </div>
              
              <DialogFooter className="mt-4">
                <Button onClick={() => setShareDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default GroceryBasketPage;
