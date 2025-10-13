interface GridPlaceholdersProps {
  unionRect: { left: number; top: number; width: number; height: number };
  positions: { x: number; y: number }[];
  itemWidth: number;
  itemHeight: number;
}

export function GridPlaceholders({
  unionRect,
  positions,
  itemWidth,
  itemHeight,
}: GridPlaceholdersProps) {
  return (
    <>
      {/* Union bounding box */}
      <div
        style={{
          position: 'absolute',
          left: unionRect.left,
          top: unionRect.top,
          width: unionRect.width,
          height: unionRect.height,
          outline: '2px solid #0073ff',
          borderRadius: 12,
          backgroundColor: 'rgba(0, 115, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Individual placeholders (skip first, it's the original) */}
      {positions.slice(1).map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: itemWidth,
            height: itemHeight,
            outline: '2px solid rgba(0, 115, 255, 0.5)',
            borderRadius: 5,
            backgroundColor: 'rgba(0, 115, 255, 0.05)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}
