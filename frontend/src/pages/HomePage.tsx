import { About } from "../components/About";
import { Destination } from "../components/Destination";
import { FAQ } from "../components/FAQ";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { NextDepartures } from "../components/NextDepartures";
import { Ready } from "../components/Ready";
import { Testimonials } from "../components/Testimonials";
import { useLazyLoad } from "../hooks/useLazyLoad";

function LazySection({ children }: { children: React.ReactNode }) {
  const { ref, isVisible } = useLazyLoad(0.05);
  return (
    <div ref={ref}>
      {isVisible ? children : <div className="min-h-[200px]" />}
    </div>
  );
}

const HomePage = () => {
  return (
    <>
      <Hero />
      <About />
      <LazySection>
        <HowItWorks />
      </LazySection>
      <Destination />
      <LazySection>
        <NextDepartures />
      </LazySection>
      <LazySection>
        <Testimonials />
      </LazySection>
      <LazySection>
        <FAQ />
      </LazySection>
      <Ready />
    </>
  );
};

export default HomePage;
