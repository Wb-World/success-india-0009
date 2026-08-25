import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getResendClient } from '@/lib/resend';

export const dynamic = 'force-dynamic';

function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

async function sendResetEmail(to: string, resetLink: string, username: string) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #16a34a; font-size: 1.5rem; font-weight: 800; margin: 0;">Accsys India</h1>
      </div>
      <h2 style="color: #1f2937; margin-bottom: 12px;">Reset your password</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your Accsys India account password. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #16a34a; font-size: 14px;">${resetLink}</p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Accsys India. All rights reserved.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: 'Reset your Accsys India password',
    html,
  });

  if (error) {
    console.error('[resend] API error object:', JSON.stringify(error, null, 2));
    console.error('[resend] API error name:', error.name);
    console.error('[resend] API error message:', error.message);
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  console.log('[resend] Email sent successfully. Message ID:', data.id);
  return data;
}

export async function POST(request: Request) {
  console.log('[forgot-password] Request received');
  console.log('[forgot-password] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
  console.log('[forgot-password] RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'NOT SET');

  try {
    const { username, email } = await request.json();
    console.log('[forgot-password] Payload:', { username, email });

    if ((!username || !username.trim()) && (!email || !email.trim())) {
      return NextResponse.json(
        { error: 'Username or email is required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    let dbUser = null;
    if (cleanUsername) {
      const { data: byUsername } = await supabaseAdmin
        .from('users')
        .select('id, username, name')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (byUsername) {
        dbUser = byUsername;
      } else {
        const { data: byPhone } = await supabaseAdmin
          .from('users')
          .select('id, username, name')
          .eq('phone', cleanUsername)
          .maybeSingle();
        if (byPhone) dbUser = byPhone;
      }
    }

    let authUser = null;
    if (!dbUser && cleanEmail) {
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && userList?.users) {
        authUser = userList.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
      }

      if (!authUser) {
        const derivedUsername = cleanEmail.split('@')[0];
        const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            app_name: 'accsysindia',
            name: derivedUsername,
            username: derivedUsername,
          },
        });

        if (!createAuthError && newAuthUser?.user) {
          authUser = {
            id: newAuthUser.user.id,
            email: cleanEmail,
            user_metadata: {
              app_name: 'accsysindia',
              name: derivedUsername,
              username: derivedUsername,
            },
          };
        }
      }

      if (authUser) {
        const metaUsername = authUser.user_metadata?.username || cleanEmail.split('@')[0];
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, username')
          .eq('username', metaUsername)
          .maybeSingle();

        if (existingUser) {
          dbUser = existingUser;
        } else {
          const newId = `usr_${Date.now()}`;
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: newId,
              username: metaUsername,
              password: '',
              name: authUser.user_metadata?.name || metaUsername,
              phone: '',
              role: 'user',
            })
            .select('id, username')
            .single();

          if (!createError && newUser) {
            dbUser = newUser;
          }
        }
      }
    }

    if (!dbUser) {
      console.log('[forgot-password] No user found, returning generic success');
      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, we\'ve sent password reset instructions.',
      });
    }

    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/reset-password`;

    const { data: linkData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail || dbUser.username,
      options: {
        redirectTo,
      },
    });

    if (generateError || !linkData?.properties?.action_link) {
      console.error('[forgot-password] Failed to generate recovery link:', generateError);
      return NextResponse.json(
        { error: 'Failed to generate reset link. Please try again later.' },
        { status: 500 }
      );
    }

    const actionLink = linkData.properties.action_link;
    console.log('[forgot-password] Recovery link generated for user:', dbUser.username);

    try {
      const targetEmail = cleanEmail || authUser?.email || '';
      if (!targetEmail) {
        throw new Error('No email address available for this user');
      }

      await sendResetEmail(targetEmail, actionLink, dbUser.username);
    } catch (mailErr: any) {
      // Log the full Resend error server-side for diagnosability
      console.error('[forgot-password] ❌ Email send FAILED');
      console.error('[forgot-password] error.name:', mailErr?.name);
      console.error('[forgot-password] error.message:', mailErr?.message);
      console.error('[forgot-password] error.statusCode:', mailErr?.statusCode);
      console.error('[forgot-password] full error object:', JSON.stringify(mailErr, null, 2));

      const errMsg = (mailErr?.message || '').toLowerCase();

      let userMessage = 'Failed to send reset email. Please try again later.';
      if (errMsg.includes('api key') || errMsg.includes('invalid') || errMsg.includes('401')) {
        userMessage = 'Email service authentication failed. Please contact support.';
      } else if (errMsg.includes('domain') || errMsg.includes('verified')) {
        userMessage = 'Email service is not fully configured. Please verify your domain in Resend or contact support.';
      } else if (errMsg.includes('from') || errMsg.includes('sender')) {
        userMessage = 'Email sender address is not authorized. Please check RESEND_FROM_EMAIL configuration.';
      } else if (errMsg.includes('security purposes') || errMsg.includes('not request this after')) {
        userMessage = 'Too many reset requests. Please wait before trying again.';
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, we\'ve sent password reset instructions.',
    });
  } catch (err: any) {
    console.error('[forgot-password] API error:', err);
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
