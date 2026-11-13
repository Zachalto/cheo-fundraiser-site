import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { Ticker } from "./components/Ticker";
import { Basics } from "./components/Basics";
import { Games } from "./components/Games";
import { TryOne } from "./components/TryOne";
import { WhyCheo } from "./components/WhyCheo";
import { Thermometer } from "./components/Thermometer";
import { Sponsors } from "./components/Sponsors";
import { SignUpFaq } from "./components/SignUpFaq";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar />
      <main id="main">
        <Hero />
        <Ticker />
        <Basics />
        <Games />
        <TryOne />
        <Thermometer />
        <WhyCheo />
        <Sponsors />
        <SignUpFaq />
      </main>
      <Footer />
    </>
  );
}
