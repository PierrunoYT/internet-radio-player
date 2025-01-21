import RadioPlayer from '@/components/RadioPlayer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Internet Radio</h1>
        <RadioPlayer />
      </div>
    </main>
  );
}
