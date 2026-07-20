"use client";

import { useState } from "react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Navbar } from "@/components/Navbar";
import { SocialDock } from "@/components/SocialDock";
import { Hero } from "@/components/Hero";
import { Introduction } from "@/components/Introduction";
import { About } from "@/components/About";
import { Education } from "@/components/Education";
import { Services } from "@/components/Services";
import { Experience } from "@/components/Experience";
import { Process } from "@/components/Process";
import { Portfolio } from "@/components/Portfolio";
import { Stats } from "@/components/Stats";
import { Pricing } from "@/components/Pricing";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { FloatingCTA } from "@/components/FloatingCTA";
import { StartProject } from "@/components/StartProject";

export default function Home() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const openWizard = () => setWizardOpen(true);

  return (
    <SmoothScroll>
      <LoadingScreen />
      <ScrollProgress />
      <Navbar onStartProject={openWizard} />
      <SocialDock />

      <main>
        <Hero onStartProject={openWizard} />
        <Introduction />
        <About />
        <Education />
        <Services />
        <Experience />
        <Process />
        <Portfolio />
        <Stats />
        <Pricing />
        <Testimonials />
        <Contact />
      </main>

      <Footer />
      <FloatingCTA onClick={openWizard} />
      <StartProject open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </SmoothScroll>
  );
}
