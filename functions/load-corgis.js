import fetch from 'node-fetch';
import { hasuraRequest } from "./util/hasura.js";

exports.handler = async () => {

  const corgis = await fetch('https://no-cors-api.netlify.app/api/corgis')
    .then(res => res.json());

  const unslashPromise = await fetch('https://api.unsplash.com/collections/48405776/photos',
    {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    }).then(res => res.json());

  const hasuraPromise = hasuraRequest({
    query: `
      mutation InsertOrUpdateBoops($corgis: [boops_insert_input!]!) {
        boops: insert_boops(objects: $corgis, on_conflict: {constraint: boops_pkey, update_columns: id}) {
          returning {
            count
            id
          }
        }
      }
      `,
    variables: {
      corgis: corgis.map(({ id }) => ({ id, count: 0 }))
    }
  });

  const [unsplashData, hasuraData] = await Promise.all([unslashPromise, hasuraPromise]);

  const completeData = corgis.map((corgi) => {
    const photo = unsplashData.find((p) => corgi.id === p.id);
    const boops = hasuraData.boops.returning.find((b) => b.id === corgi.id);
    return {
      ...corgi,
      alt: photo.alt_description,
      credit: photo.user.name,
      url: `${photo.urls.raw}&auto=format&fit=crop&w=500&h=500&q=80&crop=entropy`,
      boops: boops.count
    };
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(completeData)
  }
}
