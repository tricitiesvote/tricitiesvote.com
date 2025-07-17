declare module 'fold-to-ascii' {
  export function foldReplacing(str: string, replacement?: string): string;
  export function foldMaintaining(str: string): string;
  export function fold(str: string, replacement?: string): string;
}

declare module 'fastest-levenshtein' {
  export function distance(str1: string, str2: string): number;
  export function closest(str: string, candidates: string[]): string;
}

declare module 'cheerio' {
  export function load(html: string): any;
  export * from 'cheerio';
}