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
