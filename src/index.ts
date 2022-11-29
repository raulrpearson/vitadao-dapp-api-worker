import * as queries from "./queries";

export interface Env {
  TRANSPOSE_URL: string;
  TRANSPOSE_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    let query;
    switch (new URL(request.url).pathname.slice(1)) {
      case "history":
        query = queries.history;
        break;
      case "stats":
        query = queries.stats;
        break;
      case "tokens":
        query = queries.tokens;
        break;
    }

    let response = await fetch(env.TRANSPOSE_URL, {
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
      cf: {
        // Cloudflare cache 5 minutes
        cacheTtl: 300,
        cacheEverything: true,
      },
      method: "POST",
      body: JSON.stringify({ sql: query }),
    });

    // Browser cache 5 minutes. Clone response to mutate.
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "max-age=300");
    return response;
  },
};
