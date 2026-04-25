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
}

const DEFAULT_SECTION_IDS = new Set([
  'introduction',
  'shamir',
  'summation',
  'multiplication',
  'quantum',
  'security',
  'implementation',
  'references',
]);

export default function AdminDocsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<DocSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [editContent, setEditContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadSections();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedSection && sections.length > 0) {
      const section = sections.find(s => s.id === selectedSection);
      const savedContent = section?.content || '';
      setEditContent(resolveEditorDocContent(selectedSection, savedContent));
      setUploadStatus('');
    }
  }, [selectedSection, sections]);

  const loadSections = async () => {
    setIsLoadingDocs(true);
    setError('');
    const response = await fetch('/api/admin/docs', {
      credentials: 'include',
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Failed to load sections');
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
  };

  const handleSave = async () => {
    if (!selectedSection || isSaving) return;
    setError('');
    setSaveStatus('');

    if (!editContent.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/docs/${selectedSection}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: editContent,
          attachments: sections.find(s => s.id === selectedSection)?.attachments || [],
          contentMode: 'replace'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save section');
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setEditContent(updated.content || '');
      setSaveStatus('✅ Updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setError('Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedSection || isUploadingPdf) return;
    if (!selectedPdfFile) {
      setError('Please choose a PDF file first');
      return;
    }

    // Client-side size check (50 MB)
    const MAX_PDF_SIZE = 50 * 1024 * 1024;
    if (selectedPdfFile.size > MAX_PDF_SIZE) {
      setError('PDF is too large. Maximum allowed size is 50 MB.');
      return;
    }

    setError('');
    setUploadStatus('');
    setIsUploadingPdf(true);

    try {
      // Step 1: Get a signed upload token from our server (tiny request, no file data)
      const sigResponse = await fetch('/api/admin/docs/upload-signature', {
        method: 'POST',
        credentials: 'include',
      });

      const sigData = await sigResponse.json();
      if (!sigResponse.ok) {
        setError(sigData.error || 'Failed to get upload signature');
        return;
      }

      // Step 2: Upload the PDF directly to Cloudinary (bypasses Next.js body limit)
      const formData = new FormData();
      formData.append('file', selectedPdfFile);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', String(sigData.timestamp));
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);
      formData.append('resource_type', 'raw');
      formData.append('use_filename', 'true');
      formData.append('unique_filename', 'true');
      formData.append('access_mode', 'public');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/raw/upload`;
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setError(uploadData.error?.message || 'Cloudinary upload failed');
        return;
      }

      const fileName = selectedPdfFile.name;
      const fileUrl = uploadData.secure_url;

      // 1. Update markdown editor for visual representation
      const snippet = `
\n### 📄 PDF Document: ${fileName}
\n<div class="pdf-download-link" style="margin: 10px 0;">
  <a href="${fileUrl}" target="_blank" download="${fileName}" style="display: inline-flex; items-center: center; gap: 8px; padding: 10px 20px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
    📥 Download PDF: ${fileName}
  </a>
</div>
\n`;
      setEditContent((prev) => `${prev}${snippet}`);

      // 2. Update the local state for attachments (for the gallery)
      setSections(prev => prev.map(s => {
        if (s.id === selectedSection) {
          const updatedAttachments = [...(s.attachments || []), fileUrl];
          return { ...s, attachments: updatedAttachments };
        }
        return s;
      }));

      setUploadStatus('✅ PDF uploaded. Link added to editor and gallery.');
      setSelectedPdfFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch {
      setError('Failed to upload PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === selectedSection) {
        return {
          ...s,
          attachments: (s.attachments || []).filter(a => a !== url)
        };
      }
      return s;
    }));
  };

  const handleRestoreBuiltInContent = async () => {
    if (!selectedSection || !DEFAULT_SECTION_IDS.has(selectedSection)) return;

    setError('');
    setSaveStatus('');
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/docs/${selectedSection}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: '', contentMode: 'replace' }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to restore built-in content');
        return;
      }

      const updated = data.section as DocSection;
      setSections((prev) => prev.map((section) => (section.id === updated.id ? updated : section)));
      setEditContent('');
      setSaveStatus('✅ Restored built-in section content.');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setError('Failed to restore built-in content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewSection = async () => {
    const title = prompt('Enter section title:');
    if (!title) return;

    const icon = prompt('Enter section icon (emoji):') || '📄';

    const response = await fetch('/api/admin/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, icon }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to add section');
      return;
    }

    const created = data.section as DocSection;
    setSections((prev) => [...prev, created]);
    setSelectedSection(created.id);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    const response = await fetch(`/api/admin/docs/${sectionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to delete section');
      return;
    }

    const updatedSections = sections.filter(s => s.id !== sectionId);
    setSections(updatedSections);

    if (selectedSection === sectionId) {
      setSelectedSection('');
      setEditContent('');
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
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedSection === section.id
                        ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                      {sections.find(s => s.id === selectedSection)?.icon}{' '}
                      {sections.find(s => s.id === selectedSection)?.title}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Existing saved content is loaded here. If a default section is empty, built-in content is prefilled for editing.
                    </p>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter documentation content here..."
                    />
                  </div>

                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">PDF Upload</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">
                      Upload a PDF (up to 50 MB) and insert its link into the content. Click save after upload to publish the link.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-600"
                      />
                      <button
                        onClick={handleUploadPdf}
                        disabled={isUploadingPdf || !selectedPdfFile}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold rounded-lg transition-all"
                      >
                        {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
                      </button>
                    </div>
                    {uploadStatus && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">{uploadStatus}</p>
                    )}
                  </div>

                  {/* Attachments List */}
                  {sections.find(s => s.id === selectedSection)?.attachments && (sections.find(s => s.id === selectedSection)?.attachments?.length ?? 0) > 0 && (
                    <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3">Attached PDFs</p>
                      <div className="space-y-2">
                        {sections.find(s => s.id === selectedSection)?.attachments?.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-purple-100 dark:border-purple-900/50">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex-1 mr-2">
                              {url.split('/').pop()}
                            </a>
                            <button
                              onClick={() => handleRemoveAttachment(url)}
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      {isSaving ? 'Saving...' : '💾 Update Content'}
                    </button>
                    {DEFAULT_SECTION_IDS.has(selectedSection) && (
                      <button
                        onClick={handleRestoreBuiltInContent}
                        disabled={isSaving}
                        className="px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        {isSaving ? 'Saving...' : '♻ Restore Built-in'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSection('');
                        setEditContent('');
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      <strong>💡 Tip:</strong> You can use Markdown formatting including headers (# ## ###),
                      bold (**text**), italic (*text*), lists, code blocks, and PDF links.
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
