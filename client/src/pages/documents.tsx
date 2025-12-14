import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  FileIcon,
  File,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import type { DriveFolder, DriveFile } from "@shared/schema";

const fileTypeIcons: Record<string, { icon: string; color: string }> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: "DOCX",
    color: "#2B579A",
  },
  "application/msword": {
    icon: "DOC",
    color: "#2B579A",
  },
  "application/vnd.ms-word.document.macroEnabled.12": {
    icon: "DOCM",
    color: "#2B579A",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    icon: "DOTX",
    color: "#2B579A",
  },
  "application/vnd.ms-word.template.macroEnabled.12": {
    icon: "DOTM",
    color: "#2B579A",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: "XLSX",
    color: "#217346",
  },
  "application/vnd.ms-excel": {
    icon: "XLS",
    color: "#217346",
  },
  "application/vnd.ms-excel.sheet.macroEnabled.12": {
    icon: "XLSM",
    color: "#217346",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    icon: "XLTX",
    color: "#217346",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: "PPTX",
    color: "#D24726",
  },
  "application/vnd.ms-powerpoint": {
    icon: "PPT",
    color: "#D24726",
  },
  "application/vnd.ms-powerpoint.presentation.macroEnabled.12": {
    icon: "PPTM",
    color: "#D24726",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    icon: "POTX",
    color: "#D24726",
  },
  "application/pdf": {
    icon: "PDF",
    color: "#DC3545",
  },
  "text/plain": {
    icon: "TXT",
    color: "#6c757d",
  },
  "text/csv": {
    icon: "CSV",
    color: "#217346",
  },
  default: {
    icon: "FILE",
    color: "#6c757d",
  },
};

const documentTypeGroups = {
  word: {
    name: "Word Documents",
    icon: <FileText className="w-5 h-5" />,
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.ms-word.document.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
      "application/vnd.ms-word.template.macroEnabled.12",
    ],
    extensions: [".docx", ".doc", ".docm", ".dotx", ".dotm"],
  },
  excel: {
    name: "Excel Spreadsheets",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    ],
    extensions: [".xlsx", ".xls", ".xlsm", ".xltx", ".csv"],
  },
  powerpoint: {
    name: "PowerPoint Presentations",
    icon: <Presentation className="w-5 h-5" />,
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
      "application/vnd.openxmlformats-officedocument.presentationml.template",
    ],
    extensions: [".pptx", ".ppt", ".pptm", ".potx"],
  },
  pdf: {
    name: "PDF Documents",
    icon: <FileText className="w-5 h-5" />,
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  text: {
    name: "Text Files",
    icon: <FileText className="w-5 h-5" />,
    mimeTypes: ["text/plain", "text/csv"],
    extensions: [".txt", ".csv"],
  },
};

interface SubfolderInfo {
  id: string;
  name: string;
}

interface SidebarFolderItemProps {
  folderId: string;
  folderName: string;
  level: number;
  expandedFolders: Set<string>;
  selectedFolderId: string | null;
  subfolderCache: Map<string, SubfolderInfo[]>;
  onToggleExpand: (folderId: string) => void;
  onSelectFolder: (folderId: string, folderName: string) => void;
}

function SidebarFolderItem({
  folderId,
  folderName,
  level,
  expandedFolders,
  selectedFolderId,
  subfolderCache,
  onToggleExpand,
  onSelectFolder,
}: SidebarFolderItemProps) {
  const isExpanded = expandedFolders.has(folderId);
  const isSelected = selectedFolderId === folderId;
  const subfolders = subfolderCache.get(folderId) || [];

  return (
    <div>
      <button
        onClick={() => {
          onSelectFolder(folderId, folderName);
          if (subfolders.length > 0 || !subfolderCache.has(folderId)) {
            onToggleExpand(folderId);
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isSelected ? "bg-[#FFEAA7]/30" : "hover:bg-white/10"
        }`}
        style={{ paddingLeft: `${12 + level * 16}px`, color: "#5D4037" }}
        data-testid={`folder-${folderId}`}
      >
        {subfolders.length > 0 ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-5 h-5" style={{ color: "#D68A3D" }} />
        ) : (
          <Folder className="w-5 h-5" style={{ color: "#D68A3D" }} />
        )}
        <span className="font-medium text-sm truncate">{folderName}</span>
      </button>

      {isExpanded && subfolders.length > 0 && (
        <div>
          {subfolders.map((subfolder) => (
            <SidebarFolderItem
              key={subfolder.id}
              folderId={subfolder.id}
              folderName={subfolder.name}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedFolderId={selectedFolderId}
              subfolderCache={subfolderCache}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function isDocumentFile(mimeType: string, fileName: string): boolean {
  const documentMimeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-word.document.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/vnd.ms-word.template.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.presentationml.template",
    "application/pdf",
    "text/plain",
    "text/csv",
  ];

  if (documentMimeTypes.includes(mimeType)) {
    return true;
  }

  const documentExtensions = [
    ".docx",
    ".doc",
    ".docm",
    ".dotx",
    ".dotm",
    ".xlsx",
    ".xls",
    ".xlsm",
    ".xltx",
    ".pptx",
    ".ppt",
    ".pptm",
    ".potx",
    ".pdf",
    ".txt",
    ".csv",
  ];

  const lowerFileName = fileName.toLowerCase();
  return documentExtensions.some((ext) => lowerFileName.endsWith(ext));
}

function getFileTypeConfig(mimeType: string, fileName: string) {
  if (fileTypeIcons[mimeType]) {
    return fileTypeIcons[mimeType];
  }

  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "docx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
    case "doc":
      return fileTypeIcons["application/msword"];
    case "docm":
      return fileTypeIcons["application/vnd.ms-word.document.macroEnabled.12"];
    case "dotx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template"
      ];
    case "dotm":
      return fileTypeIcons["application/vnd.ms-word.template.macroEnabled.12"];
    case "xlsx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
    case "xls":
      return fileTypeIcons["application/vnd.ms-excel"];
    case "xlsm":
      return fileTypeIcons["application/vnd.ms-excel.sheet.macroEnabled.12"];
    case "xltx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template"
      ];
    case "pptx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ];
    case "ppt":
      return fileTypeIcons["application/vnd.ms-powerpoint"];
    case "pptm":
      return fileTypeIcons[
        "application/vnd.ms-powerpoint.presentation.macroEnabled.12"
      ];
    case "potx":
      return fileTypeIcons[
        "application/vnd.openxmlformats-officedocument.presentationml.template"
      ];
    case "pdf":
      return fileTypeIcons["application/pdf"];
    case "txt":
      return fileTypeIcons["text/plain"];
    case "csv":
      return fileTypeIcons["text/csv"];
    default:
      return fileTypeIcons["default"];
  }
}

function getDocumentType(mimeType: string, fileName: string): string {
  const lowerFileName = fileName.toLowerCase();

  if (
    documentTypeGroups.word.mimeTypes.includes(mimeType) ||
    documentTypeGroups.word.extensions.some((ext) =>
      lowerFileName.endsWith(ext),
    )
  ) {
    return "word";
  }

  if (
    documentTypeGroups.excel.mimeTypes.includes(mimeType) ||
    documentTypeGroups.excel.extensions.some((ext) =>
      lowerFileName.endsWith(ext),
    )
  ) {
    return "excel";
  }

  if (
    documentTypeGroups.powerpoint.mimeTypes.includes(mimeType) ||
    documentTypeGroups.powerpoint.extensions.some((ext) =>
      lowerFileName.endsWith(ext),
    )
  ) {
    return "powerpoint";
  }

  if (
    documentTypeGroups.pdf.mimeTypes.includes(mimeType) ||
    documentTypeGroups.pdf.extensions.some((ext) => lowerFileName.endsWith(ext))
  ) {
    return "pdf";
  }

  if (
    documentTypeGroups.text.mimeTypes.includes(mimeType) ||
    documentTypeGroups.text.extensions.some((ext) =>
      lowerFileName.endsWith(ext),
    )
  ) {
    return "text";
  }

  return "other";
}

function formatFileSize(bytes?: string) {
  if (!bytes) return "Unknown";
  const size = parseInt(bytes);
  if (size === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("Documents");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [subfolderCache, setSubfolderCache] = useState<Map<string, SubfolderInfo[]>>(new Map());

  const { data: documentFolders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: ["/api/documents"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: folderContents, isLoading: filesLoading } = useQuery<DriveFolder>({
    queryKey: ["/api/documents/folder", selectedFolderId],
    enabled: !!selectedFolderId,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (folderContents?.subfolders && selectedFolderId && !subfolderCache.has(selectedFolderId)) {
      const newCache = new Map(subfolderCache);
      newCache.set(selectedFolderId, folderContents.subfolders);
      setSubfolderCache(newCache);
    }
  }, [folderContents, selectedFolderId]);

  const files = folderContents?.files || [];

  const toggleFolderExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSelectFolder = (folderId: string, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    setSelectedFile(null);
  };

  const documentFiles = files
    .filter((file) => isDocumentFile(file.mimeType || "", file.name || ""))
    .filter((file) =>
      file.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const groupedFiles = documentFiles.reduce(
    (acc, file) => {
      const docType = getDocumentType(file.mimeType || "", file.name || "");
      if (!acc[docType]) {
        acc[docType] = [];
      }
      acc[docType].push(file);
      return acc;
    },
    {} as Record<string, DriveFile[]>,
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #FFF8E1, #FFECB3)" }}
    >
      <BackgroundPattern />
      <Header title="DOCUMENT MANAGEMENT" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8 shadow-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(214, 138, 61, 0.3)",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(214, 138, 61, 0.3)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #FFEAA7, #FFD54F)",
                    border: "1px solid #D68A3D",
                  }}
                >
                  <FileText className="w-6 h-6 text-[#5D4037]" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{
                    color: "#5D4037",
                  }}
                >
                  Document Management
                </h2>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents..."
                className="bg-white border-2 border-[#FFEAA7] focus:border-[#FFD54F]"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className="rounded-xl p-4 lg:col-span-1 max-h-[600px] overflow-y-auto shadow-inner"
                style={{ background: "rgba(255, 236, 179, 0.3)" }}
              >
                <h3
                  className="font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "#5D4037" }}
                >
                  <Folder className="w-5 h-5" style={{ color: "#D68A3D" }} />
                  Folders
                </h3>

                {foldersLoading ? (
                  <LoadingSpinner size="sm" />
                ) : documentFolders.length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: "rgba(93, 64, 55, 0.7)" }}
                  >
                    No folders available
                  </p>
                ) : (
                  <div className="space-y-1">
                    {documentFolders.map((folder) => (
                      <SidebarFolderItem
                        key={folder.id}
                        folderId={folder.id}
                        folderName={folder.name}
                        level={0}
                        expandedFolders={expandedFolders}
                        selectedFolderId={selectedFolderId}
                        subfolderCache={subfolderCache}
                        onToggleExpand={toggleFolderExpand}
                        onSelectFolder={handleSelectFolder}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div
                className="rounded-xl p-6 lg:col-span-2 shadow-inner"
                style={{ background: "rgba(255, 255, 255, 0.7)" }}
              >
                {selectedFile ? (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-md"
                        style={{
                          background: getFileTypeConfig(
                            selectedFile.mimeType || "",
                            selectedFile.name || "",
                          ).color,
                        }}
                      >
                        {getFileTypeConfig(
                          selectedFile.mimeType || "",
                          selectedFile.name || "",
                        ).icon.slice(0, 4)}
                      </div>
                      <div className="flex-1">
                        <h3
                          className="text-xl font-bold mb-1"
                          style={{ color: "#5D4037" }}
                          data-testid="text-file-name"
                        >
                          {selectedFile.name}
                        </h3>
                        <p
                          className="text-sm"
                          style={{ color: "rgba(93, 64, 55, 0.7)" }}
                        >
                          {selectedFile.mimeType}
                        </p>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                      style={{ background: "rgba(255, 234, 167, 0.5)" }}
                    >
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(93, 64, 55, 0.7)" }}
                        >
                          Size
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "#5D4037" }}
                        >
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(93, 64, 55, 0.7)" }}
                        >
                          Modified
                        </p>
                        <p
                          className="font-semibold"
                          style={{ color: "#5D4037" }}
                        >
                          {selectedFile.modifiedTime
                            ? new Date(
                                selectedFile.modifiedTime,
                              ).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {selectedFile.webViewLink && (
                        <a
                          href={selectedFile.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{ background: "#FFD54F", color: "#5D4037" }}
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
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{
                            background: "rgba(214, 138, 61, 0.2)",
                            color: "#5D4037",
                            border: "1px solid rgba(214, 138, 61, 0.3)",
                          }}
                          data-testid="button-download-file"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ) : selectedFolderId ? (
                  <div>
                    <div className="mb-6">
                      <h3
                        className="text-xl font-bold mb-2 flex items-center gap-2"
                        style={{ color: "#5D4037" }}
                      >
                        <FolderOpen
                          className="w-5 h-5"
                          style={{ color: "#D68A3D" }}
                        />
                        {selectedFolderName}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "rgba(93, 64, 55, 0.7)" }}
                      >
                        {documentFiles.length} document
                        {documentFiles.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {filesLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : documentFiles.length === 0 ? (
                      <EmptyState
                        icon={File}
                        title="No documents found"
                        description={
                          searchQuery
                            ? "No documents match your search criteria."
                            : "This folder contains no documents."
                        }
                      />
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(documentTypeGroups).map(
                          ([type, group]) => {
                            const filesOfType = groupedFiles[type] || [];
                            if (filesOfType.length === 0) return null;

                            return (
                              <div key={type}>
                                <h4
                                  className="text-lg font-bold mb-4 flex items-center gap-2"
                                  style={{ color: "#5D4037" }}
                                >
                                  <div style={{ color: "#D68A3D" }}>
                                    {group.icon}
                                  </div>
                                  {group.name}{" "}
                                  <span className="text-sm font-normal opacity-75">
                                    ({filesOfType.length})
                                  </span>
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {filesOfType.map((file) => {
                                    const fileTypeConfig = getFileTypeConfig(
                                      file.mimeType || "",
                                      file.name || "",
                                    );

                                    return (
                                      <div
                                        key={file.id}
                                        className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md"
                                        style={{
                                          background:
                                            "rgba(255, 255, 255, 0.9)",
                                          border:
                                            "1px solid rgba(214, 138, 61, 0.3)",
                                        }}
                                        onClick={() => setSelectedFile(file)}
                                        data-testid={`file-card-${file.id}`}
                                      >
                                        <div className="p-5">
                                          <div className="flex items-center justify-center mb-4">
                                            <div
                                              className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                              style={{
                                                background:
                                                  fileTypeConfig.color,
                                              }}
                                            >
                                              {fileTypeConfig.icon.slice(0, 4)}
                                            </div>
                                          </div>
                                          <h3
                                            className="font-semibold text-center truncate text-sm"
                                            style={{ color: "#5D4037" }}
                                          >
                                            {file.name}
                                          </h3>
                                          <div className="flex items-center justify-between mt-3 text-xs">
                                            <span
                                              style={{
                                                color: "rgba(93, 64, 55, 0.7)",
                                              }}
                                            >
                                              {formatFileSize(file.size)}
                                            </span>
                                            <span
                                              style={{
                                                color: "rgba(93, 64, 55, 0.7)",
                                              }}
                                            >
                                              {fileTypeConfig.icon}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          },
                        )}

                        {groupedFiles.other &&
                          groupedFiles.other.length > 0 && (
                            <div>
                              <h4
                                className="text-lg font-bold mb-4 flex items-center gap-2"
                                style={{ color: "#5D4037" }}
                              >
                                <FileIcon
                                  className="w-5 h-5"
                                  style={{ color: "#D68A3D" }}
                                />
                                Other Documents{" "}
                                <span className="text-sm font-normal opacity-75">
                                  ({groupedFiles.other.length})
                                </span>
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {groupedFiles.other.map((file) => {
                                  const fileTypeConfig = getFileTypeConfig(
                                    file.mimeType || "",
                                    file.name || "",
                                  );

                                  return (
                                    <div
                                      key={file.id}
                                      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md"
                                      style={{
                                        background: "rgba(255, 255, 255, 0.9)",
                                        border:
                                          "1px solid rgba(214, 138, 61, 0.3)",
                                      }}
                                      onClick={() => setSelectedFile(file)}
                                      data-testid={`file-card-${file.id}`}
                                    >
                                      <div className="p-5">
                                        <div className="flex items-center justify-center mb-4">
                                          <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                            style={{
                                              background: fileTypeConfig.color,
                                            }}
                                          >
                                            {fileTypeConfig.icon.slice(0, 4)}
                                          </div>
                                        </div>
                                        <h3
                                          className="font-semibold text-center truncate text-sm"
                                          style={{ color: "#5D4037" }}
                                        >
                                          {file.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-3 text-xs">
                                          <span
                                            style={{
                                              color: "rgba(93, 64, 55, 0.7)",
                                            }}
                                          >
                                            {formatFileSize(file.size)}
                                          </span>
                                          <span
                                            style={{
                                              color: "rgba(93, 64, 55, 0.7)",
                                            }}
                                          >
                                            {fileTypeConfig.icon}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={Folder}
                    title="Select a folder"
                    description="Choose a folder from the sidebar to view its documents."
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
