import fetch from 'isomorphic-fetch';
import BigNumber from 'bignumber.js';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const GIVETH_API_URL = 'https://mainnet.serve.giveth.io/graphql';

BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

export function bnum(val) {
  return new BigNumber(val.toString());
}

export async function fetchDonations() {

  const query = `
    {
      donations {
        amount
        valueUsd  
        createdAt
        project {
          id
        }
        user {
          id
          walletAddress
        }
      }
    }
  `;

  const response = await fetch(GIVETH_API_URL, {
    method: 'POST',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query,
    }),
  });

  const { data } = await response.json();

  return data;
}

export async function fetchTokenPrice(address, time) {

  const query = `coins/ethereum/contract/${address}/market_chart/range?&vs_currency=usd&from=${time}&to=${time}`;

  const response = await fetch(`${COINGECKO_API_URL}/${query}`, {
      headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
      },
  });

  const price = await response.json();

  return price;
}