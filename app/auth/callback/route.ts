import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { resolveUserRole } from '@/lib/roles';
import { supabaseCookieOptions } from '@/lib/supabase-cookie';

export async function GET(request: Request) {
  // URL callback berisi code OAuth atau pesan error dari Google.
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription =
    requestUrl.searchParams.get('error_description');

  // Jika Google mengirim error, kembalikan pesannya ke halaman login.
  if (error) {
    const message =
      errorDescription || 'Google login gagal.';

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(message)}`,
        requestUrl.origin
      )
    );
  }

  // Tanpa code, sesi tidak bisa dibuat.
  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/login?error=OAuth%20code%20tidak%20ditemukan',
        requestUrl.origin
      )
    );
  }

  // Siapkan response redirect sekaligus tempat Supabase menyimpan cookie sesi.
  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL('/onboarding', requestUrl.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              cookieStore.set(name, value, options);

              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  // Tukarkan code OAuth dengan sesi login Supabase.
  const {
    data,
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      'exchangeCodeForSession error:',
      exchangeError
    );

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          exchangeError.message
        )}`,
        requestUrl.origin
      )
    );
  }

  // Callback dianggap gagal jika sesi atau data user tidak terbentuk.
  if (!data.session || !data.user) {
    return NextResponse.redirect(
      new URL(
        '/login?error=Session%20Supabase%20tidak%20terbentuk',
        requestUrl.origin
      )
    );
  }

  // Gunakan service role jika tersedia agar data profil bisa dibaca tanpa terhalang RLS.
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : supabase;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, status')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Gagal membaca profil pada callback login:', profileError.message);
  }

  const profileRole = profile?.role ?? null;
  const metadataRole = data.user.user_metadata?.role ?? null;
  const metadataAppRole = data.user.user_metadata?.app_role ?? null;
  const hasProfileRecord = Boolean(profile);

  // Role profil diprioritaskan, dengan metadata sebagai cadangan.
  const activeRole = resolveUserRole(profileRole, metadataRole, metadataAppRole);

  if (profileRole && metadataRole && profileRole !== metadataRole) {
    console.warn('Role konflik terdeteksi:', {
      userId: data.user.id,
      profileRole,
      metadataRole,
    });
  }

  const dashboardByRole: Record<string, string> = {
    admin: '/dashboard/admin',
    merchant: '/dashboard/merchant',
    courier: '/dashboard/kurir',
    kurir: '/dashboard/kurir',
    customer: '/dashboard/konsumen_umum',
    konsumen_umum: '/dashboard/konsumen_umum',
    waste_processor: '/dashboard/energi',
    pengolah_energi: '/dashboard/energi',
    beneficiary: '/dashboard/konsumen_panti',
    konsumen_panti: '/dashboard/konsumen_panti',
  };

  // User yang belum punya profil lengkap diarahkan untuk mengisi onboarding.
  const targetPath = hasProfileRecord && activeRole
    ? dashboardByRole[activeRole] || (activeRole === 'courier' ? '/dashboard/kurir' : undefined)
    : undefined;
  const destination = targetPath || '/onboarding';

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}