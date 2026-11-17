import { beforeEach, describe, expect, it } from "vitest";
import { useKineticStore } from "./useKineticStore";

describe("useKineticStore", () => {
  beforeEach(() => {
    useKineticStore.getState().reset();
  });

  it("기본 상태가 정상적으로 설정된다", () => {
    const state = useKineticStore.getState();
    expect(state.text).toBe("Wave");
    expect(state.fontId).toBe("space-grotesk");
    expect(state.isFontLoading).toBe(false);
    expect(state.isFontFailed).toBe(false);
  });

  it("setText로 텍스트를 변경할 수 있다", () => {
    useKineticStore.getState().setText("New Text");
    expect(useKineticStore.getState().text).toBe("New Text");
  });

  it("setFontId로 폰트를 변경할 수 있다", () => {
    useKineticStore.getState().setFontId("righteous");
    expect(useKineticStore.getState().fontId).toBe("righteous");
    expect(useKineticStore.getState().isFontFailed).toBe(false);
  });

  it("selectEffect로 이펙트와 기본 파라미터가 갱신된다", () => {
    useKineticStore.getState().selectEffect("glitch");
    const state = useKineticStore.getState();
    expect(state.effectId).toBe("glitch");
    expect(typeof state.params).toBe("object");
  });
});
