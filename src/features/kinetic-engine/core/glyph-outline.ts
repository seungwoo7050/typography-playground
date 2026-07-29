import type { Font, PathCommand } from "opentype.js";

export interface GlyphBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GlyphOutline {
  /** opentype.js Path의 원본 커맨드(M/L/C/Q/Z) — 모든 이펙트가 공유하는
   * 기하학적 기반. 이펙트는 이 커맨드를 소비하지 `ctx.fillText`를
   * 직접 쓰지 않는다(그래야 캔버스가 아닌 WebGL 이펙트도 같은
   * 아웃라인 데이터를 재사용할 수 있다). */
  commands: PathCommand[];
  bbox: GlyphBoundingBox;
  fontSize: number;
}

/**
 * 텍스트를 렌더링했을 때의 글리프 아웃라인을 추출한다.
 *
 * 좌표계 주의: opentype.js의 getPath는 폰트 유닛(y가 위로 증가하는
 * 수학 좌표계)이 아니라 이미 캔버스 좌표계(y가 아래로 증가)로 변환된
 * 커맨드를 반환한다 — 베이스라인 기준 상승부(ascender)는 음수 y,
 * 하강부(descender, 예: g의 꼬리)는 양수 y로 나온다. 즉 별도로 y를
 * 뒤집을 필요 없이 Path2D에 그대로 그리면 똑바로 보인다.
 */
export function extractGlyphOutline(
  font: Font,
  text: string,
  fontSize: number,
): GlyphOutline {
  const path = font.getPath(text, 0, 0, fontSize);
  const bbox = path.getBoundingBox();
  return {
    commands: path.commands,
    bbox: { x1: bbox.x1, y1: bbox.y1, x2: bbox.x2, y2: bbox.y2 },
    fontSize,
  };
}

function translateCommand(cmd: PathCommand, dx: number, dy: number): PathCommand {
  switch (cmd.type) {
    case "Z":
      return cmd;
    case "M":
    case "L":
      return { ...cmd, x: cmd.x + dx, y: cmd.y + dy };
    case "Q":
      return {
        ...cmd,
        x1: cmd.x1 + dx,
        y1: cmd.y1 + dy,
        x: cmd.x + dx,
        y: cmd.y + dy,
      };
    case "C":
      return {
        ...cmd,
        x1: cmd.x1 + dx,
        y1: cmd.y1 + dy,
        x2: cmd.x2 + dx,
        y2: cmd.y2 + dy,
        x: cmd.x + dx,
        y: cmd.y + dy,
      };
  }
}

/** 아웃라인 전체(커맨드 + bbox)를 (dx, dy)만큼 평행이동한다. */
export function translateOutline(
  outline: GlyphOutline,
  dx: number,
  dy: number,
): GlyphOutline {
  return {
    commands: outline.commands.map((cmd) => translateCommand(cmd, dx, dy)),
    bbox: {
      x1: outline.bbox.x1 + dx,
      y1: outline.bbox.y1 + dy,
      x2: outline.bbox.x2 + dx,
      y2: outline.bbox.y2 + dy,
    },
    fontSize: outline.fontSize,
  };
}

/**
 * 아웃라인을 주어진 캔버스 크기 안에 가운데 정렬한다.
 *
 * extractGlyphOutline이 반환하는 원본 좌표는 텍스트 원점(대략 첫
 * 글자의 베이스라인 좌측)이 (0,0)이다 — 캔버스에 별도 위치 조정 없이
 * 그대로 그리면 상승부가 캔버스 위쪽 바깥으로 잘려나간다. 이펙트
 * 각각이 위치 조정을 책임지지 않도록(그리고 캔버스 클리어가 항상
 * 전체 캔버스를 대상으로 하도록) 아웃라인을 그리기 전에 한 번만
 * 가운데로 옮겨둔다.
 */
export function centerOutline(
  outline: GlyphOutline,
  canvasWidth: number,
  canvasHeight: number,
): GlyphOutline {
  const glyphCenterX = (outline.bbox.x1 + outline.bbox.x2) / 2;
  const glyphCenterY = (outline.bbox.y1 + outline.bbox.y2) / 2;
  return translateOutline(
    outline,
    canvasWidth / 2 - glyphCenterX,
    canvasHeight / 2 - glyphCenterY,
  );
}

/** GlyphOutline의 커맨드를 Canvas2D Path2D로 변환한다. */
export function outlineToPath2D(outline: GlyphOutline): Path2D {
  const path2d = new Path2D();
  for (const cmd of outline.commands) {
    switch (cmd.type) {
      case "M":
        path2d.moveTo(cmd.x, cmd.y);
        break;
      case "L":
        path2d.lineTo(cmd.x, cmd.y);
        break;
      case "C":
        path2d.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        break;
      case "Q":
        path2d.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        break;
      case "Z":
        path2d.closePath();
        break;
    }
  }
  return path2d;
}
