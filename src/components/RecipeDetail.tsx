
import { useState } from 'react';
import { 
  Clock, Users, BookOpen, Languages, ShoppingCart, 
  Heart, Share2, Printer, ChevronDown, ChevronUp, Star, Edit 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recipe, Ingredient } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { addRecipeToBasket } from '@/services/basketService';
import { translateRecipe } from '@/utils/translator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EditRecipeForm from './EditRecipeForm';

interface RecipeDetailProps {
  recipe: Recipe;
}

const RecipeDetail = ({ recipe }: RecipeDetailProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [servings, setServings] = useState(recipe.servings);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(recipe);
  const [translatedData, setTranslatedData] = useState<Partial<Recipe>>(
    recipe.translatedTitle ? {
      translatedTitle: recipe.translatedTitle,
      translatedDescription: recipe.translatedDescription,
      translatedIngredients: recipe.translatedIngredients,
      translatedSteps: recipe.translatedSteps
    } : {}
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const totalTime = (currentRecipe.prepTime || 0) + (currentRecipe.cookTime || 0);
  
  // Handle translation
  const handleTranslation = async () => {
    if (showTranslation) {
      // Toggle off translation
      setShowTranslation(false);
      return;
    }
    
    // Check if we already have translation data
    if (!currentRecipe.translatedTitle || !currentRecipe.translatedIngredients || !currentRecipe.translatedSteps) {
      setIsTranslating(true);
      try {
        const translation = await translateRecipe(currentRecipe);
        setTranslatedData(translation);
        setShowTranslation(true);
      } catch (error) {
        console.error("Translation error:", error);
        toast({
          title: "Translation failed",
          description: "Could not translate the recipe content",
          variant: "destructive",
        });
      } finally {
        setIsTranslating(false);
      }
    } else {
      // We already have translation data
      setShowTranslation(true);
    }
  };
  
  const handleServingChange = (change: number) => {
    const newServings = servings + change;
    if (newServings > 0 && newServings <= 20) {
      setServings(newServings);
    }
  };
  
  // Add to basket mutation
  const addToBasketMutation = useMutation({
    mutationFn: () => addRecipeToBasket(currentRecipe.id, currentRecipe, servings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket'] });
      toast({
        title: "Added to basket",
        description: `${currentRecipe.title} added with ${servings} servings`,
      });
    },
    onError: (error) => {
      console.error("Error adding to basket:", error);
      toast({
        title: "Error adding to basket",
        description: "There was a problem adding this recipe to your basket",
        variant: "destructive",
      });
    }
  });
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Recipe removed from your favorites" : "Recipe added to your favorites",
    });
  };
  
  const shareRecipe = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Recipe link copied to clipboard",
    });
  };
  
  const printRecipe = () => {
    window.print();
  };
  
  const handleEditRecipe = () => {
    setIsEditModalOpen(true);
  };
  
  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setCurrentRecipe(updatedRecipe);
    queryClient.invalidateQueries({ queryKey: ['recipe', updatedRecipe.id] });
    // Reset translation state if recipe is edited
    if (showTranslation) {
      setShowTranslation(false);
      setTranslatedData({});
    }
  };
  
  // Calculate scale factor for ingredients
  const scale = servings / currentRecipe.servings;
  
  // Determine what to show based on translation state
  const displayTitle = showTranslation && (translatedData.translatedTitle || currentRecipe.translatedTitle) 
    ? (translatedData.translatedTitle || currentRecipe.translatedTitle) 
    : currentRecipe.title;
    
  const displayDescription = showTranslation && (translatedData.translatedDescription || currentRecipe.translatedDescription)
    ? (translatedData.translatedDescription || currentRecipe.translatedDescription)
    : currentRecipe.description;
    
  const displayIngredients = showTranslation && (translatedData.translatedIngredients || currentRecipe.translatedIngredients)
    ? (translatedData.translatedIngredients || currentRecipe.translatedIngredients || [])
    : currentRecipe.ingredients;
    
  const displaySteps = showTranslation && (translatedData.translatedSteps || currentRecipe.translatedSteps)
    ? (translatedData.translatedSteps || currentRecipe.translatedSteps || [])
    : currentRecipe.steps;
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <EditRecipeForm 
        recipe={currentRecipe}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleRecipeUpdated}
      />
      
      <div className="space-y-8 pb-16">
        {/* Hero image and title */}
        <div className="relative">
          <div className="rounded-xl overflow-hidden w-full max-h-[400px] relative mb-6">
            {/* Blur placeholder while image loads */}
            <div 
              className={`absolute inset-0 bg-muted transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              style={{ 
                backgroundImage: `url(${currentRecipe.imageUrl}?blur=true)`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)'
              }}
            />
            
            <img 
              src={currentRecipe.imageUrl} 
              alt={currentRecipe.title} 
              className={`w-full h-[400px] object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          
          <div className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-display font-medium mb-3">{displayTitle}</h1>
            
            <p className="text-muted-foreground mb-4 max-w-3xl">{displayDescription}</p>
            
            {/* Recipe meta info */}
            <div className="flex flex-wrap gap-6 mb-6">
              {totalTime > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock size={18} className="text-muted-foreground" />
                  <span>{totalTime} min</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5">
                <Users size={18} className="text-muted-foreground" />
                <span>Serves {currentRecipe.servings}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Star size={18} className="text-muted-foreground" />
                <span>Medium</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <BookOpen size={18} className="text-muted-foreground" />
                <a 
                  href={currentRecipe.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Original Source
                </a>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {currentRecipe.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-between items-center py-3 border-y">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={toggleFavorite}
            >
              <Heart size={16} className={isFavorite ? "text-primary fill-primary" : ""} />
              <span>{isFavorite ? "Favorited" : "Favorite"}</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={shareRecipe}
            >
              <Share2 size={16} />
              <span>Share</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={printRecipe}
            >
              <Printer size={16} />
              <span>Print</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={handleEditRecipe}
            >
              <Edit size={16} />
              <span>Edit</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showTranslation ? "default" : "outline"} 
              size="sm" 
              className="gap-1.5"
              onClick={handleTranslation}
              disabled={isTranslating}
            >
              <Languages size={16} />
              <span>
                {isTranslating ? "Translating..." : 
                  showTranslation ? "Showing French" : "Show in French"}
              </span>
            </Button>
          </div>
        </div>
        
        {/* Ingredients and Servings */}
        <div className="md:flex gap-12">
          {/* Servings adjuster and add to basket */}
          <div className="w-full md:w-64 mb-8 md:mb-0">
            <div className="rounded-lg border p-4 space-y-4 sticky top-24">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjust servings</label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => handleServingChange(-1)}
                    disabled={servings <= 1}
                  >
                    <ChevronDown size={16} />
                  </Button>
                  <div className="h-8 px-3 flex items-center justify-center border-y">
                    {servings}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => handleServingChange(1)}
                  >
                    <ChevronUp size={16} />
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full gap-2 button-glow" 
                onClick={() => addToBasketMutation.mutate()}
                disabled={addToBasketMutation.isPending}
              >
                <ShoppingCart size={16} />
                <span>{addToBasketMutation.isPending ? "Adding..." : "Add to Basket"}</span>
              </Button>
              
              {/* Nutrition Summary */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Nutrition (per serving)</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calories:</span>
                    <span>350</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protein:</span>
                    <span>12g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carbs:</span>
                    <span>42g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fat:</span>
                    <span>14g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ingredients and Instructions */}
          <div className="flex-1">
            <Tabs defaultValue="ingredients" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ingredients" className="animate-fade-in pt-6">
                <ul className="space-y-2">
                  {displayIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start p-2 border-b last:border-b-0">
                      <span className="mr-2 mt-0.5">•</span>
                      <span>
                        {ingredient.amount && scale !== 1
                          ? (ingredient.amount * scale).toFixed(1).replace(/\.0$/, '')
                          : ingredient.amount
                        } {ingredient.unit} {ingredient.name}
                        {ingredient.notes && <span className="text-muted-foreground ml-1">({ingredient.notes})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="instructions" className="animate-fade-in pt-6">
                <ol className="space-y-4">
                  {displaySteps.map((step, index) => (
                    <li key={index} className="pl-9 relative pb-4">
                      <span className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
