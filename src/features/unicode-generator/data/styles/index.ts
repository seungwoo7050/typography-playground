import type { UnicodeStyleDefinition } from "../../lib/types";
import { bubbleStyles } from "./bubble";
import { decorationStyles } from "./decoration";
import { doubleStruckStyles } from "./double-struck";
import { fullwidthStyles } from "./fullwidth";
import { gothicStyles } from "./gothic";
import { scriptStyles } from "./script";
import { smallCapsStyles } from "./small-caps";
import { squareStyles } from "./square";
import { superscriptSubscriptStyles } from "./superscript-subscript";
import { weightStyles } from "./weight";

// 각 스타일 그룹 파일이 이 배열에 자신의 정의를 추가한다.
export const allStyles: UnicodeStyleDefinition[] = [
  ...weightStyles,
  ...smallCapsStyles,
  ...scriptStyles,
  ...gothicStyles,
  ...doubleStruckStyles,
  ...fullwidthStyles,
  ...bubbleStyles,
  ...squareStyles,
  ...superscriptSubscriptStyles,
  ...decorationStyles,
];
