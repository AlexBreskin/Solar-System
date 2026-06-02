import type { ClusterMenu } from "@/hooks/useGalaxyPointerHandlers";
import { JSX } from "react";

function rootTypeIcon(rootType: string): string {
  const icons: Record<string, string> = {
    star: "☀",
    "black-hole": "◉",
    "neutron-star": "✶",
    quasar: "✵",
  };
  return icons[rootType] ?? "☀";
}

export default function ClusterMenuPopup({
  menu,
  onSelect,
}: {
  menu: ClusterMenu | null;
  onSelect: (id: string) => void;
}): JSX.Element {
  if (!menu) return <div />;
  return (
    <div className="galaxy-cluster-menu" style={{ left: menu.x, top: menu.y }}>
      {menu.systems.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)}>
          <span>{rootTypeIcon(s.rootType)}</span>
          {s.name}
        </button>
      ))}
    </div>
  );
}
