import LiquidGlassSphere from './components/LiquidGlassSphere';

export default function Visual2Page() {
  return (
    <main className="relative">
      <LiquidGlassSphere />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none h-10">
        <div className="bg-black/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
          <h1 className="text-white text-4xl font-light tracking-wide">
            Glass Sphere
          </h1>
        </div>
      </div>
    </main>
  );
}