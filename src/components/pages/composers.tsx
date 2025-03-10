import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Music, Filter } from "lucide-react";

interface Composer {
  id: string;
  name: string;
  birth_year: number;
  death_year: number | null;
  nationality: string;
  period: string;
  bio: string;
  image_url: string;
}

export default function ComposersPage() {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePeriod, setActivePeriod] = useState("all");

  useEffect(() => {
    const fetchComposers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("composers")
          .select("*")
          .order("name");

        if (error) throw error;
        setComposers(data || []);
      } catch (error) {
        console.error("Error fetching composers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComposers();
  }, []);

  const filteredComposers = composers.filter((composer) => {
    const matchesSearch = composer.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesPeriod =
      activePeriod === "all" ||
      composer.period.toLowerCase().includes(activePeriod.toLowerCase());

    return matchesSearch && matchesPeriod;
  });

  // Get unique periods for filtering
  const periods = [
    "all",
    ...Array.from(
      new Set(composers.map((composer) => composer.period.toLowerCase())),
    ),
  ];

  const getLifespan = (composer: Composer) => {
    return composer.death_year
      ? `${composer.birth_year} - ${composer.death_year}`
      : `b. ${composer.birth_year}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Discover" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold">Composers</h1>
                <p className="text-muted-foreground">
                  Explore classical music composers and their works
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search composers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Period:</span>
              </div>
              {periods.map((period) => (
                <Button
                  key={period}
                  variant={activePeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePeriod(period)}
                  className="capitalize"
                >
                  {period === "all" ? "All Periods" : period}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">Loading composers...</div>
            ) : filteredComposers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No composers found matching your criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComposers.map((composer) => (
                  <Card key={composer.id} className="overflow-hidden">
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={composer.image_url}
                        alt={composer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {composer.name}
                          </CardTitle>
                          <CardDescription>
                            {getLifespan(composer)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{composer.period}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {composer.bio}
                      </p>
                      <Badge variant="secondary" className="mt-4">
                        {composer.nationality}
                      </Badge>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/composers/${composer.id}`}>
                          <Music className="mr-2 h-4 w-4" /> View Works
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
