import React, { useState, useRef, useEffect } from 'react';
import { X, Undo, Redo, MousePointer, Ruler, Square, Download, Printer, ZoomIn, ZoomOut, Circle, MapPin, SquareDot } from 'lucide-react';

const App = () => {
  const [drawingMode, setDrawingMode] = useState(null);
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00A38D');
  const [selectedFillColor, setSelectedFillColor] = useState('rgba(0, 163, 141, 0.3)');
  const [selectedWeight, setSelectedWeight] = useState(3);
  const [tempCoordinates, setTempCoordinates] = useState([]);
  const [features, setFeatures] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [toolMode, setToolMode] = useState('select'); // 'select', 'measure-distance', 'measure-area'
  const [measurements, setMeasurements] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef(null);

  // Save state to history
  const saveToHistory = (newFeatures) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newFeatures]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo functionality
  const undo = () => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1;
      setFeatures([...history[newHistoryIndex]]);
      setHistoryIndex(newHistoryIndex);
    }
  };

  // Redo functionality
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1;
      setFeatures([...history[newHistoryIndex]]);
      setHistoryIndex(newHistoryIndex);
    }
  };

  // Cancel drawing
  const cancelDrawing = () => {
    setDrawingMode(null);
    setTempCoordinates([]);
    setFeatureTitle('');
    setFeatureDescription('');
  };

  // Finish drawing
  const finishDrawing = () => {
    if (drawingMode === 'polygon' && tempCoordinates.length >= 3) {
      const newFeature = {
        id: Date.now(),
        type: 'polygon',
        coordinates: [...tempCoordinates],
        title: featureTitle || 'Polygon',
        description: featureDescription,
        color: selectedColor,
        fillColor: selectedFillColor,
      };
      const newFeatures = [...features, newFeature];
      setFeatures(newFeatures);
      saveToHistory(newFeatures);
      cancelDrawing();
    } else if (drawingMode === 'line' && tempCoordinates.length >= 2) {
      const newFeature = {
        id: Date.now(),
        type: 'line',
        coordinates: [...tempCoordinates],
        title: featureTitle || 'Line',
        description: featureDescription,
        color: selectedColor,
        weight: selectedWeight,
      };
      const newFeatures = [...features, newFeature];
      setFeatures(newFeatures);
      saveToHistory(newFeatures);
      cancelDrawing();
    } else if (drawingMode === 'marker') {
      const newFeature = {
        id: Date.now(),
        type: 'marker',
        coordinates: tempCoordinates[0] || [0, 0],
        title: featureTitle || 'Marker',
        description: featureDescription,
        color: selectedColor,
      };
      const newFeatures = [...features, newFeature];
      setFeatures(newFeatures);
      saveToHistory(newFeatures);
      cancelDrawing();
    }
  };

  // Add point for drawing
  const addPoint = (coords) => {
    if (drawingMode === 'polygon' || drawingMode === 'line') {
      setTempCoordinates([...tempCoordinates, coords]);
    } else if (drawingMode === 'marker') {
      setTempCoordinates([coords]);
      finishDrawing();
    }
  };

  // Handle map click
  const handleMapClick = (e) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coords = [x, y];

    if (drawingMode) {
      addPoint(coords);
    } else if (toolMode === 'select') {
      // Check if clicked on a feature
      const clickedFeature = features.find(feature => {
        if (feature.type === 'marker') {
          const distance = Math.sqrt(
            Math.pow(feature.coordinates[0] - x, 2) + 
            Math.pow(feature.coordinates[1] - y, 2)
          );
          return distance <= 15;
        } else if (feature.type === 'polygon') {
          // Simple point-in-polygon check (simplified for demo)
          const minX = Math.min(...feature.coordinates.map(c => c[0]));
          const maxX = Math.max(...feature.coordinates.map(c => c[0]));
          const minY = Math.min(...feature.coordinates.map(c => c[1]));
          const maxY = Math.max(...feature.coordinates.map(c => c[1]));
          return x >= minX && x <= maxX && y >= minY && y <= maxY;
        } else if (feature.type === 'line') {
          // Check if near line (simplified)
          for (let i = 0; i < feature.coordinates.length - 1; i++) {
            const [x1, y1] = feature.coordinates[i];
            const [x2, y2] = feature.coordinates[i + 1];
            const distance = Math.abs(
              (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
            ) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
            if (distance <= 10) {
              return true;
            }
          }
        }
        return false;
      });

      if (clickedFeature) {
        setSelectedFeatureId(clickedFeature.id);
      } else {
        setSelectedFeatureId(null);
      }
    } else if (toolMode === 'measure-distance' || toolMode === 'measure-area') {
      const newMeasurements = [...measurements, coords];
      setMeasurements(newMeasurements);

      if (toolMode === 'measure-distance' && newMeasurements.length === 2) {
        setTimeout(() => setMeasurements([]), 3000);
      } else if (toolMode === 'measure-area' && newMeasurements.length >= 3) {
        setTimeout(() => setMeasurements([]), 3000);
      }
    }
  };

  // Calculate distance between two points
  const calculateDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  };

  // Calculate area of polygon (shoelace formula)
  const calculateArea = (points) => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    return Math.abs(area) / 2;
  };

  // Download map as SVG
  const downloadMap = () => {
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#f0f0f0"/>
        ${features.map(feature => {
          if (feature.type === 'marker') {
            return `<circle cx="${feature.coordinates[0]}" cy="${feature.coordinates[1]}" r="8" fill="${feature.color}" stroke="white" stroke-width="2"/>`;
          } else if (feature.type === 'polygon') {
            const points = feature.coordinates.map(c => `${c[0]},${c[1]}`).join(' ');
            return `<polygon points="${points}" fill="${feature.fillColor}" stroke="${feature.color}" stroke-width="2"/>`;
          } else if (feature.type === 'line') {
            const points = feature.coordinates.map(c => `${c[0]},${c[1]}`).join(' ');
            return `<polyline points="${points}" fill="none" stroke="${feature.color}" stroke-width="${feature.weight}"/>`;
          }
          return '';
        }).join('')}
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interactive-map.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print map
  const printMap = () => {
    window.print();
  };

  // Zoom functions
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  // Reset zoom
  const resetZoom = () => {
    setZoomLevel(1);
    setMapPosition({ x: 0, y: 0 });
  };

  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    if (drawingMode || toolMode !== 'select') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - mapPosition.x,
      y: e.clientY - mapPosition.y
    });
  };

  // Handle mouse move for panning
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setMapPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // Handle mouse up for panning
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for panning
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
        {/* Drawing Tools */}
        <div className="flex gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600">
          <button
            onClick={() => setDrawingMode('marker')}
            className={`p-2 rounded-md transition-all ${
              drawingMode === 'marker' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Add Marker"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDrawingMode('polygon')}
            className={`p-2 rounded-md transition-all ${
              drawingMode === 'polygon' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Draw Polygon"
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDrawingMode('line')}
            className={`p-2 rounded-md transition-all ${
              drawingMode === 'line' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Draw Line"
          >
            <SquareDot className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tools */}
        <div className="flex gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600">
          <button
            onClick={() => setToolMode('select')}
            className={`p-2 rounded-md transition-all ${
              toolMode === 'select' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
          </button>
          <button
            onClick={() => setToolMode('measure-distance')}
            className={`p-2 rounded-md transition-all ${
              toolMode === 'measure-distance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Measure Distance"
          >
            <Ruler className="w-5 h-5" />
          </button>
          <button
            onClick={() => setToolMode('measure-area')}
            className={`p-2 rounded-md transition-all ${
              toolMode === 'measure-area' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Measure Area"
          >
            <Circle className="w-5 h-5" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600">
          <button
            onClick={zoomIn}
            className="p-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="p-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs"
            title="Reset Zoom"
          >
            1:1
          </button>
        </div>

        {/* Export Tools */}
        <div className="flex gap-2 bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-600">
          <button
            onClick={downloadMap}
            className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Download Map"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={printMap}
            className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Print Map"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawing Controls */}
      {(drawingMode === "marker" ||
        drawingMode === "polygon" ||
        drawingMode === "line") && (
        <div
          className="absolute top-20 right-4 z-10 p-4 rounded-xl w-80"
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
                  onChange={(e) =>
                    setSelectedWeight(parseInt(e.target.value))
                  }
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
                    background:
                      "linear-gradient(135deg, #00A38D, #00A38DCC)",
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
                    background:
                      "linear-gradient(135deg, #00A38D, #00A38DCC)",
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

      {/* Measurement Display */}
      {(toolMode === 'measure-distance' || toolMode === 'measure-area') && measurements.length > 0 && (
        <div className="absolute top-20 left-4 z-10 p-3 rounded-lg bg-blue-600/90 backdrop-blur-sm text-white">
          {toolMode === 'measure-distance' && measurements.length === 2 && (
            <div>
              Distance: {calculateDistance(measurements[0], measurements[1]).toFixed(2)} px
            </div>
          )}
          {toolMode === 'measure-area' && measurements.length >= 3 && (
            <div>
              Area: {calculateArea(measurements).toFixed(2)} px²
            </div>
          )}
        </div>
      )}

      {/* Interactive Map */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          cursor: isDragging ? 'grabbing' : (drawingMode || toolMode !== 'select') ? 'crosshair' : 'grab',
        }}
      >
        {/* Map Background */}
        <div 
          className="w-full h-full bg-slate-200 relative"
          style={{ 
            backgroundImage: `radial-gradient(circle at 25% 25%, #e5e7eb 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #e5e7eb 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)]" 
               style={{ backgroundSize: '20px 20px' }}></div>

          {/* Features */}
          {features.map((feature) => (
            <div key={feature.id}>
              {feature.type === 'marker' && (
                <div
                  className={`absolute w-6 h-6 rounded-full border-2 border-white cursor-pointer transition-all ${
                    selectedFeatureId === feature.id ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
                  }`}
                  style={{
                    left: feature.coordinates[0] - 12,
                    top: feature.coordinates[1] - 12,
                    backgroundColor: feature.color,
                  }}
                  title={`${feature.title}\n${feature.description}`}
                />
              )}
              {feature.type === 'polygon' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polygon
                    points={feature.coordinates.map(c => `${c[0]},${c[1]}`).join(' ')}
                    fill={feature.fillColor}
                    stroke={feature.color}
                    strokeWidth="2"
                    className={selectedFeatureId === feature.id ? 'animate-pulse' : ''}
                  />
                </svg>
              )}
              {feature.type === 'line' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polyline
                    points={feature.coordinates.map(c => `${c[0]},${c[1]}`).join(' ')}
                    fill="none"
                    stroke={feature.color}
                    strokeWidth={feature.weight}
                    className={selectedFeatureId === feature.id ? 'animate-pulse' : ''}
                  />
                </svg>
              )}
            </div>
          ))}

          {/* Temporary drawing */}
          {tempCoordinates.length > 0 && drawingMode === 'polygon' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points={tempCoordinates.map(c => `${c[0]},${c[1]}`).join(' ')}
                fill={selectedFillColor}
                stroke={selectedColor}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {tempCoordinates.map((coord, index) => (
                <circle
                  key={index}
                  cx={coord[0]}
                  cy={coord[1]}
                  r="4"
                  fill={selectedColor}
                />
              ))}
            </svg>
          )}
          {tempCoordinates.length > 0 && drawingMode === 'line' && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                points={tempCoordinates.map(c => `${c[0]},${c[1]}`).join(' ')}
                fill="none"
                stroke={selectedColor}
                strokeWidth={selectedWeight}
                strokeDasharray="5,5"
              />
              {tempCoordinates.map((coord, index) => (
                <circle
                  key={index}
                  cx={coord[0]}
                  cy={coord[1]}
                  r="4"
                  fill={selectedColor}
                />
              ))}
            </svg>
          )}

          {/* Measurement lines */}
          {measurements.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {toolMode === 'measure-distance' && measurements.length === 2 && (
                <line
                  x1={measurements[0][0]}
                  y1={measurements[0][1]}
                  x2={measurements[1][0]}
                  y2={measurements[1][1]}
                  stroke="blue"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
              {toolMode === 'measure-area' && measurements.length >= 2 && (
                <polyline
                  points={measurements.map(c => `${c[0]},${c[1]}`).join(' ')}
                  fill="none"
                  stroke="blue"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
              {measurements.map((coord, index) => (
                <circle
                  key={index}
                  cx={coord[0]}
                  cy={coord[1]}
                  r="4"
                  fill="blue"
                />
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 p-2 rounded-lg bg-slate-800/90 backdrop-blur-sm text-slate-300 text-sm flex justify-between">
        <div>
          {drawingMode && (
            <span className="text-emerald-400">
              Drawing: {drawingMode} • Click to add points
            </span>
          )}
          {toolMode === 'measure-distance' && (
            <span className="text-blue-400">
              Measuring Distance • Click two points
            </span>
          )}
          {toolMode === 'measure-area' && (
            <span className="text-blue-400">
              Measuring Area • Click multiple points (click again to finish)
            </span>
          )}
          {!drawingMode && toolMode === 'select' && (
            <span className="text-slate-400">
              Select Tool • Click on features to select
            </span>
          )}
        </div>
        <div className="text-slate-400">
          Zoom: {(zoomLevel * 100).toFixed(0)}% • Features: {features.length}
        </div>
      </div>
    </div>
  );
};

export default App;
