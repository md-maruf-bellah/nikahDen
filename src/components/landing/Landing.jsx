import React from "react";
import HeroSection from "./HeroSection";
import HowItWorks from "./HowItWorks";
import SearchBar from "./SearchBar";
import ProfileSections from "./ProfileSections";
import Testimonials from "./Testimonials";
import MembershipPlans from "./MembershipPlans";
import Footer from "./Footer";

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <SearchBar />
      <MembershipPlans />
      <ProfileSections />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Landing;
