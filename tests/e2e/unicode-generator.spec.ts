import { expect, test } from "@playwright/test";

test.describe("유니코드 생성기: 입력 → 스타일 → 복사 플로우", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  // "Bold" 라벨은 "Bold Italic" 카드의 접근성 이름도 부분 문자열로
  // 포함하므로(둘 다 "Bold"로 시작), 라벨 span의 정확한 텍스트로
  // 필터링해 카드 하나만 정확히 골라낸다.
  function boldCard(page: import("@playwright/test").Page) {
    return page
      .locator("button")
      .filter({ has: page.getByText("Bold", { exact: true }) });
  }

  test("텍스트를 입력하면 스타일 카드들이 즉시 변환된 결과를 보여준다", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.getByPlaceholder("텍스트를 입력하세요");
    await input.fill("Hi");

    await expect(boldCard(page)).toContainText("𝐇𝐢");
  });

  test("스타일 카드를 클릭하면 클립보드에 복사되고 피드백이 표시된다", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByPlaceholder("텍스트를 입력하세요").fill("Hi");

    const card = boldCard(page);
    await card.click();

    await expect(card).toContainText("Copied");

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe("𝐇𝐢");
  });

  test("입력이 비어있으면 카드가 비활성화된다", async ({ page }) => {
    await page.goto("/");

    await expect(boldCard(page)).toBeDisabled();
  });
});
