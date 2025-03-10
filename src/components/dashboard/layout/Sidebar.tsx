import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import MissionsPanel from "./MissionsPanel";
import {
  Home,
  LayoutDashboard,
  Calendar,
  User,
  Settings,
  HelpCircle,
  Music,
  Search,
  Sparkles,
  Trophy,
  LogIn,
  UserPlus,
  Menu,
  X,
  Users,
  Award,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  requiresAuth?: boolean;
}

interface SidebarProps {
  activeItem?: string;
}

const navItems: NavItem[] = [
  { icon: <Home size={20} />, label: "Home", href: "/" },
  {
    icon: <Music size={20} />,
    label: "Repertoire",
    href: "/repertoire",
    requiresAuth: true,
  },
  { icon: <Search size={20} />, label: "Discover", href: "/discover" },
  {
    icon: <Sparkles size={20} />,
    label: "AI Teacher",
    href: "/ai-teacher",
    requiresAuth: true,
  },
  {
    icon: <Trophy size={20} />,
    label: "Missions",
    href: "/missions",
    requiresAuth: true,
  },
  {
    icon: <Users size={20} />,
    label: "Social",
    href: "/social",
    requiresAuth: true,
  },
  {
    icon: <Award size={20} />,
    label: "Leaderboard",
    href: "/leaderboard",
    requiresAuth: true,
  },
];

const bottomItems: NavItem[] = [
  {
    icon: <User size={20} />,
    label: "Profile",
    href: "/profile",
    requiresAuth: true,
  },
  {
    icon: <Settings size={20} />,
    label: "Settings",
    href: "/settings",
    requiresAuth: true,
  },
  { icon: <HelpCircle size={20} />, label: "Help", href: "/help" },
];

const authItems: NavItem[] = [
  { icon: <LogIn size={20} />, label: "Login", href: "/login" },
  { icon: <UserPlus size={20} />, label: "Sign Up", href: "/signup" },
];

const Sidebar = ({ activeItem = "Dashboard" }: SidebarProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleToggleSidebar = () => {
      toggleSidebar();
    };

    document.addEventListener("toggle-sidebar", handleToggleSidebar);

    return () => {
      document.removeEventListener("toggle-sidebar", handleToggleSidebar);
    };
  }, []);

  const sidebarContent = (
    <>
      <div className="p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Sonata.ai</h2>
          <p className="text-sm text-muted-foreground">
            Classical Musician's Social
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <X size={24} />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {navItems
            .filter((item) => !item.requiresAuth || (item.requiresAuth && user))
            .map((item) => (
              <Link
                to={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant={item.label === activeItem ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
        </div>

        {!user && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              {authItems.map((item) => (
                <Link
                  to={item.href}
                  key={item.label}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={
                      item.label === activeItem ? "secondary" : "default"
                    }
                    className="w-full justify-start gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Missions panel removed from sidebar */}
      </ScrollArea>

      <div className="p-4 mt-auto border-t">
        {user ? (
          bottomItems
            .filter((item) => !item.requiresAuth || (item.requiresAuth && user))
            .map((item) => (
              <Link
                to={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 mb-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            Sign in to access all features
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button removed - now in TopNavigation */}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleSidebar}
      />

      <div
        className={`fixed top-0 left-0 h-full bg-background border-r flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:w-[280px]`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
