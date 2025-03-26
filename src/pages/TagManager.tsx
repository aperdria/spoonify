
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

const TagManager = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
  
  const handleDeleteTag = (tagId: string) => {
    const tagToDelete = tags.find(tag => tag.id === tagId);
    
    if (!tagToDelete) {
      return;
    }
    
    // If tag is associated with recipes, show warning
    if (tagToDelete.count > 0) {
      toast({
        title: "Cannot delete tag",
        description: `"${tagToDelete.name}" is used in ${tagToDelete.count} recipe${tagToDelete.count > 1 ? 's' : ''}`,
        variant: "destructive",
      });
      return;
    }
    
    // Delete tag
    setTags(tags.filter(tag => tag.id !== tagId));
    
    toast({
      title: "Tag deleted",
      description: `"${tagToDelete.name}" has been deleted`
    });
  };
  
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
              </div>
              
              <div className="grid gap-2">
                {isLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-muted-foreground">Loading tags...</p>
                  </div>
                ) : filteredTags.length > 0 ? (
                  filteredTags.map(tag => (
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
                          disabled={tag.count > 0}
                          title={tag.count > 0 ? "Cannot delete tags used in recipes" : "Delete tag"}
                        >
                          <XCircle size={18} />
                        </Button>
                      </div>
                    </div>
                  ))
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
