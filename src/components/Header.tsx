
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Book, PlusCircle, Tags, ShoppingCart, Menu, X, ChevronDown 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from "@/components/ui/separator";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getCurrentBasket } from '@/services/basketService';

const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get basket count
  /*
  const { data: basket } = useQuery({
    queryKey: ['basket-count'],
    queryFn: getCurrentBasket,
  });
  
  
  const basketRecipeCount = basket?.recipes.length || 0;
  */
  const basketRecipeCount = 0;

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Links configuration
  const links = [
    {
      path: '/',
      label: 'My Recipes',
      icon: <Book size={18} className="mr-1" />,
    },
    {
      path: '/recipe/add',
      label: 'Add Recipe',
      icon: <PlusCircle size={18} className="mr-1" />,
    },
    {
      path: '/tags',
      label: 'Tags',
      icon: <Tags size={18} className="mr-1" />,
    },
    {
      path: '/basket',
      label: 'Basket',
      icon: (
        <div className="relative">
          <ShoppingCart size={18} className="mr-1" />
          {basketRecipeCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {basketRecipeCount}
            </Badge>
          )}
        </div>
      ),
    },
  ];
  
  // Check if a link is active
  const isActiveLink = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border h-16 flex items-center">
      <div className="container px-4 h-full flex justify-between items-center">
        {/* Logo */}
        <div>
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-foreground cursor-pointer">
              Spoonify
            </h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="h-full">
            <ul className="flex h-full">
              {links.map((link) => (
                <li key={link.path} className="h-full">
                  <Link
                    to={link.path}
                    className={`h-full px-4 flex items-center gap-1 border-b-2 transition-colors ${
                      isActiveLink(link.path)
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        
        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        )}
      </div>
      
      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-200 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-3/4 max-w-sm bg-background shadow-xl transform transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 overflow-y-auto h-full">
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center p-3 rounded-md ${
                        isActiveLink(link.path)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                      {link.label === 'Basket' && basketRecipeCount > 0 && (
                        <Badge className="ml-2" variant="default">
                          {basketRecipeCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
                <Separator className="my-4" />
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
