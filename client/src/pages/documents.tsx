import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { FileText, Folder, FolderOpen, ChevronRight, ChevronDown, Download, Eye, FileIcon, File } from "lucide-react";
import type { DriveFolder, DriveFile } from "@shared/schema";

const fileTypeIcons: Record<string, { icon: string; color: string }> = {
  "application/pdf": { icon: "PDF", color: "#DC3545" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "DOCX", color: "#2B579A" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { icon: "XLSX", color: "#217346" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { icon: "PPTX", color: "#D24726" },
  "image/jpeg": { icon: "JPG", color: "#F7931E" },
  "image/png": { icon: "PNG", color: "#F7931E" },
  "text/plain": { icon: "TXT", color: "#6c757d" },
};

interface FolderItemProps {
  folder: DriveFolder;
  level: number;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  onSelectFile: (file: DriveFile) => void;
}

function FolderItem({ folder, level, expanded, toggleExpand, onSelectFile }: FolderItemProps) {
  const isExpanded = expanded.has(folder.id);
  
  return (
    <div>
      <button
        onClick={() => toggleExpand(folder.id)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
        style={{ paddingLeft: `${12 + level * 16}px`, color: "#E3D095" }}
        data-testid={`folder-${folder.id}`}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {isExpanded ? 
          <FolderOpen className="w-5 h-5" style={{ color: "#E69500" }} /> : 
          <Folder className="w-5 h-5" style={{ color: "#E69500" }} />
        }
        <span className="font-medium text-sm">{folder.name}</span>
      </button>
      
      {isExpanded && (
        <div>
          {folder.children?.map(child => (
            <FolderItem 
              key={child.id} 
              folder={child} 
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onSelectFile={onSelectFile}
            />
          ))}
          {folder.files?.map(file => (
            <FileItem key={file.id} file={file} level={level + 1} onClick={() => onSelectFile(file)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: DriveFile;
  level: number;
  onClick: () => void;
}

function FileItem({ file, level, onClick }: FileItemProps) {
  const fileType = fileTypeIcons[file.mimeType] || { icon: "FILE", color: "#6c757d" };
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
      style={{ paddingLeft: `${28 + level * 16}px`, color: "#E3D095" }}
      data-testid={`file-${file.id}`}
    >
      <div 
        className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white"
        style={{ background: fileType.color }}
      >
        {fileType.icon.slice(0, 3)}
      </div>
      <span className="font-medium text-sm truncate">{file.name}</span>
    </button>
  );
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  const { data: folders = [], isLoading } = useQuery<DriveFolder[]>({
    queryKey: ["/api/documents"],
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1E32" }}>
      <BackgroundPattern />
      <Header title="DOCUMENT MANAGEMENT" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div 
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(121, 101, 193, 0.4)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2" style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #E69500, #E69500CC)" }}
                >
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ color: "#E3D095", textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
                  data-testid="text-documents-title"
                >
                  Document Management
                </h2>
              </div>
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search documents..." 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div 
                className="rounded-xl p-4 lg:col-span-1 max-h-[600px] overflow-y-auto"
                style={{ background: "rgba(255, 255, 255, 0.05)" }}
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#E3D095" }}>
                  <Folder className="w-5 h-5" style={{ color: "#E69500" }} />
                  Folders
                </h3>

                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : folders.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "rgba(227, 208, 149, 0.6)" }}>
                    No folders available
                  </p>
                ) : (
                  <div className="space-y-1">
                    {folders.map(folder => (
                      <FolderItem 
                        key={folder.id} 
                        folder={folder} 
                        level={0}
                        expanded={expanded}
                        toggleExpand={toggleExpand}
                        onSelectFile={setSelectedFile}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div 
                className="rounded-xl p-6 lg:col-span-2 max-h-[600px] overflow-y-auto"
                style={{ background: "rgba(255, 255, 255, 0.05)" }}
              >
                {selectedFile ? (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: fileTypeIcons[selectedFile.mimeType]?.color || "#6c757d" }}
                      >
                        {(fileTypeIcons[selectedFile.mimeType]?.icon || "FILE").slice(0, 3)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1" style={{ color: "#E3D095" }} data-testid="text-file-name">
                          {selectedFile.name}
                        </h3>
                        <p className="text-sm" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                          {selectedFile.mimeType}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: "rgba(121, 101, 193, 0.1)" }}>
                      <div>
                        <p className="text-xs mb-1" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Size</p>
                        <p className="font-semibold" style={{ color: "#E3D095" }}>
                          {selectedFile.size ? `${(parseInt(selectedFile.size) / 1024).toFixed(2)} KB` : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Modified</p>
                        <p className="font-semibold" style={{ color: "#E3D095" }}>
                          {selectedFile.modifiedTime ? new Date(selectedFile.modifiedTime).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {selectedFile.webViewLink && (
                        <a
                          href={selectedFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                          style={{ background: "#E69500", color: "white" }}
                          data-testid="button-view-file"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                      )}
                      {selectedFile.webContentLink && (
                        <a
                          href={selectedFile.webContentLink}
                          download
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                          style={{ background: "rgba(255, 255, 255, 0.1)", color: "#E3D095" }}
                          data-testid="button-download-file"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ) : folders.length > 0 && folders[0].files && folders[0].files.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4" style={{ color: "#E3D095" }}>
                      All Documents ({folders[0].files.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {folders[0].files.map(file => {
                        const fileType = fileTypeIcons[file.mimeType] || { icon: "FILE", color: "#6c757d" };
                        return (
                          <button
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white/10 text-left"
                            style={{ background: "rgba(255, 255, 255, 0.03)" }}
                          >
                            <div 
                              className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: fileType.color }}
                            >
                              {fileType.icon.slice(0, 3)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" style={{ color: "#E3D095" }}>
                                {file.name}
                              </p>
                              <p className="text-xs" style={{ color: "rgba(227, 208, 149, 0.5)" }}>
                                {file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : "Unknown size"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={File}
                    title="No documents found"
                    description="No documents are available in this folder."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
