import * as queries from "./queries";

export interface Env {
  TRANSPOSE_URL: string;
  TRANSPOSE_KEY: string;
}

const index = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VitaDAO workers API</title>
  </head>
  <body style="max-width: 600px">
    <h1>VitaDAO workers API</h1>
    <p>Direct fetching from Transpose fails with 502:</p>
    <ul>
      <li>
        <a href="/history">history</a>: a timeseries of the total USD balance of
        vitadao.eth's multisig. One data point per day.
      </li>
      <li>
        <a href="/stats">stats</a>: circulating supply (currently total supply)
        of VITA and its market cap.
      </li>
      <li>
        <a href="/tokens">tokens</a>: list of tokens currently in vitadao.eth
        and some data about each token.
      </li>
    </ul>
    <p>Fetching through a proxy on Deno works:</p>
    <ul>
      <li>
        <a href="/proxy-history">proxy-history</a>: a timeseries of the total USD balance of
        vitadao.eth's multisig. One data point per day.
      </li>
      <li>
        <a href="/proxy-stats">proxy-stats</a>: circulating supply (currently total supply)
        of VITA and its market cap.
      </li>
      <li>
        <a href="/proxy-tokens">proxy-tokens</a>: list of tokens currently in vitadao.eth
        and some data about each token.
      </li>
    </ul>
    <p>Other tests:</p>
    <ul>
      <li>
        <a href="/random">random</a>: a random beer fetched from
        random-data-api.com, cached for 60 seconds on Cloudflare. I.e. you
        should get a new beer only every minute, not on every request. The
        purpose of this endpoint is to test that the caching works (which it
        does, across Cloudflare datacenters).
      </li>
      <li>
        <a href="/post">post</a>: triggers a post to
        jsonplaceholder.typicode.com, simulating the creation of a resource.
        This was added to troubleshoot the 502 returned from a POST to
        Transpose. We wanted to test whether Cloudflare is being more
        restrictive with POST requests than GET requests.
      </li>
    </ul>
  </body>
</html>`;

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
        return post("https://sql.transpose.io", { sql: queries.history });
      case "/stats":
        return post("https://sql.transpose.io", { sql: queries.stats });
      case "/tokens":
        return post("https://sql.transpose.io", { sql: queries.tokens });
      case "/proxy-history":
        return post("https://cloudflare-transpose-proxy.deno.dev/", {
          sql: queries.history,
        });
      case "/proxy-stats":
        return post("https://cloudflare-transpose-proxy.deno.dev/", {
          sql: queries.stats,
        });
      case "/proxy-tokens":
        return post("https://cloudflare-transpose-proxy.deno.dev/", {
          sql: queries.tokens,
        });
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
        return new Response(index, {
          headers: {
            "Content-Type": "text/html",
          },
        });
    }
  },
};
