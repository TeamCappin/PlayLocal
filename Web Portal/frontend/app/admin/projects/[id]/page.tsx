"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import adminProjects from "@/data/admin-projects.json";

export default function AdminProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const project = adminProjects.find((p) => p.id === id);

  const [selectedStatus, setSelectedStatus] = useState(
    project?.status || "Draft"
  );
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [notes, setNotes] = useState("");

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Project Not Found
          </h2>
          <Link
            href="/admin/projects"
            className="text-teal-600 hover:text-teal-700"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    // In real implementation, this would call an API
    alert(`Status changed to: ${newStatus}`);
  };

  const mockDocuments = [
    {
      id: 1,
      name: "Building Permit Application.pdf",
      pages: 12,
      ocrConfidence: 98,
    },
    { id: 2, name: "Site Plan.pdf", pages: 3, ocrConfidence: 95 },
    { id: 3, name: "Architectural Drawings.pdf", pages: 24, ocrConfidence: 92 },
    { id: 4, name: "Zoning Approval.pdf", pages: 5, ocrConfidence: 99 },
    {
      id: 5,
      name: "Environmental Assessment.pdf",
      pages: 8,
      ocrConfidence: 88,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-gray-200 hover:text-white mb-4"
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
            Back to Projects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {project.address}
              </h1>
              <p className="text-gray-200">
                {project.district} • {project.type}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Verified">Verified</option>
                <option value="Published">Published</option>
              </select>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Details & Quality */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quality Score Card */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">
                Quality Metrics
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      Overall Quality
                    </span>
                    <span className="text-lg font-bold text-white">
                      {project.qualityScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        project.qualityScore >= 90
                          ? "bg-green-500"
                          : project.qualityScore >= 75
                            ? "bg-blue-500"
                            : "bg-orange-500"
                      }`}
                      style={{ width: `${project.qualityScore}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      OCR Confidence
                    </span>
                    <span className="text-lg font-bold text-white">
                      {project.ocrConfidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-teal-500 h-3 rounded-full"
                      style={{ width: `${project.ocrConfidence}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">Documents</span>
                    <span className="font-semibold text-white">
                      {project.documentsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Assigned To</span>
                    <span className="font-semibold text-white">
                      {project.assignedTo || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Anomalies Card */}
            {project.anomalies.length > 0 && (
              <div className="bg-orange-900/40 backdrop-blur-sm rounded-lg p-6 border border-orange-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-bold text-orange-200">Data Anomalies</h3>
                </div>
                <ul className="space-y-2">
                  {project.anomalies.map((anomaly, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-orange-200 flex items-start gap-2"
                    >
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>{anomaly}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Suggestions Card */}
            {project.aiSuggestions.length > 0 && (
              <div className="bg-blue-900/40 backdrop-blur-sm rounded-lg p-6 border border-blue-700">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="font-bold text-blue-200">AI Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {project.aiSuggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-blue-200 flex items-start gap-2"
                    >
                      <span className="text-blue-400 mt-0.5">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source Audit Trail */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
              <h3 className="font-bold text-white mb-4">Source Audit Trail</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Source URL</p>
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 break-all"
                  >
                    {project.sourceUrl}
                  </a>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">First Seen</p>
                  <p className="text-white font-medium">{project.firstSeen}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Last Refreshed</p>
                  <p className="text-white font-medium">{project.lastUpdate}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Content Hash</p>
                  <p className="text-white font-mono text-xs">
                    {project.sourceHash}
                  </p>
                </div>
                {project.changesDetected && (
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-purple-300">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">Changes Detected</span>
                    </div>
                    <button className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium">
                      View Changelog →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Project Data */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">
                Project Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue={project.address}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    defaultValue={project.district}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    defaultValue={project.type}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option>Résidentiel</option>
                    <option>Commercial</option>
                    <option>Institutionnel</option>
                    <option>Mixte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Architect
                  </label>
                  <input
                    type="text"
                    defaultValue={project.architect}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Units
                    </label>
                    <input
                      type="number"
                      defaultValue={project.units || ""}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Floors
                    </label>
                    <input
                      type="number"
                      defaultValue={project.floors}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Building Categories
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.buildingCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Building Types
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.buildingTypes.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Validator Notes */}
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
              <h3 className="font-bold text-white mb-4">Validator Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this project validation..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 min-h-[120px]"
              />
              <button className="mt-3 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 text-sm font-medium">
                Save Notes
              </button>
            </div>
          </div>

          {/* Right Column - Documents */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  Documents ({mockDocuments.length})
                </h2>
                <button className="text-teal-400 hover:text-teal-300 text-sm font-medium">
                  Upload New
                </button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {mockDocuments.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(idx);
                      setShowDocViewer(true);
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showDocViewer && selectedDoc === idx
                        ? "border-teal-500 bg-teal-900/30"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-8 h-8 text-red-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{doc.pages} pages</span>
                          <span>•</span>
                          <span>OCR: {doc.ocrConfidence}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 font-medium">
                Export All Documents
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer Modal */}
        {showDocViewer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {mockDocuments[selectedDoc].name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    OCR Confidence: {mockDocuments[selectedDoc].ocrConfidence}%
                  </p>
                </div>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-slate-100">
                {/* Mock Document Viewer with OCR Overlay */}
                <div className="bg-white rounded-lg p-8 max-w-3xl mx-auto shadow-lg">
                  <div className="space-y-4 text-slate-700">
                    <div
                      className="p-4 bg-blue-50 border-2 border-blue-300 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                      title="OCR Confidence: 98%"
                    >
                      <p className="font-bold">BUILDING PERMIT APPLICATION</p>
                    </div>
                    <div
                      className="p-3 bg-green-50 border-2 border-green-300 rounded cursor-pointer hover:bg-green-100 transition-colors"
                      title="OCR Confidence: 99%"
                    >
                      <p>Address: {project.address}</p>
                    </div>
                    <div
                      className="p-3 bg-green-50 border-2 border-green-300 rounded cursor-pointer hover:bg-green-100 transition-colors"
                      title="OCR Confidence: 97%"
                    >
                      <p>District: {project.district}</p>
                    </div>
                    <div
                      className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded cursor-pointer hover:bg-yellow-100 transition-colors"
                      title="OCR Confidence: 85% - Review Required"
                    >
                      <p>Architect: {project.architect}</p>
                    </div>
                    <div
                      className="p-3 bg-green-50 border-2 border-green-300 rounded cursor-pointer hover:bg-green-100 transition-colors"
                      title="OCR Confidence: 96%"
                    >
                      <p>Number of Floors: {project.floors}</p>
                    </div>
                    {project.units && (
                      <div
                        className="p-3 bg-green-50 border-2 border-green-300 rounded cursor-pointer hover:bg-green-100 transition-colors"
                        title="OCR Confidence: 94%"
                      >
                        <p>Number of Units: {project.units}</p>
                      </div>
                    )}
                    <div className="mt-6 p-6 bg-slate-50 rounded">
                      <p className="text-sm text-slate-500 mb-2">
                        <strong>Legend:</strong>
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                          <span>High Confidence (&gt;90%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                          <span>Good Confidence (75-90%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                          <span>Low Confidence (&lt;75%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
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
                  </button>
                  <span className="text-sm text-slate-600">
                    Page 1 of {mockDocuments[selectedDoc].pages}
                  </span>
                  <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">
                    Download
                  </button>
                  <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium">
                    Verify OCR Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
