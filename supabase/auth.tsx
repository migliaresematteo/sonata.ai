import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or update user profile in the profiles table
  const createOrUpdateProfile = async (user: User) => {
    try {
      console.log("Creating/updating profile for user:", user.id);

      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error checking for existing profile:", profileError);
      }

      if (!existingProfile) {
        console.log("No existing profile found, creating new one");
        // Create new profile if it doesn't exist
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          experience_level: "beginner",
        });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          console.log("Profile created successfully");
        }

        // Also insert into users table for foreign key references
        const { error: userInsertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
        });

        if (userInsertError) {
          console.error("Error inserting into users table:", userInsertError);
        } else {
          console.log("User inserted into public.users table");
        }
      } else {
        console.log("Existing profile found");
      }
    } catch (error) {
      console.error("Error in createOrUpdateProfile:", error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        createOrUpdateProfile(currentUser);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        createOrUpdateProfile(currentUser);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log("Signing up with:", { email, fullName });

    // First, directly create the user in the auth system
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.error("Signup error:", error);
      throw error;
    }

    console.log("Signup response:", data);

    // Create profile and user records manually to ensure they exist
    if (data.user) {
      try {
        // First try to create the user record
        const { error: userError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        });

        if (userError) {
          console.error("Error creating user record:", userError);
        } else {
          console.log("User record created successfully");
        }

        // Then try to create the profile record
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
          experience_level: "beginner",
        });

        if (profileError) {
          console.error("Error creating profile record:", profileError);
        } else {
          console.log("Profile record created successfully");
        }
      } catch (err) {
        console.error("Error in manual record creation:", err);
      }
    } else {
      console.warn("No user data returned from signup");
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    console.log("Signing in with email:", email);

    try {
      // Clear any previous sessions to avoid conflicts
      await supabase.auth.signOut();

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned from authentication");
      }

      console.log("Sign in successful, user:", data.user.id);
      setUser(data.user);

      // Create or update profile after sign in
      try {
        // Check if user exists in the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (userError && userError.code !== "PGRST116") {
          console.error("Error checking for existing user:", userError);
        }

        // If user doesn't exist in the users table, create it
        if (!userData) {
          console.log("Creating missing user record in users table");
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || "",
          });

          if (insertError) {
            console.error("Error creating user record:", insertError);
          }
        }

        // Now ensure profile exists
        await createOrUpdateProfile(data.user);
      } catch (profileError) {
        console.error(
          "Error creating/updating profile during signin:",
          profileError,
        );
        // Continue even if there's an error with profile creation
      }

      return data;
    } catch (error) {
      console.error("Error in signIn function:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
