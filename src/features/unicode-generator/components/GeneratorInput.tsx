"use client";

interface GeneratorInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GeneratorInput({ value, onChange }: GeneratorInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="텍스트를 입력하세요"
      autoFocus
      // outline-none이 Tailwind의 --tw-outline-style 커스텀 프로퍼티를
      // 이 엘리먼트에서 영구히 none으로 덮어써서, 같은 엘리먼트의
      // focus-visible:outline-2(내부적으로 var(--tw-outline-style)를
      // 읽음)도 항상 none으로 풀린다 — 그래서 outline-style만
      // 임의값(arbitrary value)으로 직접 지정해 그 변수를 우회한다.
      className="w-full border-b border-mist bg-transparent px-1 py-4 text-3xl text-ink outline-none placeholder:text-graphite focus:border-signal focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal sm:text-4xl"
    />
  );
}
