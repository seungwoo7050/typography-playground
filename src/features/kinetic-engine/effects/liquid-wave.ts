import { triangulateOutline } from "../core/path-utils";
import { createProgram } from "../core/webgl-utils";
import type { EffectGLState } from "./types";
import type { EffectDefinition } from "./types";

export interface LiquidWaveParams {
  frequency: number;
  speed: number;
  amplitude: number;
  hue: number;
}

// Ashima Arts의 2D simplex noise 구현(공개 도메인, WebGL 셰이더에서
// 흔히 쓰이는 축약형) — sin 파형만으로는 규칙적이라 "웨이브"에 가깝고,
// 노이즈 항을 더해야 "리퀴드"에 가까운 불규칙한 일렁임이 나온다.
const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
uniform mat3 u_projection;
uniform float u_time;
uniform float u_frequency;
uniform float u_speed;
uniform float u_amplitude;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  float wave = sin(a_position.x * u_frequency + u_time * u_speed) * u_amplitude;
  float noise = snoise(vec2(a_position.x * 0.02, u_time * 0.3)) * u_amplitude * 0.5;
  vec2 displaced = vec2(a_position.x, a_position.y + wave + noise);
  vec3 clip = u_projection * vec3(displaced, 1.0);
  gl_Position = vec4(clip.xy, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}
`;

/**
 * 픽셀 좌표(원점 좌상단, y 아래로 증가)를 클립 공간(-1..1, y 위로
 * 증가)으로 매핑하는 3x3 정사영 행렬을 열 우선(column-major)으로
 * 만든다 — WebGL의 uniformMatrix3fv가 기대하는 레이아웃.
 * (offsetX, offsetY)는 글리프의 로컬 (0,0)이 캔버스의 어느 픽셀
 * 위치에 와야 하는지를 지정한다(보통 캔버스 중앙에 글리프를
 * 배치하기 위한 오프셋).
 */
export function createProjectionMatrix(
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
): Float32Array {
  return new Float32Array([
    2 / canvasWidth,
    0,
    0,
    0,
    -2 / canvasHeight,
    0,
    (2 * offsetX) / canvasWidth - 1,
    (-2 * offsetY) / canvasHeight + 1,
    1,
  ]);
}

/** HSL(0-360, 0-1, 0-1)을 WebGL 유니폼에 바로 넣을 수 있는 RGB(0-1)로
 * 변환한다. */
export function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m];
}

interface LiquidWaveGLState extends EffectGLState {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer | null;
  ibo: WebGLBuffer | null;
  indexCount: number;
  indexType: number;
  bboxCenterX: number;
  bboxCenterY: number;
  uniforms: {
    time: WebGLUniformLocation | null;
    frequency: WebGLUniformLocation | null;
    speed: WebGLUniformLocation | null;
    amplitude: WebGLUniformLocation | null;
    projection: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
  };
}

export const liquidWaveEffect: EffectDefinition<LiquidWaveParams> = {
  id: "liquid-wave",
  label: "Liquid Wave",
  renderTarget: "webgl",
  defaultParams: { frequency: 0.05, speed: 2, amplitude: 8, hue: 200 },
  paramSchema: {
    frequency: { type: "number", label: "Frequency", min: 0.01, max: 0.2, step: 0.01 },
    speed: { type: "number", label: "Speed", min: 0, max: 10, step: 0.5 },
    amplitude: { type: "number", label: "Amplitude", min: 0, max: 40, step: 1 },
    hue: { type: "number", label: "Hue", min: 0, max: 360, step: 5 },
  },
  // 버텍스 셰이더에서 매 프레임 계산되는 절차적 변위라 정적 SVG로
  // 표현할 방법이 없다.
  supportsSvgExport: false,
  initGL(gl, outline): LiquidWaveGLState {
    const mesh = triangulateOutline(outline.commands);
    const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("VAO 생성 실패");
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return {
      program,
      vao,
      vbo,
      ibo,
      indexCount: mesh.indices.length,
      indexType: mesh.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      bboxCenterX: (outline.bbox.x1 + outline.bbox.x2) / 2,
      bboxCenterY: (outline.bbox.y1 + outline.bbox.y2) / 2,
      uniforms: {
        time: gl.getUniformLocation(program, "u_time"),
        frequency: gl.getUniformLocation(program, "u_frequency"),
        speed: gl.getUniformLocation(program, "u_speed"),
        amplitude: gl.getUniformLocation(program, "u_amplitude"),
        projection: gl.getUniformLocation(program, "u_projection"),
        color: gl.getUniformLocation(program, "u_color"),
      },
    };
  },
  disposeGL(gl, glState) {
    const state = glState as LiquidWaveGLState;
    gl.deleteProgram(state.program);
    gl.deleteVertexArray(state.vao);
    gl.deleteBuffer(state.vbo);
    gl.deleteBuffer(state.ibo);
  },
  renderGL(gl, glState, params, t) {
    const state = glState as LiquidWaveGLState;
    const canvas = gl.canvas as HTMLCanvasElement;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(state.program);
    gl.bindVertexArray(state.vao);

    const projection = createProjectionMatrix(
      canvas.width,
      canvas.height,
      canvas.width / 2 - state.bboxCenterX,
      canvas.height / 2 - state.bboxCenterY,
    );
    gl.uniformMatrix3fv(state.uniforms.projection, false, projection);
    gl.uniform1f(state.uniforms.time, t);
    gl.uniform1f(state.uniforms.frequency, params.frequency);
    gl.uniform1f(state.uniforms.speed, params.speed);
    gl.uniform1f(state.uniforms.amplitude, params.amplitude);

    const [r, g, b] = hslToRgb(params.hue, 0.8, 0.55);
    gl.uniform4f(state.uniforms.color, r, g, b, 1);

    gl.drawElements(gl.TRIANGLES, state.indexCount, state.indexType, 0);
    gl.bindVertexArray(null);
  },
};
