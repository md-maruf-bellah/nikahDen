import Landing from "@/components/landing/Landing";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AdminDashboard from "./(admin)/dashboard/page";
import Navbar from "@/components/landing/Navabar";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="">
      <Navbar />
      <Landing />
      <Footer />
    </div>
  );
}
