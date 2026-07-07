export async function onRequestGet(context) {
  const { env, params } = context;

  if (!env.FILES_BUCKET) {
    return new Response("Not Found", { status: 404 });
  }

  const object = await env.FILES_BUCKET.get(params.key);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  // アップロード後に内容が変わらない前提で長期キャッシュする(ファイル名にランダムなキーを含むため)
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
