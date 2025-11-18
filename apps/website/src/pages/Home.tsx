import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Packages } from '../components/Packages';
import { Demo } from '../components/Demo';
import { Comparison } from '../components/Comparison';
import { GetStarted } from '../components/GetStarted';

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
