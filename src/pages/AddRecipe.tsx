
import { useState } from 'react';
import Header from '@/components/Header';
import AddRecipeForm from '@/components/AddRecipeForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatGptExtractor from '@/components/ChatGptExtractor';

const AddRecipe = () => {
  const [activeTab, setActiveTab] = useState<string>("url-extractor");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <Tabs 
            defaultValue="url-extractor" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url-extractor">URL Extractor</TabsTrigger>
              <TabsTrigger value="chatgpt-extractor">ChatGPT Extractor</TabsTrigger>
            </TabsList>
            <TabsContent value="url-extractor">
              <AddRecipeForm />
            </TabsContent>
            <TabsContent value="chatgpt-extractor">
              <ChatGptExtractor />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AddRecipe;
