SELECT
    et.supply / POWER(10, et.decimals) as circulating,
    prices.price * (et.supply / POWER(10, et.decimals)) as market_cap
FROM ethereum.tokens et
JOIN
    (SELECT
        token_address,
        price
    FROM ethereum.token_prices etp
    WHERE etp.token_address = '0x81f8f0bb1cB2A06649E51913A151F0E7Ef6FA321'
    ORDER BY timestamp desc limit 1) as prices
ON prices.token_address = et.contract_address
WHERE et.contract_address = '0x81f8f0bb1cB2A06649E51913A151F0E7Ef6FA321';