import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderEmailHtml(code: string, email: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,monospace;">
  <div style="max-width:520px;margin:32px auto;border:1px solid #262626;background:#0b0b0b;padding:32px;">
    <div style="border-bottom:2px solid #ff1e38;padding-bottom:16px;margin-bottom:24px;">
      <span style="font-size:18px;font-weight:900;letter-spacing:0.12em;color:#ffffff;">ABLI <span style="color:#ff1e38;">CODE</span></span>
    </div>
    <p style="margin:0 0 12px;color:#d4d4d8;font-size:14px;">Verification code requested for <strong style="color:#ffffff;">${email}</strong></p>
    <div style="margin:24px 0;padding:20px;background:#050505;border:1px solid #ff1e38;text-align:center;">
      <span style="font-size:34px;font-weight:800;letter-spacing:0.35em;color:#ffffff;">${code}</span>
    </div>
    <p style="margin:0 0 18px;color:#a1a1aa;font-size:12px;">Expires in 10 minutes. Never share this code with anyone.</p>
    <div style="border-top:1px solid #1f1f23;padding-top:16px;font-size:11px;color:#71717a;">
      Questions or security reports: <a href="mailto:umaralfatehsuhaimi02@gmail.com" style="color:#ff1e38;">umaralfatehsuhaimi02@gmail.com</a>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, purpose = "signup" } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(`${cleanEmail}:${code}`));
    const codeHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    await supabase.from("email_verification_codes").insert({
      email: cleanEmail,
      code_hash: codeHash,
      purpose,
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Abli Code <onboarding@resend.dev>";

    if (resendKey) {
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [cleanEmail],
          subject: `${code} is your Abli Code verification code`,
          html: renderEmailHtml(code, cleanEmail),
        }),
      });
      if (!mailRes.ok) {
        const errText = await mailRes.text();
        return new Response(JSON.stringify({ error: `Email delivery failed: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, delivered: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, delivered: false, preview_code: code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
