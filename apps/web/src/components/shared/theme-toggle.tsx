import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { resolvedMode, toggleMode } = useTheme();

  return (
    <Button variant="ghost" size="sm" onClick={toggleMode} type="button">
      {resolvedMode === "dark" ? (
        <SunMedium className="size-4" />
      ) : (
        <MoonStar className="size-4" />
      )}
      <span>{resolvedMode === "dark" ? "Light" : "Dark"} mode</span>
    </Button>
  );
}
