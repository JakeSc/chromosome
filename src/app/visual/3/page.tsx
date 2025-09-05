import T1000Blob from './components/T1000Blob';

export default function Visual3Page() {
  return (
    <main className="relative min-h-screen">
      <T1000Blob />

      {/* Text overlay */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="bg-black/20 backdrop-blur-sm px-8 py-4 rounded-xl border border-white/10">
          <h1 className="text-white text-4xl font-light tracking-wide text-center">
            Quicksilver Capital
          </h1>
          <p className="mt-2 text-white/80 text-center">Shape what’s next.</p>
        </div>
      </div>
    </main>
  );
}
