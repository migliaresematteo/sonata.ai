import { ReactNode } from "react";
import { Music } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <Music className="h-8 w-8 text-indigo-500 mr-2" />
            <span className="text-2xl font-bold">Virtuoso</span>
          </Link>
          <h1 className="text-3xl font-bold">Classical Musician's Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Manage your repertoire and practice sessions with AI-powered
            insights
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
