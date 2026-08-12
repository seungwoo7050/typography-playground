import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FONT_PATH = path.join(
  process.cwd(),
  "public/fonts/space-grotesk/source.ttf",
);

function mockFetchOnce() {
  const bytes = readFileSync(FONT_PATH);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(arrayBuffer),
  } as Response);
}

// font-loader.ts는 모듈 스코프에 캐시를 둔다 — 테스트 간 캐시 오염을
// 막기 위해 매 테스트마다 모듈을 리셋하고 다시 import한다.
describe("loadKineticFont", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", mockFetchOnce());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("알 수 없는 fontId는 거부된다", async () => {
    const { loadKineticFont } = await import("./font-loader");
    await expect(loadKineticFont("존재하지-않음")).rejects.toThrow(
      /알 수 없는 키네틱 폰트 id/,
    );
  });

  it("실제 TTF를 fetch+파싱해 Font 객체를 반환한다", async () => {
    const { loadKineticFont } = await import("./font-loader");
    const font = await loadKineticFont("space-grotesk");
    expect(font.unitsPerEm).toBeGreaterThan(0);
    expect(font.getPath("Ag", 0, 0, 100).commands.length).toBeGreaterThan(0);
  });

  it("같은 fontId를 다시 요청하면 캐시를 쓰고 fetch를 다시 호출하지 않는다", async () => {
    const { loadKineticFont } = await import("./font-loader");
    await loadKineticFont("space-grotesk");
    const fetchSpy = fetch as ReturnType<typeof vi.fn>;
    fetchSpy.mockClear();

    await loadKineticFont("space-grotesk");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("동시에 같은 fontId를 요청해도 fetch는 한 번만 호출된다", async () => {
    const { loadKineticFont } = await import("./font-loader");
    const fetchSpy = fetch as ReturnType<typeof vi.fn>;
    const [a, b] = await Promise.all([
      loadKineticFont("space-grotesk"),
      loadKineticFont("space-grotesk"),
    ]);
    expect(a).toBe(b);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("로드가 실패해도 처리되지 않은 rejection을 남기지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      const { loadKineticFont } = await import("./font-loader");
      await expect(loadKineticFont("space-grotesk")).rejects.toThrow(
        /폰트 로드 실패/,
      );
      // unhandledRejection은 마이크로태스크가 다 비워진 뒤에 판정된다.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("실패한 뒤 다시 요청하면 fetch를 새로 시도한다", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockImplementation(mockFetchOnce());
    vi.stubGlobal("fetch", fetchSpy);
    const { loadKineticFont } = await import("./font-loader");

    await expect(loadKineticFont("space-grotesk")).rejects.toThrow(/503/);
    const font = await loadKineticFont("space-grotesk");
    expect(font.unitsPerEm).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
