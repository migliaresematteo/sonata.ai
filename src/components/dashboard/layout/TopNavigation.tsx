import React, { useState, useEffect } from "react";
import {
  Bell,
  Home,
  Search,
  Settings,
  User,
  LogIn,
  Music,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../../../../supabase/auth";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../../supabase/supabase";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string }>;
}

const TopNavigation = ({
  onSearch = () => {},
  notifications = [
    { id: "1", title: "New project assigned" },
    { id: "2", title: "Meeting reminder" },
  ],
}: TopNavigationProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    pieces: any[];
    composers: any[];
  }>({ pieces: [], composers: [] });

  // We'll render a simplified version for non-logged in users

  return (
    <div className="w-full h-16 border-b bg-background flex items-center justify-between px-4 fixed top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <Link to="/">
          <Home />
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search composers, pieces..."
            className="pl-8"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch(e.target.value);
              if (e.target.value.length > 1) {
                fetchSearchResults(e.target.value);
                setShowSearchResults(true);
              } else {
                setShowSearchResults(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/discover?search=${encodeURIComponent(searchValue)}`);
                setShowSearchResults(false);
              } else if (e.key === "Escape") {
                setShowSearchResults(false);
              }
            }}
            onFocus={() => {
              if (searchValue.length > 1) {
                setShowSearchResults(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow for clicking on results
              setTimeout(() => setShowSearchResults(false), 200);
            }}
          />

          {showSearchResults && searchValue.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[300px] overflow-auto">
              {searchResults.composers.length === 0 &&
              searchResults.pieces.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No results found
                </div>
              ) : (
                <>
                  {searchResults.composers.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                        Composers
                      </div>
                      {searchResults.composers.slice(0, 3).map((composer) => (
                        <div
                          key={composer.id}
                          className="p-2 hover:bg-muted cursor-pointer flex items-center"
                          onClick={() => {
                            navigate(`/composers/${composer.id}`);
                            setShowSearchResults(false);
                            setSearchValue("");
                          }}
                        >
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{composer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {composer.period || "Composer"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.pieces.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                        Pieces
                      </div>
                      {searchResults.pieces.slice(0, 3).map((piece) => (
                        <div
                          key={piece.id}
                          className="p-2 hover:bg-muted cursor-pointer flex items-center"
                          onClick={() => {
                            navigate(`/pieces/${piece.id}`);
                            setShowSearchResults(false);
                            setSearchValue("");
                          }}
                        >
                          <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{piece.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {piece.composer}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className="p-2 border-t text-center text-sm text-primary hover:bg-muted cursor-pointer"
                    onClick={() => {
                      navigate(
                        `/discover?search=${encodeURIComponent(searchValue)}`,
                      );
                      setShowSearchResults(false);
                    }}
                  >
                    View all results
                  </div>
                </>
              )}
              <button
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSearchResults(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {notifications.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {notifications.length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id}>
                          {notification.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.email || ""}
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="hidden md:flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Function to fetch search results from Supabase
  function fetchSearchResults(query: string) {
    if (!query || query.length < 2) return;

    try {
      // Fetch pieces
      supabase
        .from("pieces")
        .select("id, title, composer")
        .or(`title.ilike.%${query}%, composer.ilike.%${query}%`)
        .limit(5)
        .then(({ data: pieces, error: piecesError }) => {
          if (piecesError) console.error("Error fetching pieces:", piecesError);

          // Fetch composers
          supabase
            .from("composers")
            .select("id, name, period")
            .ilike("name", `%${query}%`)
            .limit(5)
            .then(({ data: composers, error: composersError }) => {
              if (composersError)
                console.error("Error fetching composers:", composersError);

              setSearchResults({
                pieces: pieces || [],
                composers: composers || [],
              });
            });
        });
    } catch (error) {
      console.error("Error in search:", error);
    }
  }
};

export default TopNavigation;
