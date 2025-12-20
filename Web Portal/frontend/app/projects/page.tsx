"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useRouter } from "next/navigation";
import projectsData from "@/datatmp/projects.json";
import type { ProjectRecord } from "@/models/Projects";

export default function Projects() {
  const { t } = useTranslation();
  const router = useRouter();
  const projects = projectsData as ProjectRecord[];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.decisionStatus === filterStatus;
    const matchesType = filterType === "all" || project.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRowClick = (index: number) => {
    const project = filteredProjects[index];
    const originalIndex = projects.findIndex(
      (p) => p.address === project.address
    );
    router.push(`/projects/${originalIndex}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 p-6">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("projects.title")}</h1>
        <p className="text-gray-300">{t("projects.body")}</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label
              htmlFor="search-projects"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              {t("projects.searchPlaceholder")}
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="search-projects"
                type="text"
                placeholder="Search by address or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="Favorable">Favorable</option>
              <option value="In Review">In Review</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="type-filter"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Type
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Types</option>
              <option value="Résidentiel">Résidentiel</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixte">Mixte</option>
              <option value="Institutionnel">Institutionnel</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-semibold text-white">
              {filteredProjects.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-white">{projects.length}</span>{" "}
            projects
          </p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 text-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Address
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  District
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Decision
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Architect
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Categories
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No projects found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr
                    key={p.address}
                    onClick={() =>
                      handleRowClick(projects.findIndex((fp) => fp.address === p.address))
                    }
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium">{p.address}</div>
                      <div className="text-xs text-gray-400">{p.architect}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {p.district}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {p.decisionStatus === "Favorable" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ {p.decisionStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ⏱ {p.decisionStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {p.projectStatus === "Active" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                          ● Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          ○ Stale
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {p.architect}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {p.buildingCategories.join(", ")}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-400">
                      {p.lastUpdate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
