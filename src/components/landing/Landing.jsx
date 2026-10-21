import React from "react";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import ProfileSections from "./ProfileSections";
import ExportBoth from "./MembershipPlans";
import TestimonialSection from "./Testimonials";

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
