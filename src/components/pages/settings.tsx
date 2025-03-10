import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Key,
  BugPlay,
  Save,
  Mail,
  Sparkles,
  Shield,
  Bell,
} from "lucide-react";

interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  deepseek_api_key?: string;
  notifications_enabled: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({
    id: "",
    theme: "system",
    deepseek_api_key: "",
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bugReport, setBugReport] = useState({
    subject: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Check if settings exist for this user
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setSettings({
            id: data.id,
            theme: data.theme || "system",
            deepseek_api_key: data.deepseek_api_key || "",
            notifications_enabled: data.notifications_enabled !== false,
          });
        } else {
          // Create default settings if none exist
          const { data: newSettings, error: insertError } = await supabase
            .from("user_settings")
            .insert({
              user_id: user.id,
              theme: "system",
              notifications_enabled: true,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newSettings) {
            setSettings({
              id: newSettings.id,
              theme: newSettings.theme,
              deepseek_api_key: newSettings.deepseek_api_key || "",
              notifications_enabled: newSettings.notifications_enabled,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, navigate]);

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          theme: settings.theme,
          deepseek_api_key: settings.deepseek_api_key,
          notifications_enabled: settings.notifications_enabled,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Apply theme change
      applyTheme(settings.theme);

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendBugReport = async () => {
    if (!bugReport.subject || !bugReport.description) {
      toast({
        title: "Missing information",
        description: "Please provide both a subject and description.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // In a real app, this would send an email or create a ticket
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Bug report sent",
        description: "Thank you for your feedback!",
      });

      // Clear the form
      setBugReport({ subject: "", description: "" });
    } catch (error) {
      console.error("Error sending bug report:", error);
      toast({
        title: "Error sending report",
        description: "There was a problem sending your bug report.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="flex h-[calc(100vh-64px)] mt-16">
          <Sidebar activeItem="Settings" />
          <main className="flex-1 p-6 flex items-center justify-center">
            <p>Loading settings...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Settings" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <SettingsIcon className="h-6 w-6 mr-2" />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>

            <Tabs defaultValue="appearance">
              <TabsList className="mb-6">
                <TabsTrigger
                  value="appearance"
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Settings
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="support"
                  className="flex items-center gap-2"
                >
                  <BugPlay className="h-4 w-4" />
                  Support
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how the application looks on your device.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Theme</Label>
                      <div className="flex flex-wrap gap-4">
                        <Button
                          variant={
                            settings.theme === "light" ? "default" : "outline"
                          }
                          className="flex flex-col items-center justify-center h-24 w-24 gap-2"
                          onClick={() =>
                            setSettings({ ...settings, theme: "light" })
                          }
                        >
                          <Sun className="h-8 w-8" />
                          <span>Light</span>
                        </Button>

                        <Button
                          variant={
                            settings.theme === "dark" ? "default" : "outline"
                          }
                          className="flex flex-col items-center justify-center h-24 w-24 gap-2"
                          onClick={() =>
                            setSettings({ ...settings, theme: "dark" })
                          }
                        >
                          <Moon className="h-8 w-8" />
                          <span>Dark</span>
                        </Button>

                        <Button
                          variant={
                            settings.theme === "system" ? "default" : "outline"
                          }
                          className="flex flex-col items-center justify-center h-24 w-24 gap-2"
                          onClick={() =>
                            setSettings({ ...settings, theme: "system" })
                          }
                        >
                          <div className="flex">
                            <Sun className="h-8 w-8" />
                            <Moon className="h-8 w-8" />
                          </div>
                          <span>System</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                    <CardDescription>
                      Configure your AI assistant preferences and API keys.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="deepseekApiKey"
                          className="flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" /> DeepSeek API Key
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enter your DeepSeek API key to use their AI model for
                          enhanced practice recommendations.
                        </p>
                        <Input
                          id="deepseekApiKey"
                          type="password"
                          placeholder="sk-..."
                          value={settings.deepseek_api_key || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              deepseek_api_key: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="pt-4">
                        <Badge variant="outline" className="mb-2">
                          <Shield className="h-3 w-3 mr-1" /> Security Note
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Your API key is stored securely and is only used to
                          make requests to the DeepSeek API. We never share your
                          API key with third parties.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">
                          Enable Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about practice reminders,
                          achievements, and updates.
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={settings.notifications_enabled}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications_enabled: checked,
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        More notification settings will be available in a future
                        update.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card>
                  <CardHeader>
                    <CardTitle>Report a Bug</CardTitle>
                    <CardDescription>
                      Found an issue? Let us know so we can fix it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bugSubject">Subject</Label>
                        <Input
                          id="bugSubject"
                          placeholder="Brief description of the issue"
                          value={bugReport.subject}
                          onChange={(e) =>
                            setBugReport({
                              ...bugReport,
                              subject: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="bugDescription">Description</Label>
                        <Textarea
                          id="bugDescription"
                          placeholder="Please provide details about what happened and steps to reproduce the issue"
                          rows={5}
                          value={bugReport.description}
                          onChange={(e) =>
                            setBugReport({
                              ...bugReport,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      support@virtuoso-app.com
                    </div>
                    <Button onClick={sendBugReport} disabled={saving}>
                      {saving ? "Sending..." : "Send Report"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
