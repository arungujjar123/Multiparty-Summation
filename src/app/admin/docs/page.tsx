/**
 * @fileoverview Admin Documentation Management
 */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { resolveEditorDocContent } from "@/lib/docsBuiltIn";

interface DocSection {
  id: string;
  title: string;
  content: string;
  attachments?: string[];
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

const DEFAULT_SECTION_IDS = new Set([
  "introduction",
  "shamir",
  "summation",
  "multiplication",
  "quantum",
  "security",
  "implementation",
  "references",
]);

export default function AdminDocsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<DocSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editContent, setEditContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const activeSection = sections.find((section) => section.id === selectedSection);

  const loadSections = React.useCallback(async () => {
    setIsLoadingDocs(true);
    setError("");
    try {
      const response = await fetch("/api/admin/docs", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load sections");
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
    } catch {
      setError("Failed to load sections");
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/login");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadSections();
    }
  }, [isAdmin, loadSections]);

  useEffect(() => {
    if (selectedSection && sections.length > 0) {
      const section = sections.find((s) => s.id === selectedSection);
      const content = section?.content || "";
      setEditContent(resolveEditorDocContent(selectedSection, content));
      setSelectedPdfFile(null);
      setUploadStatus("");
    }
  }, [selectedSection, sections]);

  const handleSave = async () => {
    if (!selectedSection || isSaving) return;
    setError("");
    setSaveStatus("");

    if (!editContent.trim()) {
      setError("Content cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/docs/${selectedSection}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: editContent,
          attachments: sections.find((s) => s.id === selectedSection)?.attachments || [],
          contentMode: "replace",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to save section");
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setEditContent(updated.content || "");
      setSaveStatus("✅ Updated successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setError("Failed to save section");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedSection || isUploadingPdf) return;
    if (!selectedPdfFile) {
      setError("Please choose a PDF file first");
      return;
    }

    const MAX_PDF_SIZE = 50 * 1024 * 1024;
    if (selectedPdfFile.size > MAX_PDF_SIZE) {
      setError("PDF is too large. Maximum allowed size is 50 MB.");
      return;
    }

    setError("");
    setUploadStatus("");
    setIsUploadingPdf(true);

    try {
      const sigResponse = await fetch("/api/admin/docs/upload-signature", {
        method: "POST",
        credentials: "include",
      });

      const sigData = await sigResponse.json();
      if (!sigResponse.ok) {
        setError(sigData.error || "Failed to get upload signature");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedPdfFile);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", String(sigData.timestamp));
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);
      formData.append("resource_type", "raw");
      formData.append("use_filename", "true");
      formData.append("unique_filename", "true");
      formData.append("access_mode", "public");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/raw/upload`;
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setError(uploadData.error?.message || "Cloudinary upload failed");
        return;
      }

      const fileName = selectedPdfFile.name;
      const fileUrl = uploadData.secure_url;

      const snippet = `\n### 📄 PDF Document: ${fileName}\n\n<div class="pdf-download-link" style="margin: 10px 0;">\n  <a href="${fileUrl}" target="_blank" download="${fileName}" style="display: inline-flex; items-center: center; gap: 8px; padding: 10px 20px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">\n    📥 Download PDF: ${fileName}\n  </a>\n</div>\n`;
      setEditContent((prev) => `${prev}${snippet}`);

      setSections((prev) =>
        prev.map((s) => {
          if (s.id === selectedSection) {
            const updatedAttachments = [...(s.attachments || []), fileUrl];
            return { ...s, attachments: updatedAttachments };
          }
          return s;
        })
      );

      setUploadStatus("✅ PDF uploaded. Link added to editor and gallery.");
      setSelectedPdfFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch {
      setError("Failed to upload PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === selectedSection) {
          return {
            ...s,
            attachments: (s.attachments || []).filter((a) => a !== url),
          };
        }
        return s;
      })
    );
  };

  const handleRestoreBuiltInContent = async () => {
    if (!selectedSection || !DEFAULT_SECTION_IDS.has(selectedSection)) return;

    setError("");
    setSaveStatus("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/docs/${selectedSection}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: "", contentMode: "replace" }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to restore built-in content");
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setEditContent("");
      setSaveStatus("✅ Restored built-in section content.");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setError("Failed to restore built-in content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewSection = async () => {
    const title = prompt("Enter section title:");
    if (!title) return;

    const icon = prompt("Enter section icon (emoji):") || "📄";

    try {
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
    } catch {
      setError("Failed to add section");
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
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
    } catch {
      setError("Failed to delete section");
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
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
              📝 Documentation Manager
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Edit and manage documentation content</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sections</h2>
                <button
                  onClick={handleAddNewSection}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  + Add New
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedSection === section.id
                        ? "bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{section.icon}</span>
                      <span className="font-bold text-sm truncate">{section.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className={`px-2 py-2 rounded-lg transition-all ${selectedSection === section.id ? "bg-white/20 hover:bg-white/40" : "bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100"}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              {selectedSection ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {activeSection?.icon} {activeSection?.title}
                    </h2>
                    {saveStatus && (
                      <span className="text-green-600 dark:text-green-400 font-bold animate-bounce">
                        {saveStatus}
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Content (Markdown)
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-inner"
                      placeholder="Start typing your documentation..."
                    />
                  </div>

                  <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <span>📁</span> PDF Attachment Manager
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-500 file:text-white hover:file:bg-amber-600 file:transition-all cursor-pointer"
                      />
                      <button
                        onClick={handleUploadPdf}
                        disabled={isUploadingPdf || !selectedPdfFile}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                      >
                        {isUploadingPdf ? "Uploading..." : "Upload PDF"}
                      </button>
                    </div>
                    {uploadStatus && (
                      <p className="text-xs font-bold text-green-600 dark:text-green-400">
                        {uploadStatus}
                      </p>
                    )}
                  </div>

                  {((activeSection?.attachments?.length ?? 0) > 0 ||
                    (activeSection?.pdfs?.length ?? 0) > 0) && (
                    <div className="mb-6 p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-2xl shadow-sm">
                      <h3 className="text-sm font-bold text-purple-900 dark:text-purple-400 mb-3 flex items-center gap-2">
                        <span>📄</span> Attached Files Gallery
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Both branch's PDF systems are supported */}
                        {activeSection?.attachments?.map((url, idx) => (
                          <div
                            key={`attr-${idx}`}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm group"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 truncate flex-1 mr-2"
                            >
                              {url.split("/").pop()}
                            </a>
                            <button
                              onClick={() => handleRemoveAttachment(url)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        {activeSection?.pdfs?.map((pdf, idx) => (
                          <div
                            key={`pdf-${idx}`}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm group"
                          >
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 truncate flex-1 mr-2"
                            >
                              {pdf.name || pdf.url.split("/").pop()}
                            </a>
                            <p className="text-[10px] text-gray-400 mr-2">
                              {new Date(pdf.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
                    >
                      <span>{isSaving ? "⏳" : "💾"}</span>
                      {isSaving ? "Saving..." : "Update Documentation"}
                    </button>
                    {DEFAULT_SECTION_IDS.has(selectedSection) && (
                      <button
                        onClick={handleRestoreBuiltInContent}
                        disabled={isSaving}
                        className="px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 active:scale-95 transition-all"
                      >
                        ♻ Restore Default Content
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSection("");
                        setEditContent("");
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <strong>💡 Pro Tip:</strong> Your changes are live immediately after saving.
                      Use the preview in the main docs page to verify formatting. Cloudinary uploads
                      bypass server limits for large PDFs.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400 dark:text-gray-600">
                  <div className="text-8xl mb-6 animate-pulse">📚</div>
                  <h3 className="text-2xl font-bold mb-2">Editor Ready</h3>
                  <p>Select a section from the left sidebar to begin managing content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
