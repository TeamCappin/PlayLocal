"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  // const { t } = useTranslation();
  // I know this will be implemented later so we're commentinfg it out for now
  const router = useRouter();

  // Sample data with indices matching projects.json
  const recentProjects = [
    {
      index: 0,
      address: "1234 Rue Sainte-Catherine Est",
      district: "district_Ville-marie",
      type: "Résidentiel",
      status: "Favorable",
      categories: "RESIDENTIAL",
      date: "14/03/2024",
    },
    {
      index: 1,
      address: "5678 Avenue du Parc",
      district: "district_Plateau-Mont-Royal",
      type: "Commercial",
      status: "En cours",
      categories: "COMMERCIAL",
      date: "12/03/2024",
    },
    {
      index: 4,
      address: "910 Boulevard René-Lévesque",
      district: "district_Centre-ville",
      type: "Mixte",
      status: "Favorable",
      categories: "MIXED-USE",
      date: "10/03/2024",
    },
  ];

  const handleProjectClick = (index: number) => {
    router.push(`/projects/${index}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ...existing statistics cards... */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">
              Total des adresses
            </h3>
            <svg
              className="w-5 h-5 text-gray-400"
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
          </div>
          <div className="text-4xl font-bold mb-1">2500</div>
          <div className="text-xs text-gray-400">
            dans la base de données de Montréal
          </div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">
              Nouvelles adresses
            </h3>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div className="text-4xl font-bold mb-1">+0</div>
          <div className="text-xs text-gray-400">in the last 7 days</div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">Approuvés</h3>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-4xl font-bold mb-1">1729</div>
          <div className="text-xs text-gray-400">
            adresses avec issue favorable
          </div>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">
              En cours d&apos;examen
            </h3>
            <svg
              className="w-5 h-5 text-gray-400"
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
          </div>
          <div className="text-4xl font-bold mb-1">771</div>
          <div className="text-xs text-gray-400">
            adresses en attente de décision
          </div>
        </div>
      </div>

      {/* Opportunity Hub Snapshot */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Opportunity Hub Snapshot
            </h2>
            <p className="text-sm text-gray-400">
              A high-level overview of your sales pipeline.
            </p>
          </div>
          <Link
            href="/projects"
            className="px-4 py-2 bg-green-400 hover:bg-green-500 text-gray-900 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            View Hub
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ...existing opportunity cards... */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Total Opportunities
              </h3>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-xs text-gray-400">
              Projects currently in your pipeline
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Tracking</h3>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-xs text-gray-400">
              Opportunities being tracked
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Proposals Sent
              </h3>
              <svg
                className="w-5 h-5 text-gray-400"
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
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-xs text-gray-400">
              Projects with active proposals
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Deals Won</h3>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-xs text-gray-400">
              Successfully secured projects
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Recent Projects</h2>
            <p className="text-sm text-gray-400">
              Dernières adresses de construction ajoutées à la base de données.
            </p>
          </div>
          <Link
            href="/projects"
            className="text-sm text-gray-300 hover:text-white flex items-center gap-1"
          >
            Voir tout
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                      Adresse
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                      Building Categories
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr
                      key={project.index}
                      onClick={() => handleProjectClick(project.index)}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium">{project.address}</div>
                        <div className="text-xs text-gray-400">
                          {project.district}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">{project.type}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === "Favorable" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}`}
                        >
                          {project.status === "Favorable" ? "✓" : "⏱"}{" "}
                          {project.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {project.categories}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-400">
                        {project.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg h-64 lg:h-full min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 opacity-80"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="text-sm text-blue-200">Montreal Area Map</p>
                  <p className="text-xs text-blue-300 mt-1">
                    Project locations
                  </p>
                </div>
              </div>
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
