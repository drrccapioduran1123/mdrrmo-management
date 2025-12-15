import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Square,
  PenTool,
  Move,
  Ruler,
  SquareStack,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  X,
  Layers,
  Download,
  Printer,
  Save,
} from "lucide-react";

const App = () => {
  const [drawingMode, setDrawingMode] = useState(null);
  const [features, setFeatures] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [tempCoordinates, setTempCoordinates] = useState([]);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const [selectedFillColor, setSelectedFillColor] = useState("#ff000040");
  const [selectedWeight, setSelectedWeight] = useState(3);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [measurements, setMeasurements] = useState({
    distance: null,
    area: null,
  });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const mapRef = useRef(null);
  const printRef = useRef(null);

  // Initialize with sample features
  useEffect(() => {
    const initialFeatures = [
      {
        id: 1,
        type: "marker",
        coordinates: [13.03503, 123.448],
        title: "Pio Duran, Albay",
        description: "Map of Pio Duran, Albay",
        color: "#ff0000",
      },
      {
        id: 2,
        type: "polygon",
        coordinates: [
          [51.51, -0.1],
          [51.51, -0.05],
          [51.49, -0.05],
          [51.49, -0.1],
        ],
        title: "Central London Area",
        description: "Downtown London district",
        color: "#00ff00",
        fillColor: "#00ff0040",
      },
    ];
    setFeatures(initialFeatures);
    addToHistory(initialFeatures);
  }, []);

  const addToHistory = (newFeatures) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newFeatures]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFeatures([...history[newIndex]]);
      setSelectedFeature(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFeatures([...history[newIndex]]);
      setSelectedFeature(null);
    }
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setTempCoordinates([]);
    setFeatureTitle("");
    setFeatureDescription("");
  };

  const cancelDrawing = () => {
    setDrawingMode(null);
    setTempCoordinates([]);
    setIsMeasuring(false);
    setMeasurePoints([]);
    setShowExportPanel(false);
  };

  const finishDrawing = () => {
    if (drawingMode === "marker" && tempCoordinates.length > 0) {
      const newFeature = {
        id: Date.now(),
        type: "marker",
        coordinates: tempCoordinates[0],
        title: featureTitle || "New Marker",
        description: featureDescription,
        color: selectedColor,
      };
      const updatedFeatures = [...features, newFeature];
      setFeatures(updatedFeatures);
      addToHistory(updatedFeatures);
    } else if (drawingMode === "polygon" && tempCoordinates.length >= 3) {
      const newFeature = {
        id: Date.now(),
        type: "polygon",
        coordinates: [...tempCoordinates, tempCoordinates[0]], // Close the polygon
        title: featureTitle || "New Polygon",
        description: featureDescription,
        color: selectedColor,
        fillColor: selectedFillColor,
      };
      const updatedFeatures = [...features, newFeature];
      setFeatures(updatedFeatures);
      addToHistory(updatedFeatures);
    } else if (drawingMode === "line" && tempCoordinates.length >= 2) {
      const newFeature = {
        id: Date.now(),
        type: "line",
        coordinates: tempCoordinates,
        title: featureTitle || "New Line",
        description: featureDescription,
        color: selectedColor,
        weight: selectedWeight,
      };
      const updatedFeatures = [...features, newFeature];
      setFeatures(updatedFeatures);
      addToHistory(updatedFeatures);
    }
    setDrawingMode(null);
    setTempCoordinates([]);
  };

  const deleteFeature = (id) => {
    const updatedFeatures = features.filter((feature) => feature.id !== id);
    setFeatures(updatedFeatures);
    addToHistory(updatedFeatures);
    setSelectedFeature(null);
  };

  const startMeasuring = () => {
    setIsMeasuring(true);
    setMeasurePoints([]);
    setMeasurements({ distance: null, area: null });
  };

  const calculateDistance = (coords) => {
    if (coords.length < 2) return 0;
    // Simple Euclidean distance calculation (in real app, use Haversine formula)
    let totalDistance = 0;
    for (let i = 1; i < coords.length; i++) {
      const dx = coords[i][0] - coords[i - 1][0];
      const dy = coords[i][1] - coords[i - 1][1];
      totalDistance += Math.sqrt(dx * dx + dy * dy) * 111000; // Approx km conversion
    }
    return totalDistance;
  };

  const calculateArea = (coords) => {
    if (coords.length < 3) return 0;
    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;
    return area * 123456789; // Approx conversion to square meters
  };

  const handleMapClick = (e) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to lat/lng (simplified)
    const lat = 51.505 + (y - rect.height / 2) / 10000;
    const lng = -0.09 + (x - rect.width / 2) / 10000;
    const coordinate = [lat, lng];

    if (drawingMode) {
      if (drawingMode === "marker") {
        setTempCoordinates([coordinate]);
      } else {
        setTempCoordinates((prev) => [...prev, coordinate]);
      }
    } else if (isMeasuring) {
      const newPoints = [...measurePoints, coordinate];
      setMeasurePoints(newPoints);

      if (newPoints.length >= 2) {
        const distance = calculateDistance(newPoints);
        setMeasurements((prev) => ({ ...prev, distance }));
      }

      if (newPoints.length >= 3) {
        const area = calculateArea([...newPoints, newPoints[0]]);
        setMeasurements((prev) => ({ ...prev, area }));
      }
    }
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 18));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 1));
  };

  const exportMap = (format) => {
    if (format === "json") {
      const dataStr = JSON.stringify(features, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = "map-data.json";
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } else if (format === "image") {
      // In a real app, you would use html2canvas or similar
      alert("Image export would capture the current map view");
    }
    setShowExportPanel(false);
  };

  const printMap = () => {
    window.print();
  };

  const saveMap = () => {
    // In a real app, this would save to a database or file
    alert("Map saved successfully!");
  };

  return (
    <div className="h-screen bg-gray-900 relative overflow-hidden">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-map {
            width: 100% !important;
            height: 100% !important;
          }
        }
      `}</style>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full relative cursor-crosshair print-map"
        onClick={handleMapClick}
        style={{
          backgroundImage:
            "linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      >
        {/* Render existing features */}
        {features.map((feature) => (
          <div key={feature.id} className="absolute">
            {feature.type === "marker" && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
                style={{
                  left: `${50 + (feature.coordinates[1] + 0.09) * 10000}px`,
                  top: `${50 + (feature.coordinates[0] - 51.505) * 10000}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFeature(feature);
                }}
              >
                <MapPin className="w-6 h-6" style={{ color: feature.color }} />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {feature.title}
                </div>
              </div>
            )}

            {feature.type === "polygon" && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={feature.coordinates
                    .map(
                      (coord) =>
                        `${50 + (coord[1] + 0.09) * 10000},${50 + (coord[0] - 51.505) * 10000}`,
                    )
                    .join(" ")}
                  fill={feature.fillColor}
                  stroke={feature.color}
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFeature(feature);
                  }}
                />
              </svg>
            )}

            {feature.type === "line" && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polyline
                  points={feature.coordinates
                    .map(
                      (coord) =>
                        `${50 + (coord[1] + 0.09) * 10000},${50 + (coord[0] - 51.505) * 10000}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke={feature.color}
                  strokeWidth={feature.weight}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFeature(feature);
                  }}
                />
              </svg>
            )}
          </div>
        ))}

        {/* Render temporary drawing */}
        {tempCoordinates.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {drawingMode === "polygon" && (
              <polygon
                points={tempCoordinates
                  .map(
                    (coord) =>
                      `${50 + (coord[1] + 0.09) * 10000},${50 + (coord[0] - 51.505) * 10000}`,
                  )
                  .join(" ")}
                fill={selectedFillColor}
                stroke={selectedColor}
                strokeWidth="2"
                fillOpacity="0.3"
              />
            )}

            {drawingMode === "line" && (
              <polyline
                points={tempCoordinates
                  .map(
                    (coord) =>
                      `${50 + (coord[1] + 0.09) * 10000},${50 + (coord[0] - 51.505) * 10000}`,
                  )
                  .join(" ")}
                fill="none"
                stroke={selectedColor}
                strokeWidth={selectedWeight}
              />
            )}

            {tempCoordinates.map((coord, index) => (
              <circle
                key={index}
                cx={50 + (coord[1] + 0.09) * 10000}
                cy={50 + (coord[0] - 51.505) * 10000}
                r="4"
                fill={selectedColor}
              />
            ))}
          </svg>
        )}

        {/* Render measurement points */}
        {isMeasuring && measurePoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {measurePoints.length >= 2 && (
              <polyline
                points={measurePoints
                  .map(
                    (coord) =>
                      `${50 + (coord[1] + 0.09) * 10000},${50 + (coord[0] - 51.505) * 10000}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="#00ff00"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            {measurePoints.map((coord, index) => (
              <g key={index}>
                <circle
                  cx={50 + (coord[1] + 0.09) * 10000}
                  cy={50 + (coord[0] - 51.505) * 10000}
                  r="6"
                  fill="#00ff00"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={50 + (coord[1] + 0.09) * 10000}
                  y={50 + (coord[0] - 51.505) * 10000 - 15}
                  fill="#ffffff"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Main Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 no-print">
        <div
          className="p-3 rounded-xl backdrop-blur-md"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => startDrawing("marker")}
              className={`p-3 rounded-lg transition-all ${
                drawingMode === "marker"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-purple-300"
              }`}
              title="Add Marker"
            >
              <MapPin className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={() => startDrawing("polygon")}
              className={`p-3 rounded-lg transition-all ${
                drawingMode === "polygon"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-purple-300"
              }`}
              title="Draw Polygon"
            >
              <Square className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={() => startDrawing("line")}
              className={`p-3 rounded-lg transition-all ${
                drawingMode === "line"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-purple-300"
              }`}
              title="Draw Line"
            >
              <PenTool className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={() =>
                setDrawingMode(drawingMode === "select" ? null : "select")
              }
              className={`p-3 rounded-lg transition-all ${
                drawingMode === "select"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-purple-300"
              }`}
              title="Select"
            >
              <Move className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={startMeasuring}
              className={`p-3 rounded-lg transition-all ${
                isMeasuring
                  ? "bg-green-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-green-300"
              }`}
              title="Measure Distance/Area"
            >
              <Ruler className="w-5 h-5 mx-auto" />
            </button>

            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              className={`p-3 rounded-lg transition-all ${
                showExportPanel
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white hover:bg-opacity-10 text-blue-300"
              }`}
              title="Export/Print"
            >
              <Download className="w-5 h-5 mx-auto" />
            </button>
          </div>
        </div>

        {/* Undo/Redo */}
        <div
          className="p-3 rounded-xl backdrop-blur-md flex space-x-2"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-amber-300 disabled:opacity-30 transition-all"
            title="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-amber-300 disabled:opacity-30 transition-all"
            title="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div
          className="p-3 rounded-xl backdrop-blur-md flex flex-col space-y-2"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <button
            onClick={zoomIn}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-blue-300 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="text-center text-xs text-amber-300 font-mono">
            {zoomLevel}
          </div>

          <button
            onClick={zoomOut}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-blue-300 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* Save Button */}
        <div
          className="p-3 rounded-xl backdrop-blur-md"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <button
            onClick={saveMap}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-green-300 transition-all w-full"
            title="Save Map"
          >
            <Save className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Drawing Controls */}
      {(drawingMode === "marker" ||
        drawingMode === "polygon" ||
        drawingMode === "line") && (
        <div
          className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80 no-print"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold" style={{ color: "#E3D095" }}>
              {drawingMode === "marker"
                ? "Add Marker"
                : drawingMode === "polygon"
                  ? "Draw Polygon"
                  : "Draw Line"}
            </h4>
            <button
              onClick={cancelDrawing}
              className="p-1 rounded"
              style={{ color: "#E3D095" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Title
              </label>
              <input
                type="text"
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(121, 101, 193, 0.3)",
                  color: "#E3D095",
                }}
                placeholder="Enter title"
              />
            </div>

            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Description
              </label>
              <textarea
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(121, 101, 193, 0.3)",
                  color: "#E3D095",
                }}
                placeholder="Enter description"
                rows={2}
              />
            </div>

            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Color
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-10 rounded-lg"
              />
            </div>

            {drawingMode === "polygon" && (
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "rgba(227, 208, 149, 0.7)" }}
                >
                  Fill Color
                </label>
                <input
                  type="color"
                  value={selectedFillColor}
                  onChange={(e) => setSelectedFillColor(e.target.value)}
                  className="w-full h-10 rounded-lg"
                />
              </div>
            )}

            {drawingMode === "line" && (
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "rgba(227, 208, 149, 0.7)" }}
                >
                  Line Weight
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(parseInt(e.target.value))}
                  className="w-full"
                />
                <div
                  className="text-xs text-center mt-1"
                  style={{ color: "rgba(227, 208, 149, 0.7)" }}
                >
                  {selectedWeight}px
                </div>
              </div>
            )}

            {drawingMode === "polygon" && tempCoordinates.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={finishDrawing}
                  disabled={tempCoordinates.length < 3}
                  className="w-full py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                    color: "white",
                  }}
                >
                  Finish Polygon ({tempCoordinates.length} points)
                </button>
              </div>
            )}

            {drawingMode === "line" && tempCoordinates.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={finishDrawing}
                  disabled={tempCoordinates.length < 2}
                  className="w-full py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                    color: "white",
                  }}
                >
                  Finish Line ({tempCoordinates.length} points)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Measurement Panel */}
      {isMeasuring && (
        <div
          className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80 no-print"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold" style={{ color: "#E3D095" }}>
              Measurements
            </h4>
            <button
              onClick={cancelDrawing}
              className="p-1 rounded"
              style={{ color: "#E3D095" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div
              className="p-3 rounded-lg"
              style={{ background: "rgba(0, 255, 0, 0.1)" }}
            >
              <div className="text-sm font-medium" style={{ color: "#00ff00" }}>
                Distance
              </div>
              <div className="text-lg font-bold" style={{ color: "#00ff00" }}>
                {measurements.distance
                  ? `${(measurements.distance / 1000).toFixed(2)} km`
                  : "0 km"}
              </div>
            </div>

            {measurePoints.length >= 3 && (
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgba(0, 255, 0, 0.1)" }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: "#00ff00" }}
                >
                  Area
                </div>
                <div className="text-lg font-bold" style={{ color: "#00ff00" }}>
                  {measurements.area
                    ? `${(measurements.area / 1000000).toFixed(2)} km²`
                    : "0 km²"}
                </div>
              </div>
            )}

            <div
              className="text-xs"
              style={{ color: "rgba(227, 208, 149, 0.7)" }}
            >
              Click on the map to add measurement points. Double-click to
              finish.
            </div>

            <button
              onClick={cancelDrawing}
              className="w-full py-2 rounded-lg font-medium"
              style={{
                background: "linear-gradient(135deg, #ff4757, #ff3742)",
                color: "white",
              }}
            >
              Clear Measurements
            </button>
          </div>
        </div>
      )}

      {/* Export Panel */}
      {showExportPanel && (
        <div
          className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80 no-print"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold" style={{ color: "#E3D095" }}>
              Export & Print
            </h4>
            <button
              onClick={cancelDrawing}
              className="p-1 rounded"
              style={{ color: "#E3D095" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => exportMap("json")}
              className="w-full p-3 rounded-lg text-left transition-all hover:bg-white hover:bg-opacity-10"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(121, 101, 193, 0.3)",
                color: "#E3D095",
              }}
            >
              <div className="font-medium">Export as JSON</div>
              <div className="text-xs opacity-70">
                Download map data as JSON file
              </div>
            </button>

            <button
              onClick={() => exportMap("image")}
              className="w-full p-3 rounded-lg text-left transition-all hover:bg-white hover:bg-opacity-10"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(121, 101, 193, 0.3)",
                color: "#E3D095",
              }}
            >
              <div className="font-medium">Export as Image</div>
              <div className="text-xs opacity-70">
                Download map as PNG image
              </div>
            </button>

            <button
              onClick={printMap}
              className="w-full p-3 rounded-lg text-left transition-all hover:bg-white hover:bg-opacity-10"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(121, 101, 193, 0.3)",
                color: "#E3D095",
              }}
            >
              <div className="font-medium">Print Map</div>
              <div className="text-xs opacity-70">
                Print the current map view
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Feature Properties Panel */}
      {selectedFeature && (
        <div
          className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80 no-print"
          style={{
            background: "rgba(14, 33, 72, 0.95)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(121, 101, 193, 0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold" style={{ color: "#E3D095" }}>
              {selectedFeature.title}
            </h4>
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-1 rounded"
              style={{ color: "#E3D095" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Type
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#E3D095",
                }}
              >
                {selectedFeature.type.charAt(0).toUpperCase() +
                  selectedFeature.type.slice(1)}
              </div>
            </div>

            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Description
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#E3D095",
                }}
              >
                {selectedFeature.description || "No description"}
              </div>
            </div>

            <div>
              <label
                className="block text-xs mb-1"
                style={{ color: "rgba(227, 208, 149, 0.7)" }}
              >
                Coordinates
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#E3D095",
                }}
              >
                {Array.isArray(selectedFeature.coordinates[0])
                  ? `${selectedFeature.coordinates.length} points`
                  : selectedFeature.coordinates.join(", ")}
              </div>
            </div>

            <button
              onClick={() => deleteFeature(selectedFeature.id)}
              className="w-full py-2 rounded-lg font-medium"
              style={{
                background: "linear-gradient(135deg, #ff4757, #ff3742)",
                color: "white",
              }}
            >
              Delete Feature
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
