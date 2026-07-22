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
      className="w-full border-b border-mist bg-transparent px-1 py-4 text-3xl text-ink outline-none placeholder:text-graphite focus:border-signal sm:text-4xl"
    />
  );
}
