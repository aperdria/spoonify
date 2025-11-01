
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from 'lucide-react';
import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void; // Make onClick optional
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48">
        <img 
          src={recipe.imageUrl || '/placeholder.svg'} 
          alt={recipe.title} 
          className="h-full w-full object-cover"
        />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-1 line-clamp-1">{recipe.title}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {recipe.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">+{recipe.tags.length - 3}</Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{totalTime} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>Serves {recipe.servings}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
