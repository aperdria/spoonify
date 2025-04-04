
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import TagSelector from '@/components/TagSelector';
import { getAllTags, updateRecipe } from '@/services/recipeService';
import { Recipe, Ingredient, Tag } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EditRecipeFormProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
  onSuccess: (recipe: Recipe) => void;
}

const EditRecipeForm = ({ recipe, open, onClose, onSuccess }: EditRecipeFormProps) => {
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description);
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl);
  const [sourceUrl, setSourceUrl] = useState(recipe.sourceUrl);
  const [prepTime, setPrepTime] = useState(recipe.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(recipe.cookTime?.toString() || '');
  const [servings, setServings] = useState(recipe.servings.toString());
  const [ingredients, setIngredients] = useState<string>(
    recipe.ingredients.map(i => 
      `${i.amount || ''} ${i.unit || ''} ${i.name}${i.notes ? ` (${i.notes})` : ''}`
    ).join('\n')
  );
  const [steps, setSteps] = useState<string>(recipe.steps.join('\n\n'));
  const [selectedTags, setSelectedTags] = useState<string[]>(recipe.tags || []);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch all tags for the tag selector
  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags
  });
  
  // Update recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: (updatedRecipe: Partial<Recipe>) => updateRecipe(recipe.id, updatedRecipe),
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Recipe updated",
          description: "Your recipe has been successfully updated."
        });
        onSuccess(data);
        onClose();
      } else {
        toast({
          title: "Update failed",
          description: "There was an error updating your recipe. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your recipe.",
        variant: "destructive"
      });
    }
  });
  
  const parseIngredients = (rawIngredients: string): Ingredient[] => {
    return rawIngredients.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const match = line.match(/^([\d./]*)?\s*([a-zA-Z]*)?\s*([^(]*)(?:\s*\(([^)]*)\))?$/);
        if (match) {
          const [, amount, unit, name, notes] = match;
          return {
            name: name.trim(),
            amount: amount ? parseFloat(amount) : undefined,
            unit: unit ? unit.trim() : undefined,
            notes: notes ? notes.trim() : undefined
          };
        }
        return { name: line.trim() };
      });
  };
  
  const parseSteps = (rawSteps: string): string[] => {
    return rawSteps.split('\n\n')
      .filter(step => step.trim() !== '')
      .map(step => step.trim());
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !description || !imageUrl || !ingredients || !steps) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedRecipe: Partial<Recipe> = {
      title,
      description,
      imageUrl,
      sourceUrl,
      prepTime: prepTime ? parseInt(prepTime) : undefined,
      cookTime: cookTime ? parseInt(cookTime) : undefined,
      servings: parseInt(servings) || recipe.servings,
      ingredients: parseIngredients(ingredients),
      steps: parseSteps(steps),
      tags: selectedTags
    };
    
    updateRecipeMutation.mutate(updatedRecipe);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Recipe</DialogTitle>
          <DialogDescription>
            Make changes to your recipe and save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Recipe Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Recipe title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Short description of the recipe"
                  required
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                  required
                />
                {imageUrl && (
                  <div className="mt-2 rounded-md overflow-hidden h-32">
                    <img 
                      src={imageUrl} 
                      alt="Recipe preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input 
                  id="sourceUrl" 
                  type="url" 
                  value={sourceUrl} 
                  onChange={(e) => setSourceUrl(e.target.value)} 
                  placeholder="https://example.com/recipe"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="prepTime">Prep Time (min)</Label>
                  <Input 
                    id="prepTime" 
                    type="number" 
                    value={prepTime} 
                    onChange={(e) => setPrepTime(e.target.value)} 
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time (min)</Label>
                  <Input 
                    id="cookTime" 
                    type="number" 
                    value={cookTime} 
                    onChange={(e) => setCookTime(e.target.value)} 
                    placeholder="45"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input 
                    id="servings" 
                    type="number" 
                    value={servings} 
                    onChange={(e) => setServings(e.target.value)} 
                    placeholder="4"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <TagSelector 
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  availableTags={availableTags}
                  canCreateTags={true}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea 
                  id="ingredients" 
                  value={ingredients} 
                  onChange={(e) => setIngredients(e.target.value)} 
                  placeholder="500g flour
2 eggs
..."
                  rows={9}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One ingredient per line. Format: amount unit name (notes)
                </p>
              </div>
              
              <div>
                <Label htmlFor="steps">Instructions</Label>
                <Textarea 
                  id="steps" 
                  value={steps} 
                  onChange={(e) => setSteps(e.target.value)} 
                  placeholder="1. Preheat oven to 180°C.

2. Mix all dry ingredients in a bowl."
                  rows={10}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate steps with a blank line.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateRecipeMutation.isPending}
            >
              {updateRecipeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecipeForm;
