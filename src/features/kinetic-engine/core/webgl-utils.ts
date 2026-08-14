/**
 * WebGL2 셰이더 컴파일/프로그램 링크 보일러플레이트. 실제 GPU
 * 컨텍스트가 필요해 jsdom에서 유닛 테스트할 수 없다 — 실제 브라우저로
 * 검증한다(§계획서 테스트 전략).
 */

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("셰이더 객체 생성 실패");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`셰이더 컴파일 실패: ${info}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) throw new Error("프로그램 객체 생성 실패");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`프로그램 링크 실패: ${info}`);
  }

  // 링크가 끝나면 프로그램이 셰이더 바이트코드를 이미 보관하므로
  // 개별 셰이더 객체는 지워도 안전하다 — GPU 리소스 누수 방지.
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * WebGL2 컨텍스트를 요청한다. 지원하지 않는 환경(구형 브라우저 등)에서는
 * null을 반환한다 — 호출하는 쪽(이펙트 갤러리)이 WebGL 전용 이펙트를
 * 숨기는 등 우아하게 대응할 책임을 진다.
 */
export function requestWebGL2Context(
  canvas: HTMLCanvasElement,
): WebGL2RenderingContext | null {
  return canvas.getContext("webgl2");
}

/**
 * 한 번 쓰고 버리는 WebGL 컨텍스트(export용 오프스크린 캔버스)를 즉시
 * 놓아준다. 브라우저는 페이지당 활성 WebGL 컨텍스트 수에 한도를 두고
 * 넘으면 오래된 것부터 잃게 하는데, 떼어진 캔버스의 컨텍스트가 언제
 * 수거될지는 가비지 컬렉션에 달려 있다 — 화면의 메인 캔버스가 그 한도에
 * 밀려나지 않도록 export가 끝나는 시점에 명시적으로 잃게 한다.
 */
export function releaseWebGLContext(gl: WebGL2RenderingContext): void {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}
