import { missing, ThrowableRouter } from "itty-router-extras";

import * as constants from "./constants";

export interface Env {
  TRANSPOSE_KEY: string;
}

const TRANSPOSE_URL = "https://sql.transpose.io";
const PROXY_URL = "https://cloudflare-transpose-proxy.deno.dev/";

const router = ThrowableRouter();

// Direct Transpose fetches
router
  .get("/history", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.history }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/stats", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.stats }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/tokens", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.tokens }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  );

// Proxied Transpose fetches
router
  .get("/proxy-history", (_req, env) =>
    fetch(PROXY_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.history }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/proxy-stats", (_req, env) =>
    fetch(PROXY_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.stats }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/proxy-tokens", (_req, env) =>
    fetch(PROXY_URL, {
      method: "POST",
      body: JSON.stringify({ sql: constants.tokens }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  );

// Other
router
  .get("/random", () =>
    fetch("https://random-data-api.com/api/v2/beers", {
      cf: {
        cacheTtl: 60,
        cacheEverything: true,
      },
    })
  )
  .get("/count/post", () =>
    fetch("https://cloudflare-transpose-proxy.deno.dev/post-receiver", {
      method: "POST",
      cf: {
        cacheTtl: 60,
        cacheEverything: true,
      },
    })
  )
  .get("/count/get", () =>
    fetch("https://cloudflare-transpose-proxy.deno.dev/post-receiver")
  );

// Root and 404
router
  .get(
    "/",
    () =>
      new Response(constants.index, {
        headers: {
          "Content-Type": "text/html",
        },
      })
  )
  .all("*", () => missing("Oops!  We could not find that page."));

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(req, env, ctx),
};
