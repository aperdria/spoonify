
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/Header';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipe } from '@/types';
import { getRecipeById, deleteRecipe } from '@/services/recipeService';
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

const RecipeView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { 
    data: recipe, 
    error, 
    isLoading 
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => {
      if (!id) return null;
      return getRecipeById(id);
    },
    meta: {
      onError: () => {
        toast({
          title: "Error loading recipe",
          description: "There was a problem loading the recipe",
          variant: "destructive",
        });
      }
    }
  });
  
  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: () => {
      if (!id) return Promise.resolve(false);
      console.log("Attempting to delete recipe with ID:", id);
      return deleteRecipe(id);
    },
    onSuccess: (success) => {
      console.log("Delete mutation success result:", success);
      if (success) {
        toast({
          title: "Recipe deleted",
          description: "The recipe has been successfully deleted",
        });
        // Invalidate recipe queries to update lists
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        queryClient.invalidateQueries({ queryKey: ['tags'] });
        // Navigate back to home
        navigate('/');
      } else {
        toast({
          title: "Delete failed",
          description: "There was a problem deleting the recipe",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the recipe",
        variant: "destructive",
      });
    }
  });
  
  // If recipe is null or undefined after loading, show error and navigate back
  useEffect(() => {
    if (!isLoading && !recipe) {
      toast({
        title: "Recipe not found",
        description: "The recipe you're looking for doesn't exist",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [recipe, isLoading, toast, navigate]);
  
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    console.log("Delete confirmed, calling mutation");
    deleteRecipeMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            
            {recipe && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteClick}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                  >
                    <Trash2 size={16} />
                    Delete Recipe
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this recipe?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the recipe 
                      "{recipe.title}" and remove it from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteConfirm}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteRecipeMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-80 bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-3/4 bg-muted animate-pulse rounded-md" />
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            </div>
          ) : recipe ? (
            <RecipeDetail recipe={recipe} />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Recipe not found</p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecipeView;
