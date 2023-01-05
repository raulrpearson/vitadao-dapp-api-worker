import * as constants from "./constants";

export interface Env {
  TRANSPOSE_KEY: string;
}

const TRANSPOSE_URL = "https://sql.transpose.io";
const PROXY_URL = "https://cloudflare-transpose-proxy.deno.dev/";

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const post = (url: string, body: Record<"sql", string>) => {
      return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "X-API-KEY": env.TRANSPOSE_KEY,
          "Content-Type": "application/json",
        },
      });
    };

    switch (new URL(request.url).pathname) {
      case "/history":
        return post(TRANSPOSE_URL, { sql: constants.history });
      case "/stats":
        return post(TRANSPOSE_URL, { sql: constants.stats });
      case "/tokens":
        return post(TRANSPOSE_URL, { sql: constants.tokens });
      case "/proxy-history":
        return post(PROXY_URL, { sql: constants.history });
      case "/proxy-stats":
        return post(PROXY_URL, { sql: constants.stats });
      case "/proxy-tokens":
        return post(PROXY_URL, { sql: constants.tokens });
      case "/random":
        return fetch("https://random-data-api.com/api/v2/beers", {
          cf: {
            cacheTtl: 60,
            cacheEverything: true,
          },
        });
      case "/post":
        return fetch("https://jsonplaceholder.typicode.com/posts", {
          method: "POST",
          body: JSON.stringify({
            title: "foo",
            body: "bar",
            userId: 1,
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        });
      default:
        return new Response(constants.index, {
          headers: {
            "Content-Type": "text/html",
          },
        });
    }
  },
};
