
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import RecipeCard from '@/components/RecipeCard';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getRecipes, getAllTags } from '@/services/recipeService';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showMoreTags, setShowMoreTags] = useState(false);
  
  // Fetch recipes from Supabase
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes
  });
  
  // Fetch tags from Supabase
  const { data: popularTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags
  });
  
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
