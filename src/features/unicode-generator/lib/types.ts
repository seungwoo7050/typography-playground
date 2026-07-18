export type UnicodeStyleCategory =
  | "weight" // bold, italic, bold-italic, small-caps
  | "alphabet" // script, double-struck, gothic, fullwidth
  | "enclosed" // bubble(circled), square
  | "decoration" // strikethrough, underline
  | "transform" // superscript, subscript, upside-down, mirror
  | "glitch"; // zalgo

export interface UnicodeStyleDefinition {
  id: string;
  label: string;
  category: UnicodeStyleCategory;
  transform: (input: string) => string;
}
