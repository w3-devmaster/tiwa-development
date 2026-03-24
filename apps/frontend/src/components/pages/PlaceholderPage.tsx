'use client';

export default function PlaceholderPage({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-[#7b7f9e]">Coming soon...</p>
      </div>
    </div>
  );
}
