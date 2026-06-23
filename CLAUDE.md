# Spendio — Project Rules

## TypeScript

- Use **enums** for fixed sets of hardcoded string values instead of string-literal union types.
  - Prefer `enum DatePreset { ThisMonth = 'this-month', ... }` over `type DatePreset = 'this-month' | ...`.
  - Reference the enum members in code (`DatePreset.ThisMonth`) instead of repeating the raw strings.
