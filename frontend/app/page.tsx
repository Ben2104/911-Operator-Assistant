import Image from "next/image";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import About from "./components/About";
import Solution from "./components/Solution";
import Product from "./components/Product";
import TeamSection from "./components/TeamSection";
export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <NavBar />
      <main>
        <Hero/>
        <About/>
        <Solution/>
        <Product/>
        <TeamSection/>
      </main>
    </div>
  );
}
