import Landing from "@/components/landing/Landing";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AdminDashboard from "./dashboard/page";
import Navbar from "@/components/landing/Navabar";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const handtleThem = () => {};

  let roleData = false;

  if (roleData) {
    return (
      <div>
        <AdminDashboard />
      </div>
    );
  } else {
    return (
      <div className="py-8">
        <Navbar />
        <Landing />
        <Footer />
      </div>
    );
  }
}
