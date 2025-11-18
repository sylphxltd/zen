import { Comparison } from '../components/Comparison.tsx';
import { Demo } from '../components/Demo.tsx';
import { Features } from '../components/Features.tsx';
import { GetStarted } from '../components/GetStarted.tsx';
import { Hero } from '../components/Hero.tsx';
import { Packages } from '../components/Packages.tsx';

export function Home() {
  return (
    <div class="page-home">
      <Hero />
      <Features />
      <Demo />
      <Packages />
      <Comparison />
      <GetStarted />
    </div>
  );
}
