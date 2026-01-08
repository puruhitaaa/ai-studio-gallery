import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { GenerateDialog } from "@/components/generate/generate-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="glass sticky top-0 z-50 w-full border-border/50 border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link className="group flex items-center gap-2" to="/">
          <div className="relative">
            <div className="aurora-gradient flex h-8 w-8 items-center justify-center rounded-lg shadow-lg transition-shadow group-hover:shadow-aurora-2/30">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="aurora-gradient absolute inset-0 rounded-lg opacity-0 blur-lg transition-opacity group-hover:opacity-50" />
          </div>
          <span className="font-bold font-mono text-lg tracking-tight">
            AI Studio
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            activeProps={{ className: "text-foreground" }}
            className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
            to="/"
          >
            My Gallery
          </Link>
          <Link
            activeProps={{ className: "text-foreground" }}
            className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
            to="/explore"
          >
            Explore
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <GenerateDialog />
        </div>
      </div>
    </header>
  );
}
