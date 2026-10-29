/** The pinned converter exposes no TypeScript declarations. */
declare module 'html-to-text' {
  export function compile(options: {
    wordwrap?: number | false
    limits?: { maxInputLength?: number; maxDepth?: number; maxChildNodes?: number; ellipsis?: string }
  }): (html: string) => string
}
