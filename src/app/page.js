import Landing from "@/components/landing/Landing";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Home() {
  const handtleThem = () => {};
  return (
    <div className="py-8">
      {/* <ThemeSwitcher /> */}

      <Landing />
    </div>
  );
}
