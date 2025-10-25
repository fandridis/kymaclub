export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);

    // if (url.pathname.startsWith("/api/")) {
    //   return Response.json({
    //     name: "Cloudflare",
    //   });
    // }

    // Serve static assets from Vite build
    try {
      // @ts-ignore - ASSETS is injected by Cloudflare
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // Fallback to 404
      return new Response('Not Found', { status: 404 });
    }
  },
} satisfies ExportedHandler<Env>;
