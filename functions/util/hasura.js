import fetch from 'node-fetch';

export const hasuraRequest = async ({query, variables}) => {
  const result = await fetch(process.env.HASURA_URL, {
    method: 'POST',
    headers: {
      'X-Hasura-Admin-Secret': process.env.HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  }).then((res) => res.json());

  if (!result || !result.data) {
    console.error(result);
    return [];
  }
  return result.data;
};
