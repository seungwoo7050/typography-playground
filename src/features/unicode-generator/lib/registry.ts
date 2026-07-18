import { allStyles } from "../data/styles";
import type { UnicodeStyleCategory, UnicodeStyleDefinition } from "./types";

/**
 * 스타일 배열을 id -> 정의 맵으로 집계한다. 중복 id는 즉시 예외를 던져
 * 모듈 로드 시점에 실패하게 만든다(런타임에 조용히 하나를 덮어쓰지 않음).
 */
export function buildRegistry(
  styles: UnicodeStyleDefinition[],
): Map<string, UnicodeStyleDefinition> {
  const byId = new Map<string, UnicodeStyleDefinition>();
  for (const style of styles) {
    if (byId.has(style.id)) {
      throw new Error(`중복된 유니코드 스타일 id: ${style.id}`);
    }
    byId.set(style.id, style);
  }
  return byId;
}

const registry = buildRegistry(allStyles);

export function getStyle(id: string): UnicodeStyleDefinition | undefined {
  return registry.get(id);
}

export function listStyles(): UnicodeStyleDefinition[] {
  return [...registry.values()];
}

export function listCategories(): UnicodeStyleCategory[] {
  const categories = new Set<UnicodeStyleCategory>();
  for (const style of registry.values()) {
    categories.add(style.category);
  }
  return [...categories];
}

export function listStylesByCategory(
  category: UnicodeStyleCategory,
): UnicodeStyleDefinition[] {
  return listStyles().filter((style) => style.category === category);
}
