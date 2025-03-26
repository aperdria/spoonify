
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import TagSelector from '@/components/TagSelector';
import { Tag } from '@/types';
import { extractRecipeFromUrl } from '@/utils/recipeExtractor';

// Mock data for now - will be replaced with real functionality
const MOCK_TAGS: Tag[] = [
  { id: '1', name: 'Vegetarian', count: 15 },
  { id: '2', name: 'Dessert', count: 8 },
  { id: '3', name: 'Quick Meal', count: 12 },
  { id: '4', name: 'Breakfast', count: 6 },
  { id: '5', name: 'Italian', count: 9 },
  { id: '6', name: 'Healthy', count: 14 },
  { id: '7', name: 'Gluten Free', count: 7 },
];

const AddRecipeForm = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a recipe URL to continue",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const extractedRecipe = await extractRecipeFromUrl(url);
      
      if (extractedRecipe) {
        setIsExtracted(true);
        
        // Auto-suggest some tags based on extracted content
        if (extractedRecipe.tags && Array.isArray(extractedRecipe.tags)) {
          setSelectedTags(extractedRecipe.tags);
        } else {
          setSelectedTags(['Dinner', 'Italian']);
        }
        
        toast({
          title: "Recipe extracted",
          description: "We've successfully extracted the recipe details",
        });
      } else {
        toast({
          title: "Extraction failed",
          description: "We couldn't extract the recipe from this URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error extracting recipe:", error);
      toast({
        title: "Extraction error",
        description: "An error occurred while extracting the recipe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = () => {
    // This would save the recipe to storage in production
    
    toast({
      title: "Recipe saved",
      description: "Your recipe has been successfully saved",
    });
    
    // Navigate to the recipe page
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Recipe</CardTitle>
          <CardDescription>
            Enter a URL to extract recipe details automatically, then add tags and save
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Recipe URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="url"
                    placeholder="https://www.example.com/amazing-recipe"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    disabled={isLoading || isExtracted}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <ExternalLink size={16} />
                  </div>
                </div>
                
                <Button 
                  type={isExtracted ? "button" : "submit"} 
                  disabled={isLoading || !url.trim()}
                  variant={isExtracted ? "outline" : "default"}
                  onClick={isExtracted ? () => setIsExtracted(false) : undefined}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : isExtracted ? (
                    "Change URL"
                  ) : (
                    "Extract Recipe"
                  )}
                </Button>
              </div>
            </div>
            
            {isExtracted && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <Label className="text-sm text-muted-foreground">Preview</Label>
                  </div>
                  
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-28 w-28 rounded-md flex-shrink-0" /> 
                      
                      <div className="flex-1 space-y-2 pt-1">
                        <h3 className="font-medium text-lg">Authentic Italian Pasta Carbonara</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          A creamy traditional pasta carbonara with pancetta, eggs, and Parmesan cheese.
                          Simple ingredients transformed into a luxurious sauce coating perfectly al dente spaghetti.
                        </p>
                        <div className="pt-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Prep: 15 min</span>
                            <span>Cook: 20 min</span>
                            <span>Serves: 4</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Tags</Label>
                  <TagSelector
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    availableTags={MOCK_TAGS}
                    canCreateTags={true}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsExtracted(false);
                      setUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="button-glow">
                    Save Recipe
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRecipeForm;
