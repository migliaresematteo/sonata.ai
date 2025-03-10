import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
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
  Award,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface SidebarProps {
  activeItem?: string;
}

const navItems: NavItem[] = [
  { icon: <Home size={20} />, label: "Home", href: "/" },
  { icon: <User size={20} />, label: "Profile", href: "/profile" },
  { icon: <Music size={20} />, label: "Repertoire", href: "/repertoire" },
  { icon: <Search size={20} />, label: "Discover", href: "/discover" },
  { icon: <Sparkles size={20} />, label: "AI Teacher", href: "/ai-teacher" },
  { icon: <Award size={20} />, label: "Achievements", href: "/profile" },
];

const bottomItems: NavItem[] = [
  { icon: <User size={20} />, label: "Profile", href: "/profile" },
  { icon: <Settings size={20} />, label: "Settings", href: "/profile" },
  { icon: <HelpCircle size={20} />, label: "Help", href: "/" },
];

const Sidebar = ({ activeItem = "Dashboard" }: SidebarProps) => {
  return (
    <div className="w-[280px] h-full bg-background border-r flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Virtuoso</h2>
        <p className="text-sm text-muted-foreground">
          Classical Musician's Assistant
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link to={item.href} key={item.label}>
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

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-sm font-medium px-4 py-2">Practice Filters</h3>
          <Button variant="ghost" className="w-full justify-start gap-2">
            🎹 Piano
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            🎻 Violin
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            🎵 Voice
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t">
        {bottomItems.map((item) => (
          <Link to={item.href} key={item.label}>
            <Button variant="ghost" className="w-full justify-start gap-2 mb-2">
              {item.icon}
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
