
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, PlusCircle, TagIcon, ShoppingCart, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'glassmorphism py-2 shadow-sm' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 transition-transform duration-300 transform hover:scale-105">
          <span className="text-primary text-2xl font-display font-bold">Spoonify</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/" isActive={isActive('/')} icon={<Search size={18} />} label="Discover" />
          <NavLink to="/recipe/add" isActive={isActive('/recipe/add')} icon={<PlusCircle size={18} />} label="Add Recipe" />
          <NavLink to="/tags" isActive={isActive('/tags')} icon={<TagIcon size={18} />} label="Tags" />
          <NavLink to="/basket" isActive={isActive('/basket')} icon={<ShoppingCart size={18} />} label="Basket" />
        </nav>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden glassmorphism border-t animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <MobileNavLink to="/" isActive={isActive('/')} icon={<Search size={18} />} label="Discover" />
            <MobileNavLink to="/recipe/add" isActive={isActive('/recipe/add')} icon={<PlusCircle size={18} />} label="Add Recipe" />
            <MobileNavLink to="/tags" isActive={isActive('/tags')} icon={<TagIcon size={18} />} label="Tags" />
            <MobileNavLink to="/basket" isActive={isActive('/basket')} icon={<ShoppingCart size={18} />} label="Basket" />
          </div>
        </div>
      )}
    </header>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}

const NavLink = ({ to, isActive, icon, label }: NavLinkProps) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-1 py-2 px-1 border-b-2 transition-all duration-300 
      ${isActive 
        ? 'border-primary text-primary font-medium' 
        : 'border-transparent hover:border-primary/50 hover:text-primary/90'}`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const MobileNavLink = ({ to, isActive, icon, label }: NavLinkProps) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200
      ${isActive 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'hover:bg-secondary'}`}
  >
    {icon}
    <span className="text-base">{label}</span>
  </Link>
);

export default Header;
