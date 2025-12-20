import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1e3a3a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#2d4a4a] rounded-lg p-8 text-white shadow-lg text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-gray-400 mb-6">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>
    </div>
  );
}
