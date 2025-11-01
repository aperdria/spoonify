
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag as TagIcon, Search, Plus, XCircle, ArrowLeft, Filter } from 'lucide-react';
import Header from '@/components/Header';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tag } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTags } from '@/services/recipeService';
import { supabase } from '@/integrations/supabase/client';

const TagManager = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch tags from the database
  const { data: fetchedTags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags
  });
  
  // Initialize with fetched data
  useEffect(() => {
    if (fetchedTags.length > 0) {
      setTags([...fetchedTags].sort((a, b) => b.count - a.count));
    }
  }, [fetchedTags]);
  
  // Filter tags based on search term
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouping heuristics: map tags to topics using keyword matching
  const GROUP_ORDER = [
    'Dietary',
    'Course',
    'Cuisine',
    'Ingredient',
    'Occasion',
    'Other'
  ];

  const GROUP_KEYWORDS: Record<string, string[]> = {
    Dietary: ['vegan', 'vegetarian', 'gluten', 'dairy-free', 'paleo', 'keto', 'lactose', 'vegan', 'sans', 'sans-gluten', 'sans lactose', 'vegane'],
    Course: ['dessert', 'main', 'starter', 'appetizer', 'entree', 'side', 'breakfast', 'lunch', 'dinner', 'snack'],
    Cuisine: ['italian', 'french', 'mexican', 'indian', 'chinese', 'thai', 'japanese', 'mediterranean', 'spanish', 'greek'],
    Ingredient: ['chicken','beef','pork','fish','tofu','chocolate','cheese','tomato','potato','rice','pasta','egg','eggs','butter','flour','sugar','curcuma','turmeric','cumin'],
    Occasion: ['christmas','thanksgiving','easter','party','bbq','wedding','birthday']
  };

  function categorizeTagName(name: string): string {
    const n = name.toLowerCase();
    for (const group of GROUP_ORDER) {
      if (group === 'Other') continue;
      const keywords = GROUP_KEYWORDS[group];
      for (const kw of keywords) {
        // match whole words or hyphenated/compound variants
        const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(n)) return group;
      }
    }
    return 'Other';
  }

  // Build grouped tags map from filtered tags
  const groupedFilteredTags: Record<string, Tag[]> = filteredTags.reduce((acc, tag) => {
    const group = categorizeTagName(tag.name);
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);
  
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please enter a tag name",
        variant: "destructive",
      });
      return;
    }
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast({
        title: "Tag already exists",
        description: "A tag with this name already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Add new tag
    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      count: 0
    };
    
    setTags([newTag, ...tags]);
    setNewTagName('');
    setIsAddDialogOpen(false);
    
    toast({
      title: "Tag added",
      description: `"${newTag.name}" has been added to your tags`
    });
  };
  
  // open confirmation dialog for deletion
  const handleDeleteTag = (tagId: string) => {
    const t = tags.find(tag => tag.id === tagId);
    if (!t) return;
    setTagToDelete(t);
    setIsDeleteDialogOpen(true);
  };

  // Call the server-side Edge Function for deletion. Use optimistic updates.
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use the Supabase client functions invoker (same approach used in recipeExtractor)
      const invokeResult = await supabase.functions.invoke('delete-tag', {
        body: JSON.stringify({ id })
      });

      // Supabase JS returns { data, error }
      // @ts-ignore - some typing differences across versions
      const { data, error } = invokeResult as any;
      if (error) {
        console.error('Edge function delete-tag error:', error);
        throw error;
      }
      return data?.success === true;
    },
    // Optimistic update: remove tag immediately from UI
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['tags'] });
      const previous = tags;
      setTags(prev => prev.filter(t => t.id !== id));
      setDeletingId(id);
      return { previous };
    },
    onSuccess: (result) => {
      if (result && tagToDelete) {
        toast({
          title: 'Tag deleted',
          description: `"${tagToDelete.name}" has been successfully removed from tags and recipes.`
        });
      }
    },
    onError: (err, _variables, context: any) => {
      console.error('Error deleting tag:', err);
      toast({ title: 'Delete failed', description: 'Could not delete tag', variant: 'destructive' });
      if (context?.previous) {
        setTags(context.previous);
      }
      setDeletingId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsDeleteDialogOpen(false);
      setTagToDelete(null);
      setDeletingId(null);
    }
  });
  
  // Navigate to recipes with the selected tag
  const viewTagRecipes = (tagName: string) => {
    navigate(`/?tag=${encodeURIComponent(tagName)}`);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TagIcon size={20} />
                Manage Tags
              </CardTitle>
              <CardDescription>
                Organize your recipes by creating, editing, and managing tags
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    className="pl-10"
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-1">
                      <Plus size={18} />
                      <span>New Tag</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Tag</DialogTitle>
                      <DialogDescription>
                        Enter a name for your new tag. You can later assign this tag to recipes.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <Input
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddTag}>Create Tag</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Delete confirmation dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete tag</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the tag{` `}
                        {tagToDelete ? `"${tagToDelete.name}"` : ''} from the system and from any recipes that reference it.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        {tagToDelete?.count ? (
                          <>This tag is currently used in {tagToDelete.count} recipe{tagToDelete.count > 1 ? 's' : ''}.</>
                        ) : (
                          <>This tag is not used in any recipes.</>
                        )}
                      </p>
                    </div>

                    <DialogFooter>
                      <Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setTagToDelete(null); }}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (!tagToDelete) return;
                          deleteMutation.mutate(tagToDelete.id);
                        }}
                        disabled={deleteMutation.status === 'pending'}
                      >
                        {deleteMutation.status === 'pending' ? 'Deleting...' : 'Delete tag'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid gap-2">
                {isLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-muted-foreground">Loading tags...</p>
                  </div>
                ) : Object.keys(groupedFilteredTags).length > 0 ? (
                  GROUP_ORDER.map(group => {
                    const items = groupedFilteredTags[group] || [];
                    if (!items.length) return null;
                    return (
                      <div key={group} className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">{group}</h4>
                        <div className="grid gap-2">
                          {items.map(tag => (
                            <div 
                              key={tag.id}
                              className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{tag.count}</Badge>
                                <span className="font-medium">{tag.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {tag.count > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 text-muted-foreground"
                                    onClick={() => viewTagRecipes(tag.name)}
                                    title="View recipes with this tag"
                                  >
                                    <Filter size={16} />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteTag(tag.id)}
                                  title="Delete tag"
                                  disabled={deletingId !== null}
                                >
                                  {deletingId === tag.id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                  ) : (
                                    <XCircle size={18} />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">No tags found</p>
                    {searchTerm && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TagManager;
