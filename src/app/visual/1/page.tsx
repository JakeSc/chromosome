import MercuryLake from './components/MercuryLake';

export default function VisualPage() {
  return (
    <main className="relative">
      <MercuryLake />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none h-10">
        <div className="bg-black/20 backdrop-blur-sm px-8 py-4 rounded-lg">
          <h1 className="text-white text-4xl font-light tracking-wide">
            Mercury Lake
          </h1>
        </div>
      </div>
    </main>
  );
}