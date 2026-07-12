// One-off admin function: creates OKR app accounts with an initial password
// and emails each user their login details. Guarded by an admin secret so it
// cannot be triggered anonymously.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Invitee {
  name: string
  email: string
  password: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminSecret = Deno.env.get('INVITE_ADMIN_SECRET')

  // Simple guard: caller must present the admin secret.
  const provided = req.headers.get('x-admin-secret')
  if (!adminSecret || provided !== adminSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { invitees, appUrl, tenantId } = (await req.json()) as {
    invitees: Invitee[]
    appUrl: string
    tenantId: string
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const results: Record<string, unknown>[] = []

  for (const inv of invitees) {
    const entry: Record<string, unknown> = { email: inv.email }

    // 1. Create the account (idempotent-ish: report if already exists)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: inv.email,
      password: inv.password,
      email_confirm: true,
      user_metadata: { full_name: inv.name, tenant_id: tenantId },
    })

    if (createErr) {
      entry.created = false
      entry.createError = createErr.message
    } else {
      entry.created = true
      entry.userId = created.user?.id
    }

    // 2. Send the invite email regardless (so re-runs still deliver credentials)
    const { data: sendData, error: sendErr } = await supabase.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'okr-invite',
          recipientEmail: inv.email,
          idempotencyKey: `okr-invite-${inv.email}`,
          templateData: {
            name: inv.name,
            appUrl,
            email: inv.email,
            password: inv.password,
          },
        },
      },
    )

    entry.emailSent = !sendErr
    if (sendErr) entry.emailError = sendErr.message
    else entry.emailResult = sendData

    results.push(entry)
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
