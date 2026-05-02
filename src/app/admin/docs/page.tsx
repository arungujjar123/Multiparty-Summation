/**
 * @fileoverview Admin Documentation Management
 */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface DocSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  lastModified: string;
  pdfs?: DocPdf[];
}

interface DocPdf {
  url: string;
  name: string;
  uploadedAt: string;
  publicId: string;
}

export default function AdminDocsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<DocSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editContent, setEditContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfError, setPdfError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const activeSection = sections.find((section) => section.id === selectedSection);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/login");
    }
  }, [isAdmin, isLoading, router]);

  const loadSections = React.useCallback(async () => {
    setIsLoadingDocs(true);
    setError("");
    const response = await fetch("/api/admin/docs", {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to load sections");
      setIsLoadingDocs(false);
      return;
    }

    const loadedSections = data.sections || [];
    setSections(loadedSections);
    if (loadedSections.length > 0) {
      setSelectedSection((current) =>
        loadedSections.some((section: DocSection) => section.id === current)
          ? current
          : loadedSections[0].id
      );
    }
    setIsLoadingDocs(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      Promise.resolve().then(() => {
        loadSections();
      });
    }
  }, [isAdmin, loadSections]);

  useEffect(() => {
    if (selectedSection && sections.length > 0) {
      const section = sections.find((s) => s.id === selectedSection);
      const content = section?.content || "";
      Promise.resolve().then(() => {
        setEditContent(content);
        setSelectedPdf(null);
        setPdfStatus("");
        setPdfError("");
        if (pdfInputRef.current) {
          pdfInputRef.current.value = "";
        }
      });
    }
  }, [selectedSection, sections]);

  const handleSave = async () => {
    if (!selectedSection) return;
    setError("");

    const response = await fetch(`/api/admin/docs/${selectedSection}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: editContent }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Failed to save section");
      return;
    }

    const updated = data.section as DocSection;
    setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
    setSaveStatus("✅ Saved successfully!");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleAddNewSection = async () => {
    const title = prompt("Enter section title:");
    if (!title) return;

    const icon = prompt("Enter section icon (emoji):") || "📄";

    const response = await fetch("/api/admin/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, icon }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Failed to add section");
      return;
    }

    const created = data.section as DocSection;
    setSections((prev) => [...prev, created]);
    setSelectedSection(created.id);
  };

  const handlePdfUpload = async () => {
    if (!selectedSection || !selectedPdf) return;

    setPdfError("");
    setPdfStatus("");
    setIsUploadingPdf(true);

    try {
      const formData = new FormData();
      formData.set("file", selectedPdf);

      const response = await fetch(`/api/admin/docs/${selectedSection}/pdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setPdfError(data.error || "Failed to upload PDF");
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setPdfStatus("✅ PDF uploaded successfully!");
      setSelectedPdf(null);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    } catch {
      setPdfError("Failed to upload PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handlePdfRemove = async (publicId: string) => {
    if (!selectedSection || !publicId) return;

    setPdfError("");
    setPdfStatus("");
    setIsUploadingPdf(true);

    try {
      const response = await fetch(`/api/admin/docs/${selectedSection}/pdf`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPdfError(data.error || "Failed to remove PDF");
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setPdfStatus("🗑️ PDF removed.");
    } catch {
      setPdfError("Failed to remove PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    const response = await fetch(`/api/admin/docs/${sectionId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Failed to delete section");
      return;
    }

    const updatedSections = sections.filter((s) => s.id !== sectionId);
    setSections(updatedSections);

    if (selectedSection === sectionId) {
      setSelectedSection("");
      setEditContent("");
    }
  };

  if (isLoading || isLoadingDocs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen hero-surface hero-grid py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
              📝 Documentation Manager
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Edit and manage documentation content</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Sections</h2>
                <button
                  onClick={handleAddNewSection}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-all"
                  title="Add new section"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSection === section.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{section.icon}</span>
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              {selectedSection ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {activeSection?.icon} {activeSection?.title}
                    </h2>
                    {saveStatus && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {saveStatus}
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content (Markdown supported)
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter documentation content here..."
                    />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      PDF Attachment
                    </h3>
                                    {activeSection?.pdfs && activeSection.pdfs.length > 0 ? (
                                      <div className="mb-3 space-y-2">
                                        {activeSection.pdfs.map((pdf) => (
                                          <div
                                            key={pdf.publicId || pdf.url}
                                            className="flex flex-wrap items-center gap-3"
                                          >
                                            <a
                                              href={pdf.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                                            >
                                              📄 {pdf.name || "View PDF"}
                                            </a>
                                            <button
                                              onClick={() => handlePdfRemove(pdf.publicId)}
                                              disabled={!pdf.publicId || isUploadingPdf}
                                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        No PDF attached yet.
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setSelectedPdf(file);
                          setPdfStatus("");
                          setPdfError("");
                        }}
                        className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/40 dark:file:text-purple-200"
                      />
                      <button
                        onClick={handlePdfUpload}
                        disabled={!selectedPdf || isUploadingPdf}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-60"
                      >
                        {isUploadingPdf ? "Uploading..." : "Upload PDF"}
                      </button>
                    </div>

                    {pdfError && (
                      <div className="mt-3 text-xs text-red-600 dark:text-red-400">{pdfError}</div>
                    )}
                    {pdfStatus && (
                      <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                        {pdfStatus}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      💾 Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSection("");
                        setEditContent("");
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      <strong>💡 Tip:</strong> You can use Markdown formatting including headers (#
                      ## ###), bold (**text**), italic (*text*), lists, and code blocks.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg">Select a section to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
