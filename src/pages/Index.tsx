
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import RecipeCard from '@/components/RecipeCard';
import { Recipe, Tag } from '@/types';

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
  {
    id: '3',
    title: 'Chocolate Soufflé',
    description: 'A perfectly light and airy chocolate soufflé that rises beautifully and has a rich, molten center.',
    imageUrl: 'https://images.unsplash.com/photo-1579306194872-64d3b7c47f15?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1665&q=80',
    sourceUrl: 'https://example.com/souffle',
    tags: ['Dessert', 'French', 'Chocolate'],
    ingredients: [
      { name: 'dark chocolate', amount: 200, unit: 'g' },
      { name: 'butter', amount: 50, unit: 'g' },
      { name: 'eggs', amount: 4 },
      { name: 'sugar', amount: 100, unit: 'g' },
      { name: 'flour', amount: 2, unit: 'tbsp' },
    ],
    steps: [
      'Preheat oven to 180°C (350°F).',
      'Melt chocolate and butter together.',
      'Separate eggs and whisk whites until stiff peaks form.',
      'Mix egg yolks with sugar, then add to chocolate mixture.',
      'Fold in egg whites carefully.',
      'Bake for 12-15 minutes until risen but still wobbly in center.'
    ],
    prepTime: 25,
    cookTime: 15,
    servings: 4,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000
  },
  {
    id: '4',
    title: 'Simple Avocado Toast',
    description: 'The ultimate quick breakfast - perfectly toasted bread topped with creamy mashed avocado, a squeeze of lime, and optional toppings.',
    imageUrl: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
    sourceUrl: 'https://example.com/avocado-toast',
    tags: ['Breakfast', 'Quick', 'Vegetarian', 'Healthy'],
    ingredients: [
      { name: 'bread', amount: 2, unit: 'slices' },
      { name: 'avocado', amount: 1, unit: 'ripe' },
      { name: 'lime', amount: 0.5 },
      { name: 'salt', amount: 0.25, unit: 'tsp' },
      { name: 'red pepper flakes', amount: 0.25, unit: 'tsp', notes: 'optional' },
    ],
    steps: [
      'Toast bread until golden and crisp.',
      'Mash avocado with lime juice and salt.',
      'Spread avocado mixture on toast.',
      'Sprinkle with red pepper flakes if desired.'
    ],
    prepTime: 5,
    cookTime: 5,
    servings: 2,
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000
  },
  {
    id: '5',
    title: 'Japanese Miso Soup',
    description: 'A comforting and umami-rich soup made with dashi, miso paste, tofu, and seaweed - ready in just minutes.',
    imageUrl: 'https://images.unsplash.com/photo-1582271929296-5bc9be5f6107?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
    sourceUrl: 'https://example.com/miso-soup',
    tags: ['Japanese', 'Soup', 'Quick', 'Vegetarian'],
    ingredients: [
      { name: 'dashi stock', amount: 4, unit: 'cups' },
      { name: 'miso paste', amount: 3, unit: 'tbsp' },
      { name: 'tofu', amount: 200, unit: 'g', notes: 'cubed' },
      { name: 'wakame seaweed', amount: 2, unit: 'tbsp', notes: 'dried' },
      { name: 'green onions', amount: 2, unit: 'stalks', notes: 'thinly sliced' },
    ],
    steps: [
      'Heat dashi stock to just before boiling.',
      'Rehydrate wakame in cold water, then drain.',
      'Add tofu and wakame to stock and simmer for 2 minutes.',
      'Remove from heat and stir in miso paste.',
      'Serve garnished with green onions.'
    ],
    prepTime: 10,
    cookTime: 5,
    servings: 4,
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 345600000
  }
];

const mockTags: Tag[] = [
  { id: '1', name: 'Vegetarian', count: 3 },
  { id: '2', name: 'Quick', count: 3 },
  { id: '3', name: 'Italian', count: 1 },
  { id: '4', name: 'French', count: 2 },
  { id: '5', name: 'Healthy', count: 2 },
  { id: '6', name: 'Breakfast', count: 1 },
  { id: '7', name: 'Dinner', count: 1 },
  { id: '8', name: 'Dessert', count: 1 },
  { id: '9', name: 'Japanese', count: 1 },
  { id: '10', name: 'Soup', count: 1 },
  { id: '11', name: 'Pasta', count: 1 },
  { id: '12', name: 'Chocolate', count: 1 },
];

const Index = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [showMoreTags, setShowMoreTags] = useState(false);
  
  // Initialize with mock data on mount
  useEffect(() => {
    // In a real app, we would fetch from storage here
    setRecipes([...mockRecipes]);
    
    // Get popular tags (sorted by count)
    const sorted = [...mockTags].sort((a, b) => b.count - a.count);
    setPopularTags(sorted);
  }, []);
  
  // Filter recipes based on search term and selected tags
  const filteredRecipes = recipes.filter(recipe => {
    // Match search term (case insensitive)
    const matchesSearch = searchTerm === '' || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Match all selected tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => recipe.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Display top 5 tags, or all if showMoreTags is true
  const displayedTags = showMoreTags ? popularTags : popularTags.slice(0, 5);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero section */}
          <section className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-display font-medium mb-4">Spoonify</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Save and organize your favorite recipes from around the web.
              Easily extract, translate, and customize your culinary collection.
            </p>
          </section>
          
          {/* Search and Filter */}
          <section className="mb-10 section-transition">
            <Card className="shadow-sm border">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      className="pl-10"
                      placeholder="Search your recipes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Button asChild>
                    <Link to="/recipe/add" className="flex items-center gap-1">
                      <Plus size={18} />
                      <span>Add Recipe</span>
                    </Link>
                  </Button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <Filter size={16} />
                      Filter by tags
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMoreTags(!showMoreTags)}
                      className="h-7 text-xs"
                    >
                      {showMoreTags ? "Show Less" : "Show All"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {displayedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                        className="cursor-pointer h-6"
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Recipe Grid */}
          <section className="section-transition">
            <h2 className="text-2xl font-display mb-6">
              {filteredRecipes.length > 0 
                ? `${filteredRecipes.length} Recipe${filteredRecipes.length > 1 ? 's' : ''}` 
                : 'No recipes found'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                />
              ))}
            </div>
            
            {filteredRecipes.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No recipes match your search criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTags([]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
