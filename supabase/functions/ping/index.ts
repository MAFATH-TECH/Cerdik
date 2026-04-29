import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async () => {
  return new Response(JSON.stringify({ ok: true, message: "pong" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
