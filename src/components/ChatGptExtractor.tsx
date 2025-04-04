
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveRecipe } from '@/services/recipeService';

const CHATGPT_PROMPT = `Please extract the recipe from the following webpage and format it in a structured way with the following attributes:
- title (string): The name of the recipe
- description (string): A brief description of the recipe
- imageUrl (string): URL to an image of the dish (leave empty if not available)
- sourceUrl (string): The original URL where the recipe was found
- tags (array of strings): Categories or keywords for the recipe
- ingredients (array of objects): Each with name (string), amount (number), unit (string), and notes (string)
- steps (array of strings): The cooking instructions
- prepTime (number): Time in minutes for preparation
- cookTime (number): Time in minutes for cooking
- servings (number): Number of servings the recipe yields

Format the response as a valid JSON object.`;

const ChatGptExtractor = () => {
  const [chatGptResponse, setChatGptResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    toast({
      title: "Prompt copied",
      description: "The prompt has been copied to your clipboard. Paste it into ChatGPT.",
    });
  };

  const handleSaveRecipe = async () => {
    if (!chatGptResponse.trim()) {
      toast({
        title: "No content",
        description: "Please paste ChatGPT's response first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    setParseError(null);
    
    try {
      // Try to parse the response as JSON
      let jsonData;
      try {
        // Extract JSON if it's wrapped in backticks
        const jsonMatch = chatGptResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonData = JSON.parse(jsonMatch[1]);
        } else {
          jsonData = JSON.parse(chatGptResponse);
        }
      } catch (e) {
        throw new Error("Could not parse the ChatGPT response as valid JSON. Make sure the response is properly formatted.");
      }
      
      // Validate required fields
      const requiredFields = ['title', 'description', 'ingredients', 'steps', 'servings'];
      for (const field of requiredFields) {
        if (!jsonData[field]) {
          throw new Error(`The recipe is missing the required field: ${field}`);
        }
      }
      
      // Make sure ingredients is an array and has the right format
      if (!Array.isArray(jsonData.ingredients)) {
        throw new Error("Ingredients must be an array");
      }
      
      // Make sure steps is an array
      if (!Array.isArray(jsonData.steps)) {
        throw new Error("Steps must be an array");
      }
      
      // Save the recipe to the database
      const savedRecipe = await saveRecipe(jsonData);
      
      toast({
        title: "Recipe saved",
        description: "Your recipe has been successfully saved to your collection",
      });
      
      // Navigate to the recipe page
      setTimeout(() => {
        navigate(`/recipe/${savedRecipe.id}`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving recipe from ChatGPT:", error);
      setParseError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Error saving recipe",
        description: "There was a problem processing the ChatGPT response",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <CardTitle className="text-2xl">Extract Recipe with ChatGPT</CardTitle>
        <CardDescription>
          Use ChatGPT to extract recipe details and save them to your collection
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Step 1: Copy this prompt</h3>
            <div className="relative">
              <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                {CHATGPT_PROMPT}
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={handleCopyPrompt}
              >
                <Copy size={16} className="mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Step 2: Paste ChatGPT's response</h3>
            <Textarea 
              className="h-60 font-mono text-sm"
              placeholder="Paste ChatGPT's response here..."
              value={chatGptResponse}
              onChange={(e) => setChatGptResponse(e.target.value)}
            />
          </div>
          
          {parseError && (
            <Alert className="border-orange-400 bg-orange-50 text-orange-800">
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
          
          <div className="pt-2 flex justify-end">
            <Button 
              onClick={handleSaveRecipe}
              disabled={isSaving || !chatGptResponse.trim()}
              className="button-glow"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Recipe
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatGptExtractor;
