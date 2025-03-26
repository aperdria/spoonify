
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Header from '@/components/Header';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipe } from '@/types';
import { translateRecipe } from '@/utils/translator';
import { getRecipeById } from '@/services/recipeService';
import { useQuery } from '@tanstack/react-query';

const RecipeView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          
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
