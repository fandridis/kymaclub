declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY: string;
  }
}

declare module "*.json" {
  const value: any;
  export default value;
}
