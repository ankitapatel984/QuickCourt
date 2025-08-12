import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Search, Menu, MapPin } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            {/* <MapPin className="h-5 w-5 text-white" /> */}
            <img src="https://sdmntpreastus.oaiusercontent.com/files/00000000-8ca0-61f9-bb91-c4a87983e128/raw?se=2025-08-12T03%3A56%3A13Z&sp=r&sv=2024-08-04&sr=b&scid=93f7eab1-b7c6-5ac8-b795-c3c9f630a037&skoid=f28c0102-4d9d-4950-baf0-4a8e5f6cf9d4&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-12T00%3A57%3A48Z&ske=2025-08-13T00%3A57%3A48Z&sks=b&skv=2024-08-04&sig=QlH6lqoEF0vUba4fDyh3sGdqnOiqk4jNcTX%2BB244xiQ%3D"></img>
          </div>
          <span className="text-3xl text-purple-800 font-bold text-foreground">QuickCourt</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/venues" 
            className={`text-xl font-medium text-black transition-colors hover:text-purple-800 ${
              isActive('/venues') ? 'text-purple-800' : 'text-muted-foreground'
            }`}
          >
            Venues
          </Link>
          <Link 
            to="/profile" 
            className={`text-xl font-medium text-black transition-colors hover:text-purple-800 ${
              isActive('/profile') ? 'text-purple-800' : 'text-muted-foreground'
            }`}
          >
            My Bookings
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>
          
          <Link to="/login">
            <Button variant="ghost" size="sm"
            className="bg-purple-800 hover:text-purple-700 text-white">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          </Link>
          
          <Link to="/register">
            <Button variant="hero" size="sm"
            className="bg-purple-800 hover:text-purple-400 text-white">
              Sign Up
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;