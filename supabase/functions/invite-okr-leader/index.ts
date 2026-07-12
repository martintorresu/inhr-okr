// Invites a single OKR leader from the app. Callable by an authenticated
// tenant admin only. Creates the account (if needed) with a generated initial
// password and emails the login details.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Body {
  name: string
  email: string
  appUrl: string
  tenantId: string
}

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  let out = ''
  for (const b of bytes) out += chars[b % chars.length]
  return out + '!7'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization') ?? ''
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await authed.auth.getUser()
    if (userErr || !userData.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { name, email, appUrl, tenantId } = (await req.json()) as Body
    if (!email || !tenantId) {
      return json({ error: 'Missing email or tenantId' }, 400)
    }

    // Verify the caller is an admin of this tenant.
    const service = createClient(supabaseUrl, serviceKey)
    const { data: isAdmin, error: roleErr } = await service.rpc('has_role', {
      _user_id: userData.user.id,
      _tenant_id: tenantId,
      _role: 'admin',
    })
    if (roleErr || !isAdmin) {
      return json({ error: 'Forbidden' }, 403)
    }

    const password = genPassword()

    // Create the account (report if it already exists).
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, tenant_id: tenantId },
    })

    const alreadyExists = !!createErr && /already|exists|registered/i.test(createErr.message)

    // If the account already exists, reset its password so the emailed
    // credentials are valid for re-invites.
    if (alreadyExists) {
      const { data: list } = await service.auth.admin.listUsers()
      const existing = list?.users?.find(
        (u) => (u.email ?? '').toLowerCase() === email.toLowerCase(),
      )
      if (existing) {
        await service.auth.admin.updateUserById(existing.id, { password })
      }
    }

    // Send the invite email with credentials.
    const { data: sendData, error: sendErr } = await service.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'okr-invite',
          recipientEmail: email,
          idempotencyKey: `okr-invite-${email}-${Date.now()}`,
          templateData: { name, appUrl, email, password },
        },
      },
    )

    return json({
      email,
      created: !createErr,
      alreadyExists,
      createError: createErr?.message ?? null,
      emailSent: !sendErr,
      emailError: sendErr?.message ?? null,
      emailResult: sendData ?? null,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
