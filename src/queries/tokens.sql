WITH balances AS (
    SELECT
        balance,
        et.name,
        et.symbol,
        et.decimals,
        et.image_url as src,
        (SELECT price FROM ethereum.token_prices tp
            WHERE tp.token_address = eto.contract_address
            ORDER BY timestamp desc limit 1) as price
    FROM ethereum.token_owners eto
    JOIN ethereum.tokens et ON eto.contract_address = et.contract_address
    WHERE  owner_address='0xF5307a74d1550739ef81c6488DC5C7a6a53e5Ac2' AND balance > 0
) SELECT
    name,
    symbol,
    (balance / POWER(10, decimals)) AS balance,
        COALESCE((balance / POWER(10, decimals) * price), 0) AS usd_value,
    price,
    src
  FROM balances
  ORDER BY usd_value DESC;