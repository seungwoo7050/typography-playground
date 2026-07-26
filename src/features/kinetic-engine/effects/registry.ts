import { allEffects } from "./index";
import type { AnyEffectDefinition } from "./types";

/** unicode-generator의 registry.ts와 동일한 패턴 — 중복 id는 모듈
 * 로드 시점에 즉시 예외를 던진다. */
export function buildRegistry(
  effects: AnyEffectDefinition[],
): Map<string, AnyEffectDefinition> {
  const byId = new Map<string, AnyEffectDefinition>();
  for (const effect of effects) {
    if (byId.has(effect.id)) {
      throw new Error(`중복된 이펙트 id: ${effect.id}`);
    }
    byId.set(effect.id, effect);
  }
  return byId;
}

const registry = buildRegistry(allEffects);

export function getEffect(id: string): AnyEffectDefinition | undefined {
  return registry.get(id);
}

export function listEffects(): AnyEffectDefinition[] {
  return [...registry.values()];
}
