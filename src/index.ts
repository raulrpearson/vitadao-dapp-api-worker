import { json, missing, ThrowableRouter } from "itty-router-extras";

import index from "./index.html";
import historyQuery from "./queries/history.sql";
import statsQuery from "./queries/stats.sql";
import tokensQuery from "./queries/tokens.sql";

export interface Env {
  TRANSPOSE_KEY: string;
  cache: KVNamespace;
}

const TRANSPOSE_URL = "https://sql.transpose.io";
const PROXY_URL = "https://cloudflare-transpose-proxy.deno.dev";

const router = ThrowableRouter();

// Direct Transpose fetches
router
  .get("/history", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: historyQuery }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/stats", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: statsQuery }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/tokens", (_req, env) =>
    fetch(TRANSPOSE_URL, {
      method: "POST",
      body: JSON.stringify({ sql: tokensQuery }),
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
      body: JSON.stringify({ sql: historyQuery }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/proxy-stats", (_req, env) =>
    fetch(PROXY_URL, {
      method: "POST",
      body: JSON.stringify({ sql: statsQuery }),
      headers: {
        "X-API-KEY": env.TRANSPOSE_KEY,
        "Content-Type": "application/json",
      },
    })
  )
  .get("/proxy-tokens", (_req, env) =>
    fetch(PROXY_URL, {
      method: "POST",
      body: JSON.stringify({ sql: tokensQuery }),
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
  .get("/count/post", async (_req, env, ctx) => {
    // TODO improve typing of env
    const count = JSON.parse(await env.cache.get("count")) as {
      timestamp: string;
      value: Record<string, unknown>;
    } | null;

    if (count && Date.now() - Number(count.timestamp) <= 30_000) {
      // Fresh cache value
      return json(count.value);
    } else if (count) {
      // Stale while revalidate. waitUntil doesn't block, just signals the CF
      // Worker runtime to wait until this promise is settled before unwinding
      // the V8 isolate, I guess.
      ctx.waitUntil(
        fetch(PROXY_URL + "/post-receiver", { method: "POST" })
          .then((res) => res.json())
          .then((value) =>
            env.cache.put(
              "count",
              JSON.stringify({
                timestamp: Date.now(),
                value,
              })
            )
          )
      );
      return json(count.value);
    } else {
      // Cache miss
      return fetch(PROXY_URL + "/post-receiver", { method: "POST" })
        .then((res) => res.json())
        .then((value) => {
          env.cache.put(
            "count",
            JSON.stringify({
              timestamp: Date.now(),
              value,
            })
          );
          // TODO shouldn't json be able to take any type?
          // @ts-expect-error
          return json(value);
        });
    }
  })
  .get("/count/get", () => fetch(PROXY_URL + "/post-receiver"));

// Root and 404
router
  .get(
    "/",
    () =>
      new Response(index, {
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
