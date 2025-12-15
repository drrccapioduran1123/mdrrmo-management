import { useRef, useCallback } from "react";
import { MapPinned } from "lucide-react";
import {
  MapDrawingToolbar,
  DrawingControlsPanel,
  MapLegend,
  type MapFeature,
  type DrawingMode,
} from "./map-drawing-tools";

const DEFAULT_CENTER = { lat: 13.0752, lng: 123.5298 };
const MAP_SCALE = 0.1;

interface InteractiveMapViewProps {
  mapFeatures: MapFeature[];
  setMapFeatures: React.Dispatch<React.SetStateAction<MapFeature[]>>;
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  tempCoordinates: { lat: number; lng: number }[];
  setTempCoordinates: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }[]>>;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedFillColor: string;
  setSelectedFillColor: (color: string) => void;
  selectedWeight: number;
  setSelectedWeight: (weight: number) => void;
  featureTitle: string;
  setFeatureTitle: (title: string) => void;
  featureDescription: string;
  setFeatureDescription: (desc: string) => void;
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
  onSaveFeature: (feature: MapFeature) => void;
  onDeleteFeature: (id: string) => void;
  onClearAll: () => void;
  mouseCoords: { lat: number; lng: number };
  setMouseCoords: (coords: { lat: number; lng: number }) => void;
}

export function InteractiveMapView({
  mapFeatures,
  setMapFeatures,
  drawingMode,
  setDrawingMode,
  tempCoordinates,
  setTempCoordinates,
  selectedColor,
  setSelectedColor,
  selectedFillColor,
  setSelectedFillColor,
  selectedWeight,
  setSelectedWeight,
  featureTitle,
  setFeatureTitle,
  featureDescription,
  setFeatureDescription,
  showLegend,
  setShowLegend,
  onSaveFeature,
  onDeleteFeature,
  onClearAll,
  mouseCoords,
  setMouseCoords,
}: InteractiveMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const coordToPixel = useCallback(
    (coord: { lat: number; lng: number }, rect: DOMRect) => {
      const x = ((coord.lng - DEFAULT_CENTER.lng) / MAP_SCALE + 0.5) * rect.width;
      const y = (0.5 - (coord.lat - DEFAULT_CENTER.lat) / MAP_SCALE) * rect.height;
      return { x, y };
    },
    []
  );

  const pixelToCoord = useCallback(
    (x: number, y: number, rect: DOMRect) => {
      const lat = DEFAULT_CENTER.lat + (0.5 - y / rect.height) * MAP_SCALE;
      const lng = DEFAULT_CENTER.lng + (x / rect.width - 0.5) * MAP_SCALE;
      return { lat, lng };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMouseCoords(pixelToCoord(x, y, rect));
    },
    [pixelToCoord, setMouseCoords]
  );

  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (!mapRef.current || !drawingMode) return;

      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coord = pixelToCoord(x, y, rect);

      if (drawingMode === "marker") {
        const newFeature: MapFeature = {
          id: `marker-${Date.now()}`,
          type: "marker",
          coordinates: [coord],
          title: featureTitle || "New Marker",
          description: featureDescription,
          color: selectedColor,
        };
        setMapFeatures((prev) => [...prev, newFeature]);
        onSaveFeature(newFeature);
        setDrawingMode(null);
        setFeatureTitle("");
        setFeatureDescription("");
      } else if (drawingMode === "polygon" || drawingMode === "line") {
        setTempCoordinates((prev) => [...prev, coord]);
      }
    },
    [
      drawingMode,
      featureTitle,
      featureDescription,
      selectedColor,
      pixelToCoord,
      setMapFeatures,
      onSaveFeature,
      setDrawingMode,
      setFeatureTitle,
      setFeatureDescription,
      setTempCoordinates,
    ]
  );

  const finishDrawing = useCallback(() => {
    if (tempCoordinates.length === 0) return;

    if (drawingMode === "polygon" && tempCoordinates.length >= 3) {
      const newFeature: MapFeature = {
        id: `polygon-${Date.now()}`,
        type: "polygon",
        coordinates: [...tempCoordinates],
        title: featureTitle || "New Polygon",
        description: featureDescription,
        color: selectedColor,
        fillColor: selectedFillColor,
      };
      setMapFeatures((prev) => [...prev, newFeature]);
      onSaveFeature(newFeature);
    } else if (drawingMode === "line" && tempCoordinates.length >= 2) {
      const newFeature: MapFeature = {
        id: `line-${Date.now()}`,
        type: "line",
        coordinates: [...tempCoordinates],
        title: featureTitle || "New Line",
        description: featureDescription,
        color: selectedColor,
        weight: selectedWeight,
      };
      setMapFeatures((prev) => [...prev, newFeature]);
      onSaveFeature(newFeature);
    }

    setTempCoordinates([]);
    setDrawingMode(null);
    setFeatureTitle("");
    setFeatureDescription("");
  }, [
    drawingMode,
    tempCoordinates,
    featureTitle,
    featureDescription,
    selectedColor,
    selectedFillColor,
    selectedWeight,
    setMapFeatures,
    onSaveFeature,
    setTempCoordinates,
    setDrawingMode,
    setFeatureTitle,
    setFeatureDescription,
  ]);

  const cancelDrawing = useCallback(() => {
    setDrawingMode(null);
    setTempCoordinates([]);
  }, [setDrawingMode, setTempCoordinates]);

  const exportAsImage = useCallback(() => {
    if (!canvasRef.current || !mapRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = mapRef.current.clientWidth;
    canvas.height = mapRef.current.clientHeight;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#1A1E32");
    gradient.addColorStop(0.5, "#0E2148");
    gradient.addColorStop(1, "#1A1E32");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const rect = mapRef.current.getBoundingClientRect();

    mapFeatures.forEach((feature) => {
      if (feature.type === "marker" && feature.coordinates.length > 0) {
        const coord = feature.coordinates[0];
        const { x, y } = coordToPixel(coord, rect);

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = feature.color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (feature.type === "polygon" && feature.coordinates.length >= 3) {
        ctx.beginPath();
        const first = coordToPixel(feature.coordinates[0], rect);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < feature.coordinates.length; i++) {
          const point = coordToPixel(feature.coordinates[i], rect);
          ctx.lineTo(point.x, point.y);
        }

        ctx.closePath();
        ctx.fillStyle = feature.fillColor || feature.color + "40";
        ctx.fill();
        ctx.strokeStyle = feature.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (feature.type === "line" && feature.coordinates.length >= 2) {
        ctx.beginPath();
        const first = coordToPixel(feature.coordinates[0], rect);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < feature.coordinates.length; i++) {
          const point = coordToPixel(feature.coordinates[i], rect);
          ctx.lineTo(point.x, point.y);
        }

        ctx.strokeStyle = feature.color;
        ctx.lineWidth = feature.weight || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    });

    const link = document.createElement("a");
    link.download = `map-export-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [mapFeatures, coordToPixel]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="hidden" />

      <MapDrawingToolbar
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        onExport={exportAsImage}
      />

      <DrawingControlsPanel
        drawingMode={drawingMode}
        onCancel={cancelDrawing}
        featureTitle={featureTitle}
        setFeatureTitle={setFeatureTitle}
        featureDescription={featureDescription}
        setFeatureDescription={setFeatureDescription}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedFillColor={selectedFillColor}
        setSelectedFillColor={setSelectedFillColor}
        selectedWeight={selectedWeight}
        setSelectedWeight={setSelectedWeight}
        tempCoordinates={tempCoordinates}
        onFinish={finishDrawing}
      />

      <div
        ref={mapRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        style={{
          background:
            "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)",
        }}
        data-testid="interactive-map-canvas"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {mapFeatures.map((feature) => {
            if (!mapRef.current) return null;
            const rect = mapRef.current.getBoundingClientRect();

            if (feature.type === "polygon" && feature.coordinates.length >= 3) {
              const points = feature.coordinates
                .map((coord) => {
                  const { x, y } = coordToPixel(coord, rect);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polygon
                  key={feature.id}
                  points={points}
                  fill={feature.fillColor || feature.color + "40"}
                  stroke={feature.color}
                  strokeWidth="2"
                />
              );
            }

            if (feature.type === "line" && feature.coordinates.length >= 2) {
              const points = feature.coordinates
                .map((coord) => {
                  const { x, y } = coordToPixel(coord, rect);
                  return `${x},${y}`;
                })
                .join(" ");

              return (
                <polyline
                  key={feature.id}
                  points={points}
                  fill="none"
                  stroke={feature.color}
                  strokeWidth={feature.weight || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }

            return null;
          })}

          {tempCoordinates.length > 0 && mapRef.current && (() => {
            const rect = mapRef.current.getBoundingClientRect();
            const points = tempCoordinates
              .map((coord) => {
                const { x, y } = coordToPixel(coord, rect);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <>
                {drawingMode === "polygon" && tempCoordinates.length >= 2 && (
                  <polygon
                    points={points}
                    fill={selectedFillColor}
                    stroke={selectedColor}
                    strokeWidth="2"
                    fillOpacity="0.3"
                  />
                )}
                {drawingMode === "line" && tempCoordinates.length >= 1 && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke={selectedColor}
                    strokeWidth={selectedWeight}
                  />
                )}
                {tempCoordinates.map((coord, index) => {
                  const { x, y } = coordToPixel(coord, rect);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="6"
                      fill={selectedColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  );
                })}
              </>
            );
          })()}
        </svg>

        {mapFeatures
          .filter((f) => f.type === "marker")
          .map((feature) => {
            if (!mapRef.current) return null;
            const rect = mapRef.current.getBoundingClientRect();
            const { x, y } = coordToPixel(feature.coordinates[0], rect);

            return (
              <div
                key={feature.id}
                className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                }}
              >
                <div className="relative group">
                  <MapPinned
                    className="w-8 h-8 drop-shadow-lg"
                    style={{ color: feature.color }}
                  />
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: "rgba(14, 33, 72, 0.95)",
                      color: "#E3D095",
                      border: "1px solid rgba(121, 101, 193, 0.4)",
                    }}
                  >
                    {feature.title}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <MapLegend
        mapFeatures={mapFeatures}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
        onClearAll={onClearAll}
        onDeleteFeature={onDeleteFeature}
      />
    </div>
  );
}
