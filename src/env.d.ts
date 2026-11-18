/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user: import('./lib/auth').AdminUser | null;
    adminBase: string;
  }
}
interface ImportMetaEnv {
  readonly PUBLIC_GA_ID?: string;
  readonly PUBLIC_GADS_ID?: string;
  readonly PUBLIC_GADS_CONVERSION_LABEL?: string;
  readonly PUBLIC_META_PIXEL_ID?: string;
}
