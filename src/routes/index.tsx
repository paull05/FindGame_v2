import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [View, setView] = useState<ComponentType | null>(null);

  useEffect(() => {
    void import("@/game/GameView.tsx").then((m) => setView(() => m.GameView));
  }, []);

  if (!View) {
    return (
      <div className="bakuran-loader" aria-live="polite" aria-busy="true">
        <div className="bakuran-loader__backdrop" aria-hidden="true" />
        <div className="bakuran-loader__panel">
          <p className="bakuran-loader__eyebrow">Naiwan. Hanapin.</p>
          <h1>Bakuran</h1>
          <p className="bakuran-loader__body">Preparing the grounds…</p>
          <div className="bakuran-loader__bar" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    );
  }

  return <View />;
}
