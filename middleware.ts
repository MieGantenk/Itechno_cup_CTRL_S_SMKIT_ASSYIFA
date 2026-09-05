import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveUserRole, toAppRole } from '@/lib/roles';
import { supabaseCookieOptions } from '@/lib/supabase-cookie';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Ambil session user dari Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 2. Jika BELUM LOGIN & mencoba akses halaman terproteksi.
  // Halaman dashboard utama /dashboard boleh dibuka secara umum,
  // sedangkan dashboard bersifat role-specific tetap diproteksi.
  if (!user) {
    const isProtectedDashboardRoute =
      path !== '/dashboard' && path.startsWith('/dashboard');

    if (
      isProtectedDashboardRoute ||
      path.startsWith('/admin') ||
      path === '/pending' ||
      path === '/onboarding' ||
      path === '/profil' ||
      path.startsWith('/map') ||
      path === '/peta' ||
      path === '/tier' ||
      path === '/kurir' ||
      path === '/dashboard/konsumen_umum'
    ) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 3. Jika SUDAH LOGIN, ambil profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Gagal membaca profil di middleware:', profileError.message);
  }

  const profileRole = profile?.role ?? null;
  const metadataRole = user.user_metadata?.role ?? null;
  const metadataAppRole = user.user_metadata?.app_role ?? null;
  const rawRole = resolveUserRole(profileRole, metadataRole, metadataAppRole);
  const role = rawRole ? toAppRole(rawRole) : undefined;
  const status = profile?.status ?? user.user_metadata?.status;
  const hasProfileRecord = Boolean(profile);
  const hasCompletedOnboarding = hasProfileRecord && Boolean(
    profileRole ||
    role ||
    rawRole ||
    user.user_metadata?.onboarding_completed === true ||
    status === 'active'
  );

  // Helper untuk menentukan dashboard default berdasarkan role
  const getRoleDashboard = (userRole?: string) => {
    switch (userRole) {
      case 'merchant':
        return '/dashboard/merchant';
      case 'kurir':
      case 'courier':
        return '/dashboard/kurir';
      case 'konsumen_umum':
        return '/dashboard/konsumen_umum';
      case 'pengolah_energi':
        return '/dashboard/energi';
      case 'konsumen_panti':
        return '/dashboard/konsumen_panti';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  // A. Hanya pengguna yang benar-benar belum punya role/profil lengkap yang diarahkan ke onboarding
  if (!hasCompletedOnboarding) {
    if (path !== '/onboarding') {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // B. BILA SUDAH PUNYA ROLE TAPI MENCOBA KEMBALI KE /ONBOARDING
  if (role && path === '/onboarding') {
    url.pathname = getRoleDashboard(role);
    return NextResponse.redirect(url);
  }

  // C. BILA STATUS 'PENDING' (Admin tetap dapat mengakses dashboard)
  if (status === 'pending' && role !== 'admin') {
    const targetDashboard = getRoleDashboard(role);

    if (path !== targetDashboard && path !== '/pending') {
      url.pathname = targetDashboard;
      return NextResponse.redirect(url);
    }

    if (path === '/pending') {
      url.pathname = targetDashboard;
      return NextResponse.redirect(url);
    }

    return response;
  }

  // D. BILA ADMIN ATAU AKUN AKTIF MASIH DI HALAMAN /PENDING
  if ((role === 'admin' || status === 'active') && path === '/pending') {
    url.pathname = getRoleDashboard(role);
    return NextResponse.redirect(url);
  }

  // E. PROTEKSI HAK AKSES BERDASARKAN ROLE
  const targetDashboard = getRoleDashboard(role);

  if (path === '/dashboard' || path === '/dashboard/') {
    if (!role) {
      if (!hasCompletedOnboarding) {
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
      return response;
    }

    if (targetDashboard !== '/dashboard') {
      url.pathname = targetDashboard;
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard/merchant') && role !== 'merchant') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard/energi') && role !== 'pengolah_energi') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard/kurir') && role !== 'kurir' && role !== 'courier') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard/konsumen_panti') && role !== 'konsumen_panti') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard/konsumen_umum') && role !== 'konsumen_umum') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  const isAdminDashboardRoute = path.startsWith('/dashboard/admin');

  if (isAdminDashboardRoute && role !== 'admin') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard') && !isAdminDashboardRoute && targetDashboard !== '/dashboard' && path !== targetDashboard) {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path === '/peta' && role !== 'merchant') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path === '/tier' && role !== 'merchant') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path === '/kurir' && role !== 'kurir' && role !== 'courier') {
    url.pathname = targetDashboard;
    return NextResponse.redirect(url);
  }

  if (path === '/kurir' && (role === 'kurir' || role === 'courier')) {
    url.pathname = '/dashboard/kurir';
    return NextResponse.redirect(url);
  }

  return response;
}

// Config matcher yang diperbaiki
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/pending',
    '/onboarding',
    '/profil',
    '/map',
    '/map/:path*',
    '/peta',
    '/tier',
    '/kurir',
    '/dashboard/kurir',
    '/dashboard/konsumen_umum',
  ],
};