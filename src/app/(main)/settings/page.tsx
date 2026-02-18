import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Customize your app experience.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Change the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-sm text-muted-foreground">Select your preferred color theme.</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
