
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2, Save, AlertCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import TagSelector from '@/components/TagSelector';
import { Tag } from '@/types';
import { extractRecipeFromUrl } from '@/utils/recipeExtractor';
import { saveRecipe } from '@/services/recipeService';
import { useQuery } from '@tanstack/react-query';
import { getAllTags } from '@/services/recipeService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const AddRecipeForm = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [extractedRecipe, setExtractedRecipe] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: availableTags = [], error: tagsError } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags
  });
  
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
    setSaveError(null);
    setExtractionError(null);
    
    try {
      const recipe = await extractRecipeFromUrl(url);
      
      if (recipe) {
        setExtractedRecipe(recipe);
        setIsExtracted(true);
        
        if (recipe.tags && Array.isArray(recipe.tags)) {
          // setSelectedTags(recipe.tags);
          setSelectedTags([]);
        }
        
        if (recipe.title === "Recipe Not Found") {
          setExtractionError("Failed to extract recipe details from the URL. The recipe might not be in a format we can recognize.");
          toast({
            title: "Extraction incomplete",
            description: "We could only extract limited information. You may need to add details manually.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Recipe extracted",
            description: "We've successfully extracted the recipe details",
          });
        }
      } else {
        setExtractionError("The extraction service is currently experiencing issues. Please try again later or enter the recipe details manually.");
        toast({
          title: "Extraction failed",
          description: "We couldn't extract the recipe from this URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error extracting recipe:", error);
      setExtractionError("An unexpected error occurred during extraction. Please check the console logs for more details.");
      toast({
        title: "Extraction error",
        description: "An error occurred while extracting the recipe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!extractedRecipe) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      console.log("Preparing to save recipe");
      
      const recipeToSave = {
        ...extractedRecipe,
        tags: selectedTags
      };
      
      console.log("Recipe to save:", recipeToSave);
      
      const savedRecipe = await saveRecipe(recipeToSave);
      
      console.log("Save result:", savedRecipe);
      
      if (savedRecipe) {
        toast({
          title: "Recipe saved",
          description: "Your recipe has been successfully saved to your collection",
        });
        
        setTimeout(() => {
          navigate(`/recipe/${savedRecipe.id}`);
        }, 500);
      } else {
        throw new Error("Failed to save recipe");
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}`
        : "An error occurred while saving the recipe";
      
      setSaveError(errorMessage);
      
      toast({
        title: "Save error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
                    "Retry"
                  ) : (
                    "Extract Recipe"
                  )}
                </Button>
              </div>
            </div>
            
            {extractionError && (
              <Alert className="my-4 border-orange-400 bg-orange-50 text-orange-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Extraction Issue</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{extractionError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowErrorDetails(true)}
                    className="mt-2"
                  >
                    View Error Details
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {saveError && (
              <Alert variant="destructive" className="my-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Save Failed</AlertTitle>
                <AlertDescription>
                  {saveError}
                </AlertDescription>
              </Alert>
            )}
            
            {tagsError && (
              <Alert className="my-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Could not load tags from the database. You can still proceed but tags may not be available.
                </AlertDescription>
              </Alert>
            )}
            
            {isExtracted && extractedRecipe && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <Label className="text-sm text-muted-foreground">Preview</Label>
                  </div>
                  
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-28 w-28 rounded-md flex-shrink-0" /> 
                      
                      <div className="flex-1 space-y-2 pt-1">
                        <h3 className="font-medium text-lg">{extractedRecipe.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {extractedRecipe.description}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {extractedRecipe.steps}
                        </p>
                        <div className="pt-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {extractedRecipe.prepTime && <span>Prep: {extractedRecipe.prepTime} min</span>}
                            {extractedRecipe.cookTime && <span>Cook: {extractedRecipe.cookTime} min</span>}
                            <span>Serves: {extractedRecipe.servings}</span>
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
                    availableTags={availableTags || []}
                    canCreateTags={true}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsExtracted(false);
                      setUrl('');
                      setExtractedRecipe(null);
                      setSelectedTags([]);
                      setSaveError(null);
                      setExtractionError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="button-glow"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Recipe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
          
          <Sheet open={showErrorDetails} onOpenChange={setShowErrorDetails}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Extraction Error Details</SheetTitle>
                <SheetDescription>
                  Technical details about the recipe extraction issue
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Error Logs</h4>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
                    <p className="whitespace-pre-wrap font-mono">
                      Failed to extract recipe using edge function. This could be due to:
                    </p>
                    <ul className="list-disc pl-6 pt-2 space-y-1">
                      <li>The edge function not being properly deployed</li>
                      <li>Network connectivity issues</li>
                      <li>The OpenAI API key not being properly configured</li>
                      <li>The recipe page having a structure that's difficult to parse</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">View Function Logs</h4>
                  <p className="text-sm text-muted-foreground">
                    You can check the Supabase Edge Function logs for more details about what might have gone wrong.
                  </p>
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`https://supabase.com/dashboard/project/ooqqbplrlgfahuvpcgri/functions/extract-recipe/logs`, '_blank')}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View Edge Function Logs
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Alternatives</h4>
                  <p className="text-sm text-muted-foreground">
                    You can still proceed with the limited information we extracted, or cancel and try again with a different URL.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRecipeForm;
