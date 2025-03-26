
import Header from '@/components/Header';
import AddRecipeForm from '@/components/AddRecipeForm';

const AddRecipe = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <AddRecipeForm />
        </div>
      </main>
    </div>
  );
};

export default AddRecipe;
