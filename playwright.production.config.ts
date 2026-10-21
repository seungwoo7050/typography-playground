import { defineConfig, devices } from "@playwright/test";

// output: 'export' 정적 빌드는 `next start` 서버가 없다 — out/ 디렉토리를
// 정적 파일 서버(serve)로 띄워 실제 배포 산출물에 대해 검증한다.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  workers: 1,
  // CI에서는 일시적인 실패(러너 부하로 인한 타임아웃 등) 한 번이
  // 배포까지 막지 않도록 한 번 다시 돌린다. 재시도로 통과한 테스트는
  // 리포터에 flaky로 따로 표시되므로 불안정성이 묻히지 않는다.
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start:e2e",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
