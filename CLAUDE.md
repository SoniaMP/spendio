# Spendio — Project Rules

## TypeScript

- Use **enums** for fixed sets of hardcoded string values instead of bare string-literal union types.
  - The tsconfig sets `erasableSyntaxOnly: true`, so **native TS `enum` is not allowed** (it emits runtime code). Use the erasable const-object + type pattern instead:
    ```ts
    export const DatePreset = {
      ThisMonth: 'this-month',
      ThisYear: 'this-year',
    } as const;
    export type DatePreset = (typeof DatePreset)[keyof typeof DatePreset];
    ```
  - Reference the members in code (`DatePreset.ThisMonth`) instead of repeating the raw strings.
