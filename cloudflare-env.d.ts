declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DEEPSEEK_API_KEY?: string;
    DEEPSEEK_GUIDANCE_MODEL?: string;
  }
}
