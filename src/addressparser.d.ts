declare module 'nodemailer/lib/addressparser/index.js' {
  export default function addressParser(value: string, options?: { flatten?: boolean }): Array<{ name?: string; address?: string; group?: unknown[] }>
}
