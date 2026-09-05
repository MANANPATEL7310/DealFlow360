import { LandingHeader } from "../components/landing-header";
import { HeroSection } from "../components/hero-section";
import { WorkflowStepper } from "../components/workflow-stepper";
import { FeaturesBento } from "../components/features-bento";
import { RolePersonasSection } from "../components/role-personas-section";
import { LandingCta } from "../components/landing-cta";
import { LandingFooter } from "../components/landing-footer";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesBento />
        <WorkflowStepper />
        <RolePersonasSection />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
