import { readFileSync } from "node:fs";
import path from "node:path";
import * as opentype from "opentype.js";
import type { PathCommand } from "opentype.js";
import { describe, expect, it } from "vitest";
import { commandsToContours, triangulateOutline } from "./path-utils";

function triangulatedArea(
  vertices: Float32Array,
  indices: ArrayLike<number>,
): number {
  let total = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i];
    const ib = indices[i + 1];
    const ic = indices[i + 2];
    const ax = vertices[ia * 2];
    const ay = vertices[ia * 2 + 1];
    const bx = vertices[ib * 2];
    const by = vertices[ib * 2 + 1];
    const cx = vertices[ic * 2];
    const cy = vertices[ic * 2 + 1];
    total += Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
  }
  return total;
}

const SQUARE: PathCommand[] = [
  { type: "M", x: 0, y: 0 },
  { type: "L", x: 10, y: 0 },
  { type: "L", x: 10, y: 10 },
  { type: "L", x: 0, y: 10 },
  { type: "Z" },
];

// 바깥 20x20 사각형(반시계) + 안쪽 10x10 사각형 구멍(시계, 반대 감김).
const SQUARE_WITH_HOLE: PathCommand[] = [
  { type: "M", x: 0, y: 0 },
  { type: "L", x: 20, y: 0 },
  { type: "L", x: 20, y: 20 },
  { type: "L", x: 0, y: 20 },
  { type: "Z" },
  { type: "M", x: 5, y: 5 },
  { type: "L", x: 5, y: 15 },
  { type: "L", x: 15, y: 15 },
  { type: "L", x: 15, y: 5 },
  { type: "Z" },
];

describe("commandsToContours", () => {
  it("M/L/Z만으로 된 경로를 닫힌 폴리라인 하나로 만든다", () => {
    const contours = commandsToContours(SQUARE);
    expect(contours.length).toBe(1);
    // Z가 시작점을 다시 추가해 닫는다.
    expect(contours[0][contours[0].length - 1]).toEqual({ x: 0, y: 0 });
  });

  it("두 개의 M...Z 블록은 두 개의 윤곽선이 된다", () => {
    const contours = commandsToContours(SQUARE_WITH_HOLE);
    expect(contours.length).toBe(2);
  });

  it("베지어 커맨드를 curveSegments개의 직선으로 근사한다", () => {
    const withCurve: PathCommand[] = [
      { type: "M", x: 0, y: 0 },
      { type: "C", x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
      { type: "Z" },
    ];
    const contours = commandsToContours(withCurve, 8);
    // 시작점 1 + 곡선 세그먼트 8 (마지막 점이 곡선의 끝점) + Z가 닫는 점 1
    expect(contours[0].length).toBe(1 + 8 + 1);
  });
});

describe("triangulateOutline", () => {
  it("구멍 없는 10x10 정사각형의 삼각분할 면적은 정확히 100이다", () => {
    const result = triangulateOutline(SQUARE);
    expect(triangulatedArea(result.vertices, result.indices)).toBeCloseTo(100, 5);
  });

  it("빈 커맨드는 빈 메시를 반환한다", () => {
    const result = triangulateOutline([]);
    expect(result.vertices.length).toBe(0);
    expect(result.indices.length).toBe(0);
  });

  it("반대 감김 방향의 안쪽 윤곽선을 구멍으로 인식해 뚫어낸다", () => {
    const result = triangulateOutline(SQUARE_WITH_HOLE);
    // 바깥 20x20(=400) - 안쪽 구멍 10x10(=100) = 300
    expect(triangulatedArea(result.vertices, result.indices)).toBeCloseTo(300, 5);
  });

  it("실제 폰트의 'O' 글리프는 구멍이 뚫려 바운딩 박스 면적보다 훨씬 작다", () => {
    const bytes = readFileSync(
      path.join(process.cwd(), "public/fonts/space-grotesk/source.ttf"),
    );
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    const font = opentype.parse(arrayBuffer);
    const glyphPath = font.getPath("O", 0, 0, 200);
    const bbox = glyphPath.getBoundingBox();
    const bboxArea = (bbox.x2 - bbox.x1) * (bbox.y2 - bbox.y1);

    const result = triangulateOutline(glyphPath.commands, 16);
    const area = triangulatedArea(result.vertices, result.indices);

    // 구멍이 제대로 뚫렸다면 실제 채워진 면적은 바운딩 박스의
    // 상당 부분(예: 80% 이상)이 아니라 링 모양만큼만 차지해야 한다.
    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(bboxArea * 0.7);
  });
});
