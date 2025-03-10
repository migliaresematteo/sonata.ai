import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Settings,
  User,
  BookOpen,
  Award,
  Users,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { useState, useEffect, useContext, createContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "Repertoire Dashboard",
      description:
        "Track your current pieces, mastered works, and wishlist items with progress indicators.",
      icon: <BookOpen className="h-10 w-10 text-indigo-500" />,
      color: "bg-indigo-50 border-indigo-200",
    },
    {
      title: "AI Teacher Integration",
      description:
        "Get personalized practice recommendations and technique feedback based on your skill level.",
      icon: <Sparkles className="h-10 w-10 text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
    },
    {
      title: "Gamified Practice",
      description:
        "Earn achievement badges, complete daily challenges, and track milestones to stay motivated.",
      icon: <Award className="h-10 w-10 text-amber-500" />,
      color: "bg-amber-50 border-amber-200",
    },
    {
      title: "Piece Browser",
      description:
        "Search and filter pieces by composer, difficulty, instrument, and genre with ease.",
      icon: <Music className="h-10 w-10 text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Community Feed",
      description:
        "Discover curated recommendations, upcoming events, and connect with other musicians.",
      icon: <Users className="h-10 w-10 text-green-500" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Practice Tracking",
      description:
        "Log your practice sessions, set goals, and visualize your progress over time.",
      icon: <Calendar className="h-10 w-10 text-rose-500" />,
      color: "bg-rose-50 border-rose-200",
    },
  ];

  const testimonials = [
    {
      quote:
        "This app has transformed my practice routine. The AI recommendations are spot-on!",
      name: "Sarah Chen",
      role: "Concert Pianist",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      quote:
        "I've mastered more pieces in the last month than I did all last year. The gamification really works.",
      name: "Michael Rodriguez",
      role: "Violin Teacher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    {
      quote:
        "As a conservatory student, this helps me stay organized and focused on my repertoire goals.",
      name: "Emma Wilson",
      role: "Cello Student",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
  ];

  const benefits = [
    "Personalized practice recommendations",
    "Track progress across multiple pieces",
    "Earn achievements and rewards",
    "Connect with other musicians",
    "Access a library of classical pieces",
  ];

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
    } else {
      navigate("/profile");
    }
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/signup");
    } else {
      navigate("/repertoire");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="font-bold text-xl flex items-center">
              <Music className="mr-2 h-5 w-5 text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-extrabold">
                sonata.ai
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/profile")}>
                  Profile
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8 border-2 border-indigo-200">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.email || ""}
                        />
                        <AvatarFallback>
                          {user.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => signOut()}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={handleLoginClick}>
                  {user ? "My Profile" : "Sign In"}
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSignupClick}
                >
                  {user ? "My Repertoire" : "Get Started"}
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-20 overflow-hidden">
          {/* Full screen background image */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1920&q=80"
              alt="Musician with piano"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content overlay */}
          <div className="relative z-20 w-full max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge
                  className="w-fit px-3 py-1 text-sm bg-white/20 backdrop-blur-sm text-white border-white/30"
                  variant="outline"
                >
                  AI-Powered Classical Music Assistant
                </Badge>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mt-6 text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  sonata.ai
                </span>
                <br />
                <span className="text-4xl md:text-5xl text-white/90">
                  Your AI Practice Companion
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-white/80 max-w-xl mt-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Transform your musical practice with AI-powered insights,
                personalized feedback, and intelligent repertoire management
                designed for classical musicians.
              </motion.p>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-8 w-full max-w-2xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20"
                  >
                    <CheckCircle className="h-5 w-5 text-indigo-300 flex-shrink-0" />
                    <span className="font-medium text-white">{benefit}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 pt-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button
                  size="lg"
                  className="bg-white hover:bg-white/90 text-indigo-900 shadow-lg shadow-indigo-900/20 text-lg h-14"
                  onClick={handleSignupClick}
                >
                  {user ? "View My Repertoire" : "Start Your Journey"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-lg h-14"
                  onClick={handleLoginClick}
                >
                  {user ? "My Profile" : "Sign In"}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Floating UI elements - positioned absolutely relative to the section */}
          <div className="absolute top-[20%] right-[5%] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-20 flex items-center gap-2 border border-indigo-100 animate-float hidden md:flex">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <span className="font-medium text-sm">AI Practice Analysis</span>
          </div>

          <div className="absolute bottom-[15%] right-[10%] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-20 flex items-center gap-2 border border-indigo-100 animate-float-delay hidden md:flex">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-sm">Level 5 Achieved!</span>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200"
            >
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              sonata.ai combines powerful AI tools with an intuitive interface
              to help you practice more effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`border-2 hover:shadow-lg transition-all duration-300 overflow-hidden ${feature.color}`}
                >
                  <CardContent className="pt-6 pb-4">
                    <div className="mb-4 p-3 bg-white rounded-full w-fit">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button
                      variant="ghost"
                      className="text-indigo-600 p-0 hover:bg-transparent hover:text-indigo-800 flex items-center gap-1"
                    >
                      Learn more <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl my-20 border border-indigo-100">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 bg-white text-indigo-700 border-indigo-200"
            >
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              What Musicians Are Saying
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of musicians who have transformed their practice
              routine with sonata.ai.
            </p>
          </div>

          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 relative"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 rounded-full p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                </svg>
              </div>

              <p className="text-xl text-center italic text-gray-700 mt-6 mb-8">
                "{testimonials[activeTestimonial].quote}"
              </p>

              <div className="flex items-center justify-center">
                <Avatar className="h-14 w-14 mr-4 border-2 border-indigo-200">
                  <AvatarImage
                    src={testimonials[activeTestimonial].avatar}
                    alt={testimonials[activeTestimonial].name}
                  />
                  <AvatarFallback>
                    {testimonials[activeTestimonial].name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">
                    {testimonials[activeTestimonial].name}
                  </p>
                  <p className="text-indigo-600">
                    {testimonials[activeTestimonial].role}
                  </p>
                </div>
              </div>

              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full ${index === activeTestimonial ? "bg-indigo-600" : "bg-gray-300"}`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-12 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <motion.h2
                className="text-3xl md:text-4xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                Ready to Transform Your Practice?
              </motion.h2>
              <motion.p
                className="text-xl text-white/90 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join our community of passionate musicians and take your skills
                to the next level.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Button
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-gray-100"
                  onClick={handleSignupClick}
                >
                  {user ? "Go to Dashboard" : "Get Started Today"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Music className="mr-2 h-5 w-5 text-indigo-600" />
              <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                sonata.ai
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Virtuoso. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
