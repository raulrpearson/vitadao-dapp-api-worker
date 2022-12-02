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
    <p>Choose and endpoint</p>
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
      <li>
        <a href="/random">random</a>: a random beer fetched from
        random-data-api.com, cached for 60 seconds on Cloudflare. I.e. you
        should get a new beer only every minute, not on every request. The
        purpose of this endpoint is to test that the caching works (which it
        does, across Cloudflare datacenters).
      </li>
    </ul>
  </body>
</html>`;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    console.log("parse query");
    let query;
    switch (new URL(request.url).pathname) {
      case "/history":
        query = queries.history;
        break;
      case "/stats":
        query = queries.stats;
        break;
      case "/tokens":
        query = queries.tokens;
        break;
      case "/random": {
        return fetch("https://random-data-api.com/api/v2/beers", {
          cf: {
            cacheTtl: 60,
            cacheEverything: true,
          },
        });
      }
      default:
        return new Response(index, {
          headers: {
            "Content-Type": "text/html",
          },
        });
    }

    console.log("fetch");
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
    const res = response.clone();
    console.log({ status: res.status, statusText: res.statusText });

    console.log("mutate response");
    // Browser cache 5 minutes. Clone response to mutate.
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "max-age=300");

    console.log("return");
    return response;
  },
};
