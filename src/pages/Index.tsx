
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import RecipeCard from '@/components/RecipeCard';
import { getRecipes, getAllTags } from '@/services/recipeService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tagParam = queryParams.get('tag');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(tagParam);
  
  // Update activeTag when the URL changes
  useEffect(() => {
    setActiveTag(tagParam);
  }, [tagParam]);
  
  // Fetch recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes,
  });
  
  // Fetch tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });
  
  // Filter recipes by search term and active tag
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchTerm === '' || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !activeTag || recipe.tags.includes(activeTag);
    
    return matchesSearch && matchesTag;
  });
  
  // Clear tag filter
  const clearTagFilter = () => {
    setActiveTag(null);
    navigate('/'); // Remove tag from URL
  };
  
  // Set tag filter
  const setTagFilter = (tagName: string) => {
    if (activeTag === tagName) {
      clearTagFilter();
    } else {
      setActiveTag(tagName);
      navigate(`/?tag=${encodeURIComponent(tagName)}`);
    }
  };
  
  // Get popular tags (top 8)
  const popularTags = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="flex flex-col space-y-8 animate-fade-in">
          {/* Search and filter section */}
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                className="pl-10"
                placeholder="Search recipes by name or ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Tags filter */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {tagsLoading ? (
                <div className="text-sm text-muted-foreground py-2">Loading tags...</div>
              ) : popularTags.length > 0 ? (
                <>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Filter size={14} />
                    Filter:
                  </span>
                  
                  {popularTags.map(tag => (
                    <Badge 
                      key={tag.id}
                      variant={activeTag === tag.name ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTagFilter(tag.name)}
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs"
                    onClick={() => navigate('/tags')}
                  >
                    View All Tags
                  </Button>
                </>
              ) : null}
            </div>
            
            {/* Active filters */}
            {activeTag && (
              <div className="flex items-center mt-2 mb-4">
                <span className="text-sm text-muted-foreground mr-2">Active filter:</span>
                <Badge className="flex items-center gap-1 pr-1">
                  {activeTag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={clearTagFilter}
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              </div>
            )}
            
            <Separator className="mt-4 mb-8" />
          </div>
          
          {/* Recipe grid */}
          {recipesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTag 
                  ? `No recipes match the tag "${activeTag}"`
                  : searchTerm 
                    ? `No recipes match "${searchTerm}"`
                    : "Your recipe collection is empty"
                }
              </p>
              
              {(activeTag || searchTerm) ? (
                <div className="flex justify-center gap-3">
                  {activeTag && (
                    <Button variant="outline" onClick={clearTagFilter}>
                      Clear Tag Filter
                    </Button>
                  )}
                  
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={() => navigate('/recipe/add')}>
                  Add Your First Recipe
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
