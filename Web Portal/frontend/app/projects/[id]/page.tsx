"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import projectsData from "@/datatmp/projects.json";
import type { ProjectRecord } from "@/models/Projects";

// Google Maps component using OpenStreetMap (no API key needed)
function ProjectMap({ address }: { address: string }) {
  // Encode address for URL
  const encodedAddress = encodeURIComponent(address + ", Montreal, QC, Canada");

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden mt-4">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=-73.6,45.48,-73.5,45.55&layer=mapnik&marker=45.5,-73.57`}
        allowFullScreen
        title="Project Location Map"
      />
      <div className="mt-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-400 hover:text-teal-300 text-sm inline-flex items-center gap-1"
        >
          Open in Google Maps
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const projectIndex = Number.parseInt(id, 10);
  const project = projectsData[projectIndex] as ProjectRecord | undefined;

  if (!project || Number.isNaN(projectIndex)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#1e3a3a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white hover:text-gray-200 transition-colors mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Main Project Card */}
        <div className="bg-[#2d4a4a] rounded-lg p-8 text-white shadow-lg mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.address}</h1>
              <p className="text-gray-400 text-lg">{project.district}</p>
            </div>
            <div className="text-right">
              {project.decisionStatus === "Favorable" ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  ✓ {project.decisionStatus}
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ⏱ {project.decisionStatus}
                </span>
              )}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {project.type}
            </span>
            {project.projectStatus === "Active" ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                ● Active
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                ○ Stale
              </span>
            )}
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">Architect</h3>
              <p className="text-lg font-medium">{project.architect}</p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">Last Updated</h3>
              <p className="text-lg font-medium">{project.lastUpdate}</p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">Units</h3>
              <p className="text-lg font-medium">{project.units}</p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">Floors</h3>
              <p className="text-lg font-medium">{project.floors}</p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">
                Building Categories
              </h3>
              <p className="text-lg font-medium">
                {project.buildingCategories.join(", ")}
              </p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-sm text-gray-400 mb-1">Building Types</h3>
              <p className="text-lg font-medium">
                {project.buildingTypes.join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Timeline */}
          <div className="bg-[#2d4a4a] rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-bold">Project Timeline</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Last Update</p>
                  <p className="text-sm text-gray-400">{project.lastUpdate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-gray-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-gray-400">
                    {project.projectStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Location */}
          <div className="bg-[#2d4a4a] rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className="text-xl font-bold">Location</h2>
            </div>
            <div className="space-y-2">
              <p className="font-medium">{project.address}</p>
              <p className="text-gray-400">{project.district}</p>
              <ProjectMap address={project.address} />
            </div>
          </div>

          {/* Documents & Media */}
          <div className="bg-[#2d4a4a] rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-bold">Documents & Media</h2>
            </div>
            {project.media ? (
              <div className="space-y-2">
                <p className="text-gray-400">{project.media}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No documents available</p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-[#2d4a4a] rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-bold">Additional Information</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Decision Status</p>
                <p className="font-medium">{project.decisionStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Project Status</p>
                <p className="font-medium">{project.projectStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="font-medium">{project.type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/projects"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-center"
          >
            Back to All Projects
          </Link>
          <button
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            onClick={() => alert("Track project feature coming soon!")}
          >
            Track This Project
          </button>
        </div>
      </div>
    </div>
  );
}
