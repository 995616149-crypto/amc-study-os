const ALLOWED_IMAGE_HOSTS=new Set(["upload.wikimedia.org"]);

export async function GET(request:Request){
  const raw=new URL(request.url).searchParams.get("url");
  if(!raw)return new Response("Missing image URL",{status:400});
  let source:URL;try{source=new URL(raw)}catch{return new Response("Invalid image URL",{status:400})}
  if(source.protocol!=="https:"||!ALLOWED_IMAGE_HOSTS.has(source.hostname))return new Response("Untrusted image source",{status:403});
  try{const upstream=await fetch(source.toString(),{redirect:"error",headers:{accept:"image/png,image/jpeg,image/webp,image/avif"}});const contentType=(upstream.headers.get("content-type")??"").split(";")[0].trim().toLowerCase();if(!upstream.ok||!["image/png","image/jpeg","image/webp","image/avif"].includes(contentType))return new Response("Image unavailable",{status:502});const length=Number(upstream.headers.get("content-length")??0);if(length>8_000_000)return new Response("Image too large",{status:413});const bytes=await upstream.arrayBuffer();if(bytes.byteLength>8_000_000)return new Response("Image too large",{status:413});return new Response(bytes,{headers:{"content-type":contentType,"cache-control":"public, max-age=86400, stale-while-revalidate=604800","x-tutor-visual-proxy":"wikimedia-commons"}})}catch{return new Response("Image unavailable",{status:502})}
}
