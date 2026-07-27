import earcut from "earcut";
import type { PathCommand } from "opentype.js";

export interface Point {
  x: number;
  y: number;
}

function flattenCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  segments: number,
): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    points.push({
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return points;
}

function flattenQuadraticBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  segments: number,
): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    points.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    });
  }
  return points;
}

/**
 * 글리프 커맨드(M/L/C/Q/Z)를 여러 개의 닫힌 폴리라인(윤곽선)으로
 * 변환한다. 한 글리프는 보통 여러 윤곽선을 가진다 — 예를 들어 "O"는
 * 바깥 원 하나 + 안쪽 구멍 하나, "Ag" 같은 여러 글자는 글자마다
 * 별도 윤곽선을 갖는다. 베지어 곡선은 curveSegments개의 직선
 * 세그먼트로 근사(flatten)한다.
 */
export function commandsToContours(
  commands: PathCommand[],
  curveSegments = 8,
): Point[][] {
  const contours: Point[][] = [];
  let current: Point[] = [];
  let cursor: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };

  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        if (current.length > 0) contours.push(current);
        current = [{ x: cmd.x, y: cmd.y }];
        cursor = { x: cmd.x, y: cmd.y };
        start = cursor;
        break;
      case "L":
        current.push({ x: cmd.x, y: cmd.y });
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case "C":
        current.push(
          ...flattenCubicBezier(
            cursor,
            { x: cmd.x1, y: cmd.y1 },
            { x: cmd.x2, y: cmd.y2 },
            { x: cmd.x, y: cmd.y },
            curveSegments,
          ),
        );
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case "Q":
        current.push(
          ...flattenQuadraticBezier(
            cursor,
            { x: cmd.x1, y: cmd.y1 },
            { x: cmd.x, y: cmd.y },
            curveSegments,
          ),
        );
        cursor = { x: cmd.x, y: cmd.y };
        break;
      case "Z":
        current.push(start);
        contours.push(current);
        current = [];
        break;
    }
  }
  if (current.length > 0) contours.push(current);
  return contours;
}

/** Shoelace 공식으로 부호 있는 면적을 구한다 — 부호가 감김 방향을
 * 나타낸다(윤곽선끼리 방향이 반대면 하나가 다른 하나의 구멍). */
function signedArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface TriangulatedGlyph {
  /** WebGL 버텍스 버퍼에 그대로 넣을 수 있는 인터리브드 x,y 배열. */
  vertices: Float32Array;
  /** vertices를 가리키는 삼각형 인덱스(3개씩 삼각형 하나). */
  indices: Uint16Array | Uint32Array;
}

/**
 * 글리프 아웃라인을 WebGL이 그릴 수 있는 삼각형 메시로 분할한다 —
 * "O"/"A"/"g" 같은 글자의 구멍(counter)을 올바르게 뚫어낸다.
 *
 * 알고리즘: 각 윤곽선의 부호 있는 면적(절대값) 기준으로 큰 것부터
 * 처리한다. 이미 만들어진 outer 중 이 윤곽선의 첫 점을 포함하고
 * 감김 방향이 반대인 것이 있으면 그 outer의 구멍으로, 없으면 새
 * outer로 등록한다. 여러 글자처럼 서로 겹치지 않는 윤곽선은 각자
 * 별도 outer가 된다.
 */
export function triangulateOutline(
  commands: PathCommand[],
  curveSegments = 8,
): TriangulatedGlyph {
  const contours = commandsToContours(commands, curveSegments);
  if (contours.length === 0) {
    return { vertices: new Float32Array(0), indices: new Uint32Array(0) };
  }

  const withArea = contours.map((points) => ({ points, area: signedArea(points) }));
  withArea.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  const outers: { points: Point[]; holes: Point[][] }[] = [];
  for (const { points, area } of withArea) {
    const parent = outers.find(
      (o) =>
        Math.sign(signedArea(o.points)) !== Math.sign(area) &&
        pointInPolygon(points[0], o.points),
    );
    if (parent) {
      parent.holes.push(points);
    } else {
      outers.push({ points, holes: [] });
    }
  }

  const allVertices: number[] = [];
  const allIndices: number[] = [];

  for (const { points, holes } of outers) {
    const vertexOffset = allVertices.length / 2;
    const flat: number[] = [];
    const holeIndices: number[] = [];
    for (const p of points) flat.push(p.x, p.y);
    for (const hole of holes) {
      holeIndices.push(flat.length / 2);
      for (const p of hole) flat.push(p.x, p.y);
    }
    const triangles = earcut(flat, holeIndices.length > 0 ? holeIndices : null);
    for (const idx of triangles) allIndices.push(idx + vertexOffset);
    allVertices.push(...flat);
  }

  const vertexCount = allVertices.length / 2;
  return {
    vertices: new Float32Array(allVertices),
    indices:
      vertexCount > 65535
        ? new Uint32Array(allIndices)
        : new Uint16Array(allIndices),
  };
}
