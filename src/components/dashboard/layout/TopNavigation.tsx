import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Home,
  Search,
  Settings,
  User,
  LogIn,
  Music,
  X,
  Menu,
  Users,
  CheckCircle,
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
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_connections")
        .select(
          `
          id,
          status,
          created_at,
          user:user_id (id, full_name, avatar_url)
        `,
        )
        .eq("connected_user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleConnectionRequest = async (
    connectionId: string,
    accept: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("user_connections")
        .update({
          status: accept ? "accepted" : "rejected",
        })
        .eq("id", connectionId);

      if (error) throw error;

      // Update local state
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== connectionId),
      );
    } catch (error) {
      console.error("Error handling connection request:", error);
    }
  };

  // We'll render a simplified version for non-logged in users

  return (
    <div className="w-full h-16 border-b bg-background flex items-center justify-between px-4 fixed top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("toggle-sidebar"))
            }
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <Link to="/" className="hidden md:block">
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
                        {(notifications.length > 0 ||
                          pendingRequests.length > 0) && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                            {notifications.length + pendingRequests.length}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="max-h-[300px] overflow-y-auto">
                        <div className="p-2 border-b">
                          <h4 className="text-sm font-medium mb-1">
                            Friend Requests
                          </h4>
                          {pendingRequests.length > 0 ? (
                            pendingRequests.slice(0, 3).map((request) => (
                              <div
                                key={request.id}
                                className="flex items-center justify-between py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={request.user?.avatar_url}
                                    />
                                    <AvatarFallback>
                                      {request.user?.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-sm">
                                    <p className="font-medium">
                                      {request.user?.full_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Wants to connect
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleConnectionRequest(request.id, false)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleConnectionRequest(request.id, true)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">
                              No pending friend requests
                            </p>
                          )}
                          {pendingRequests.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() =>
                                document
                                  .querySelector('[data-value="requests"]')
                                  ?.click()
                              }
                            >
                              View all requests
                            </Button>
                          )}
                        </div>

                        <div className="p-2">
                          <h4 className="text-sm font-medium mb-1">
                            News & Updates
                          </h4>
                          <div className="space-y-2">
                            <div className="p-2 rounded-md bg-muted/50">
                              <p className="text-sm font-medium">
                                New Feature: Leaderboard
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Check out the new leaderboard to see top
                                musicians!
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                2 days ago
                              </p>
                            </div>
                            <div className="p-2 rounded-md bg-muted/50">
                              <p className="text-sm font-medium">
                                Profile Customization
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Personalize your profile with new customization
                                options
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                5 days ago
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/social")}
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Social</p>
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
