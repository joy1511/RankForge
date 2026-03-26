/**
 * GlobalBackground – minimal cream background with subtle texture.
 */

export function GlobalBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#FAF8F5",
      }}
    >
      {/* Subtle noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.3,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
