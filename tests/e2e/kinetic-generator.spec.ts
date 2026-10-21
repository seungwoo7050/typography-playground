import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.describe("키네틱 엔진: 입력 → 이펙트 선택 → PNG export 플로우", () => {
  test("텍스트 입력 후 이펙트를 바꾸고 PNG로 내보낼 수 있다", async ({
    page,
  }) => {
    await page.goto("/kinetic");

    await page.getByPlaceholder("텍스트를 입력하세요").fill("Hello");

    // export 버튼은 폰트 로드 + 아웃라인 준비가 끝나야 활성화된다 —
    // 임의의 타임아웃 대신 이 상태를 기다린다.
    const exportButton = page.getByRole("button", { name: "PNG 다운로드" });
    await expect(exportButton).toBeEnabled();

    await page.getByRole("button", { name: "Glitch" }).click();

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("Hello-glitch.png");

    const path = await download.path();
    expect(path).toBeTruthy();
    const bytes = readFileSync(path!);
    expect(bytes.length).toBeGreaterThan(0);
    // PNG 시그니처(첫 8바이트)로 실제 유효한 PNG인지 확인한다.
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  test("WebGL 이펙트(Liquid Wave)도 PNG로 내보낼 수 있다", async ({
    page,
  }) => {
    await page.goto("/kinetic");

    await page.getByPlaceholder("텍스트를 입력하세요").fill("Wave");

    const exportButton = page.getByRole("button", { name: "PNG 다운로드" });
    await expect(exportButton).toBeEnabled();

    await page.getByRole("button", { name: "Liquid Wave" }).click();

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;

    const path = await download.path();
    const bytes = readFileSync(path!);
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  test("폰트를 바꾸면 다른 폰트로 캔버스가 다시 렌더링된다", async ({
    page,
  }) => {
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Wave");

    const exportButton = page.getByRole("button", { name: "PNG 다운로드" });
    await expect(exportButton).toBeEnabled();

    await page.getByRole("button", { name: "Bungee" }).click();
    // 폰트 fetch+파싱 대기 — export 버튼이 활성 상태를 유지하는지로
    // 폰트 전환이 에러 없이 끝났는지 확인한다.
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    const path = await download.path();
    const bytes = readFileSync(path!);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

test.describe("키네틱 엔진: GIF export(애니메이션) 플로우", () => {
  test("애니메이션 이펙트(Gradient Fill)를 GIF로 내보낼 수 있다", async ({
    page,
  }) => {
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Hi");

    const gifButton = page.getByRole("button", { name: "GIF 다운로드" });
    await expect(gifButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await gifButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("Hi-gradient-fill.gif");

    const path = await download.path();
    expect(path).toBeTruthy();
    const bytes = readFileSync(path!);
    // GIF89a 시그니처(첫 6바이트)로 실제 유효한 GIF인지 확인한다.
    expect(bytes.subarray(0, 6).toString("ascii")).toBe("GIF89a");
    // 여러 프레임이 실제로 인코딩됐다면 정지 이미지 하나짜리보다 훨씬
    // 커야 한다 — 정확한 프레임 수까지는 아니어도 "그냥 1프레임짜리로
    // 조용히 실패"하지 않았다는 최소한의 신호.
    expect(bytes.length).toBeGreaterThan(5_000);
  });

  test("WebGL 이펙트(Liquid Wave)도 GIF로 내보낼 수 있다", async ({
    page,
  }) => {
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Wave");
    await page.getByRole("button", { name: "Liquid Wave" }).click();

    const gifButton = page.getByRole("button", { name: "GIF 다운로드" });
    await expect(gifButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await gifButton.click();
    const download = await downloadPromise;

    const path = await download.path();
    const bytes = readFileSync(path!);
    expect(bytes.subarray(0, 6).toString("ascii")).toBe("GIF89a");
  });

  test("PNG와 GIF export 버튼은 동시에 실행 중이면 서로를 막는다", async ({
    page,
  }) => {
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Hi");

    const pngButton = page.getByRole("button", { name: "PNG 다운로드" });
    const gifButton = page.getByRole("button", { name: "GIF 다운로드" });
    await expect(pngButton).toBeEnabled();
    await expect(gifButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await gifButton.click();
    // GIF가 인코딩되는 짧은 동안 PNG 버튼도 비활성화돼야 한다(두
    // export가 겹쳐 실행되지 않는다는 상호배제 확인).
    await expect(pngButton).toBeDisabled();
    await downloadPromise;
    await expect(pngButton).toBeEnabled();
  });
});

test.describe("키네틱 엔진: 실패 경로", () => {
  test("폰트 로드가 실패하면 문구와 다시 시도를 보여 주고, 다시 시도로 복구한다", async ({
    page,
  }) => {
    await page.route("**/fonts/bungee/source.ttf", (route) =>
      route.fulfill({ status: 503 }),
    );
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Wave");
    await expect(page.getByRole("button", { name: "PNG 다운로드" })).toBeEnabled();

    await page.getByRole("button", { name: "Bungee" }).click();
    await expect(page.getByText("Bungee 폰트를 불러오지 못했어요")).toBeVisible();
    const retry = page.getByRole("button", { name: "다시 시도" });
    await expect(retry).toBeVisible();

    await page.unroute("**/fonts/bungee/source.ttf");
    await retry.click();
    await expect(page.getByText("Bungee 폰트를 불러오지 못했어요")).toHaveCount(0);
    await expect(retry).toHaveCount(0);
  });

  test("실패했던 폰트를 나중에 다시 골라 성공하면 실패 표시가 사라진다", async ({
    page,
  }) => {
    await page.route("**/fonts/bungee/source.ttf", (route) =>
      route.fulfill({ status: 503 }),
    );
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Wave");

    await page.getByRole("button", { name: "Bungee" }).click();
    await expect(page.getByText("Bungee 폰트를 불러오지 못했어요")).toBeVisible();

    // 다른 폰트로 갔다가, 네트워크가 돌아온 뒤 다시 고른다.
    await page.getByRole("button", { name: "Anton" }).click();
    await expect(page.getByText("Bungee 폰트를 불러오지 못했어요")).toHaveCount(0);
    await page.unroute("**/fonts/bungee/source.ttf");
    await page.getByRole("button", { name: "Bungee" }).click();

    await expect(page.getByText("Bungee 폰트를 불러오지 못했어요")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(0);
  });

  test("GIF 인코딩 워커가 실패하면 실패 문구를 보여 주고 버튼이 다시 활성화된다", async ({
    page,
  }) => {
    // 워커 생성 직후 오류를 내는 가짜 Worker로 바꿔 인코딩 실패를 만든다.
    await page.addInitScript(() => {
      class FailingWorker {
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: { message: string }) => void) | null = null;
        constructor() {
          setTimeout(() => this.onerror?.({ message: "주입한 워커 실패" }), 0);
        }
        postMessage() {}
        terminate() {}
      }
      (window as unknown as { Worker: unknown }).Worker = FailingWorker;
    });
    await page.goto("/kinetic");
    await page.getByPlaceholder("텍스트를 입력하세요").fill("Hi");

    const gifButton = page.getByRole("button", { name: "GIF 다운로드" });
    await expect(gifButton).toBeEnabled();
    await gifButton.click();

    await expect(page.getByText("GIF 내보내기에 실패했어요")).toBeVisible();
    await expect(gifButton).toBeEnabled();
  });

  test("WebGL2를 쓸 수 없으면 WebGL 이펙트를 고를 수 없다", async ({ page }) => {
    await page.addInitScript(() => {
      // getContext는 오버로드가 많아 시그니처를 그대로 재현하지 않고,
      // 인자를 그대로 넘기는 느슨한 함수 타입으로 바꿔 끼운다.
      type LooseGetContext = (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown;
      const proto = HTMLCanvasElement.prototype as unknown as { getContext: LooseGetContext };
      const original = proto.getContext;
      proto.getContext = function (type, ...rest) {
        if (type === "webgl2") return null;
        return original.call(this, type, ...rest);
      };
    });
    await page.goto("/kinetic");

    const liquidWave = page.getByRole("button", { name: "Liquid Wave" });
    await expect(liquidWave).toBeDisabled();
    await expect(liquidWave).toContainText("WebGL2 미지원");
    await expect(page.getByRole("button", { name: "Glitch" })).toBeEnabled();
  });
});
