import type { UnicodeStyleDefinition } from "../../lib/types";
import { bubbleStyles } from "./bubble";
import { gothicStyles } from "./gothic";
import { scriptStyles } from "./script";
import { weightStyles } from "./weight";

// 각 스타일 그룹 파일이 이 배열에 자신의 정의를 추가한다.
export const allStyles: UnicodeStyleDefinition[] = [
  ...weightStyles,
  ...scriptStyles,
  ...gothicStyles,
  ...bubbleStyles,
];
