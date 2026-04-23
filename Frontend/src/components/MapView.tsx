import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
}

// Lazy-loaded Leaflet map (client only)
export function MapView({ markers = [], center = [28.6139, 77.209], zoom = 11, className, height = "h-80" }: Props) {
  const [Comp, setComp] = useState<null | React.ComponentType<Props>>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ MapContainer, TileLayer, CircleMarker, Tooltip }] = await Promise.all([
        import("react-leaflet"),
      ]);
      const toneColor: Record<string, string> = {
        primary: "#0e8a99",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#f97316",
        info: "#3b82f6",
      };
      const Inner = (p: Props) => (
        <MapContainer center={p.center ?? center} zoom={p.zoom ?? zoom} scrollWheelZoom={false} className={cn("h-full w-full rounded-lg")}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {(p.markers ?? markers).map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={9}
              pathOptions={{ color: toneColor[m.tone ?? "primary"], fillColor: toneColor[m.tone ?? "primary"], fillOpacity: 0.7, weight: 2 }}
            >
              {m.label && <Tooltip>{m.label}</Tooltip>}
            </CircleMarker>
          ))}
        </MapContainer>
      );
      if (mounted) setComp(() => Inner);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border bg-muted", height, className)}>
      {Comp ? <Comp markers={markers} center={center} zoom={zoom} /> : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>
      )}
    </div>
  );
}
