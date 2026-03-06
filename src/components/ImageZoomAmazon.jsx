import { useEffect, useMemo, useRef, useState } from "react";

export default function ImageZoomAmazon({
  src,
  alt,
  zoom = 3.2,
  heightClass = "h-[420px] md:h-[520px]",
}) {
  const boxRef = useRef(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isDesktop, setIsDesktop] = useState(false);

  const hasImg = typeof src === "string" && src.trim().length > 0;

  const bgPosition = useMemo(() => `${pos.x}% ${pos.y}%`, [pos.x, pos.y]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const updatePosition = (e) => {
    if (!boxRef.current) return;

    const rect = boxRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleClick = (e) => {
    if (!isDesktop || !hasImg) return;

    updatePosition(e);
    setActive((prev) => !prev);
  };

  const handleMove = (e) => {
    if (!isDesktop || !active) return;
    updatePosition(e);
  };

  const lensSize = 150;
  const lensHalf = lensSize / 2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
      {/* Imagen principal */}
      <div className={active && isDesktop ? "md:col-span-5" : "md:col-span-12"}>
        <div
          ref={boxRef}
          onClick={handleClick}
          onMouseMove={handleMove}
          className={[
            "relative rounded-xl border border-border bg-surface overflow-hidden",
            heightClass,
            hasImg && isDesktop ? "cursor-zoom-in" : "",
            active ? "ring-1 ring-primary-200" : "",
          ].join(" ")}
        >
          <div className="absolute inset-0 bg-surface-soft" />

          {hasImg ? (
            <>
              <img
                src={src}
                alt={alt}
                className="relative z-10 h-full w-full object-contain p-6 select-none"
                draggable={false}
              />

              {isDesktop && active ? (
                <div
                  className="absolute z-20 pointer-events-none rounded-xl border border-white/70 bg-white/20 backdrop-blur-[1px] shadow-lg"
                  style={{
                    left: `clamp(0px, calc(${pos.x}% - ${lensHalf}px), calc(100% - ${lensSize}px))`,
                    top: `clamp(0px, calc(${pos.y}% - ${lensHalf}px), calc(100% - ${lensSize}px))`,
                    width: lensSize,
                    height: lensSize,
                  }}
                />
              ) : null}

              {!active ? (
                <div className="absolute bottom-3 left-3 z-20 rounded-md border border-border/70 bg-surface/90 px-2.5 py-1 text-[11px] text-text-muted backdrop-blur-sm">
                  {isDesktop ? "Haz click para abrir zoom" : "Zoom disponible en escritorio"}
                </div>
              ) : (
                <div className="absolute bottom-3 left-3 z-20 rounded-md border border-border/70 bg-surface/90 px-2.5 py-1 text-[11px] text-text-muted backdrop-blur-sm">
                  Haz click de nuevo para cerrar
                </div>
              )}
            </>
          ) : (
            <div className="relative z-10 flex h-full w-full items-center justify-center text-text-muted">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      {/* Panel de zoom */}
      {hasImg && isDesktop && active ? (
        <div className="hidden md:block md:col-span-7">
          <div
            className={[
              "relative rounded-xl border border-border bg-surface overflow-hidden",
              heightClass,
            ].join(" ")}
          >
            <div className="absolute inset-0 bg-surface-soft" />

            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${src})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: bgPosition,
                backgroundSize: `${zoom * 100}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}