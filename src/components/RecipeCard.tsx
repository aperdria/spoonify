
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { Recipe } from '@/types';
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  recipe: Recipe;
  isHighlighted?: boolean;
}

const RecipeCard = ({ recipe, isHighlighted = false }: RecipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Calculate total time (prep + cook)
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  // Get up to 3 tags to display
  const displayTags = recipe.tags.slice(0, 3);
  
  return (
    <Link 
      to={`/recipe/${recipe.id}`} 
      className={`recipe-card group ${isHighlighted ? 'ring-2 ring-primary/30' : ''}`}
    >
      <div className="recipe-card-image">
        {/* Blur placeholder while image loads */}
        <div 
          className={`absolute inset-0 bg-muted transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            backgroundImage: `url(${recipe.imageUrl}?blur=true)`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)'
          }}
        />
        
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title} 
          className={`transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Quick info section */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {totalTime > 0 && (
              <div className="flex items-center space-x-1 text-white text-xs">
                <Clock size={14} className="text-white/90" />
                <span>{totalTime} min</span>
              </div>
            )}
            
            {recipe.servings > 0 && (
              <div className="flex items-center space-x-1 text-white text-xs">
                <Users size={14} className="text-white/90" />
                <span>{recipe.servings}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="recipe-card-content">
        <h3 className="font-medium leading-tight text-lg mb-1 group-hover:text-primary transition-colors duration-200">
          {recipe.title}
        </h3>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {recipe.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          
          {recipe.tags.length > 3 && (
            <span className="text-xs text-muted-foreground mt-0.5">
              +{recipe.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
