import React from "react";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import SearchBar from "./SearchBar";
import ProfileSections from "./ProfileSections";
import Testimonials from "./Testimonials";

import PricingSection from "./MembershipPlans";
import ExportBoth from "./MembershipPlans";
import TestimonialSection from "./Testimonials";
import ManTestomonial from "./ManTestomonial";

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <ExportBoth />
      <ProfileSections />
      {/* <ManTestomonial /> */}
      <HowItWorks />
      <TestimonialSection />
    </div>
  );
};

export default Landing;
