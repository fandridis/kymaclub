declare namespace Cloudflare {
  interface Env {
    NOTION_API_KEY: string;
    NOTION_PAGE_BUSINESS_WL_ID: string;
    NOTION_PAGE_CONSUMER_WL_ID: string;
  }
}

declare module "*.json" {
  const value: any;
  export default value;
}
