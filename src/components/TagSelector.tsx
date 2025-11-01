
import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Tag } from '@/types';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags: Tag[];
  canCreateTags?: boolean;
  maxDisplayed?: number;
}

export function TagSelector({ 
  selectedTags, 
  onChange, 
  availableTags = [], // Ensure availableTags has a default empty array
  canCreateTags = true,
  maxDisplayed = 5
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  
  const displayTags = showAllTags ? selectedTags : selectedTags.slice(0, maxDisplayed);
  
  const handleSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
  };
  
  const handleRemove = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };
  
  const createTag = () => {
    if (
      inputValue.trim() !== '' && 
      !selectedTags.includes(inputValue.trim()) &&
      !availableTags.find(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase())
    ) {
      handleSelect(inputValue.trim());
      setInputValue('');
      setOpen(false);
    }
  };
  
  // Make sure filteredTags is always an array, even if availableTags is undefined
  const filteredTags = Array.isArray(availableTags) 
    ? availableTags.filter(tag => 
        !selectedTags.includes(tag.name) && 
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {displayTags.map(tag => (
          <Badge 
            key={tag} 
            variant="secondary"
            className="pl-2 h-6 gap-1 group text-sm transition-all"
          >
            {tag}
            <button
              className="ml-1 rounded-full h-4 w-4 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                handleRemove(tag);
              }}
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        
        {selectedTags.length > maxDisplayed && !showAllTags && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => setShowAllTags(true)}
          >
            +{selectedTags.length - maxDisplayed} more
          </Button>
        )}
        
        {showAllTags && selectedTags.length > maxDisplayed && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => setShowAllTags(false)}
          >
            Show less
          </Button>
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 border-dashed w-full justify-start text-muted-foreground text-sm"
          >
            <Plus size={16} className="mr-2" />
            {selectedTags.length > 0 ? 'Add more tags' : 'Add tags'}
            <ChevronDown size={16} className="ml-auto opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          <Command className="rounded-lg border shadow-md" shouldFilter={false}>
            <CommandInput 
              placeholder="Search or create tag..." 
              value={inputValue}
              onValueChange={setInputValue}
              className="h-9"
            />
            <CommandList>
              {filteredTags.length === 0 ? (
                <CommandEmpty className="py-3 text-sm text-center text-muted-foreground">
                  {canCreateTags ? (
                    <div className="space-y-1">
                      <p>No tags found.</p>
                      {inputValue.trim() !== '' && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={createTag}
                        >
                          Create "{inputValue}"
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p>No tags found.</p>
                  )}
                </CommandEmpty>
              ) : (
                <CommandGroup className="max-h-[200px]">
                  {filteredTags.map(tag => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag.name)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span>{tag.name}</span>
                        {tag.count > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {tag.count}
                          </Badge>
                        )}
                      </div>
                      <Check
                        size={16}
                        className={cn(
                          "ml-auto",
                          selectedTags.includes(tag.name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default TagSelector;
