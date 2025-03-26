
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Header from '@/components/Header';
import RecipeDetail from '@/components/RecipeDetail';
import { Recipe } from '@/types';
import { translateRecipe } from '@/utils/translator';

// Mock data for development (will be replaced with real storage later)
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Authentic Italian Pasta Carbonara',
    description: 'A creamy traditional pasta carbonara with pancetta, eggs, and Parmesan cheese. Simple ingredients transformed into a luxurious sauce coating perfectly al dente spaghetti.',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80',
    sourceUrl: 'https://example.com/carbonara',
    tags: ['Italian', 'Pasta', 'Dinner'],
    ingredients: [
      { name: 'spaghetti', amount: 500, unit: 'g' },
      { name: 'pancetta', amount: 150, unit: 'g', notes: 'diced' },
      { name: 'egg yolks', amount: 6 },
      { name: 'Parmesan cheese', amount: 50, unit: 'g', notes: 'grated' },
      { name: 'black pepper', amount: 1, unit: 'tsp' },
      { name: 'salt', amount: 1, unit: 'tsp' },
    ],
    steps: [
      'Cook pasta in boiling salted water.',
      'In a separate pan, cook pancetta until crispy.',
      'Beat egg yolks with grated cheese.',
      'Drain pasta and mix with pancetta.',
      'Off heat, add egg mixture and stir quickly.',
      'Serve with extra cheese and pepper.'
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000
  },
  {
    id: '2',
    title: 'Classic French Ratatouille',
    description: 'A vibrant summer vegetable stew featuring eggplant, zucchini, bell peppers, and tomatoes, all simmered with herbs de Provence.',
    imageUrl: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
    sourceUrl: 'https://example.com/ratatouille',
    tags: ['French', 'Vegetarian', 'Healthy'],
    ingredients: [
      { name: 'eggplant', amount: 1, unit: 'large' },
      { name: 'zucchini', amount: 2, unit: 'medium' },
      { name: 'bell peppers', amount: 2, unit: 'large' },
      { name: 'tomatoes', amount: 4, unit: 'large' },
      { name: 'onion', amount: 1, unit: 'large' },
      { name: 'garlic', amount: 3, unit: 'cloves' },
      { name: 'olive oil', amount: 3, unit: 'tbsp' },
      { name: 'herbs de Provence', amount: 1, unit: 'tsp' },
    ],
    steps: [
      'Chop all vegetables into similar sized pieces.',
      'Sauté onions and garlic in olive oil.',
      'Add bell peppers and cook until softened.',
      'Add eggplant and zucchini, cook for 5 minutes.',
      'Add tomatoes and herbs, simmer for 30 minutes.',
      'Season with salt and pepper to taste.'
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
];

const RecipeView = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchRecipe = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would fetch from storage
        // For now, we'll use mock data
        const foundRecipe = mockRecipes.find(r => r.id === id);
        
        if (foundRecipe) {
          // If we have a recipe, get its translation
          const translationData = await translateRecipe(foundRecipe);
          
          // Merge the translation with the recipe
          setRecipe({
            ...foundRecipe,
            ...translationData
          });
        } else {
          toast({
            title: "Recipe not found",
            description: "The recipe you're looking for doesn't exist",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast({
          title: "Error loading recipe",
          description: "There was a problem loading the recipe",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id, navigate, toast]);
  
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
