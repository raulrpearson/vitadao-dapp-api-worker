/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  VARIABLE: string;
}

const baseUrl = "https://random-data-api.com/api/v2";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    let response = await fetch(baseUrl + pathname, {
      cf: {
        // Cloudflare cache 5 minutes
        cacheTtl: 300,
        cacheEverything: true,
      },
    });

    // Browser cache 5 minutes. Clone response to mutate.
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "max-age=300");
    return response;
  },
};
