import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4 glass-text">
            Quokka Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Glassmorphism & Liquid Glass Edition
          </p>
        </div>

        {/* Card Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Glass Card */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
              <CardDescription>Standard glass effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Translucent background with subtle blur for depth and hierarchy.
              </p>
            </CardContent>
          </Card>

          {/* Strong Glass Card */}
          <Card variant="glass-strong">
            <CardHeader>
              <CardTitle>Strong Glass</CardTitle>
              <CardDescription>Enhanced blur effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stronger backdrop blur for elevated components and modals.
              </p>
            </CardContent>
          </Card>

          {/* Hoverable Glass Card */}
          <Card variant="glass-hover">
            <CardHeader>
              <CardTitle>Interactive Glass</CardTitle>
              <CardDescription>Hover to intensify</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dynamic glass effect that responds to user interaction.
              </p>
            </CardContent>
          </Card>

          {/* Liquid Border Card */}
          <Card variant="glass-liquid">
            <CardHeader>
              <CardTitle>Liquid Glass</CardTitle>
              <CardDescription>Gradient border effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Combines glass morphism with animated liquid borders.
              </p>
            </CardContent>
          </Card>

          {/* AI Variant (existing) */}
          <Card variant="ai">
            <CardHeader>
              <CardTitle>AI Enhanced</CardTitle>
              <CardDescription>Purple gradient glass</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Special variant for AI-powered content with signature glow.
              </p>
            </CardContent>
          </Card>

          {/* Elevated Standard */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Traditional Elevated</CardTitle>
              <CardDescription>Solid with shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Classic solid cards still available for high-contrast needs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Button Examples */}
        <Card variant="glass" className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Glass Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="glass-primary">Glass Primary</Button>
            <Button variant="glass-secondary">Glass Secondary</Button>
            <Button variant="glass-accent">Glass Accent</Button>
            <Button variant="glass">Glass Neutral</Button>
            <Button variant="default">Solid Default</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </Card>

        {/* Input Examples */}
        <Card variant="glass" className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Glass Inputs</h2>
          <div className="space-y-4 max-w-md">
            <Input placeholder="Type something..." />
            <Input placeholder="Glass blur intensifies on focus" />
          </div>
        </Card>
      </div>
    </div>
  );
}
