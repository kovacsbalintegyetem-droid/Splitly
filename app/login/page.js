// app/login/page.js
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// === HELYES VISSZAIRÁNYÍTÁSI URL LÉTREHOZÁSA ===
// Változatlanul hagyjuk a localhostot fejlesztéshez, de éles környezetben
// a VERCEL_URL-t fogja használni, ha ott deployolod az appot.
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Először ezt nézi
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Aztán ezt
    'http://localhost:3000/'; // Végül ezt
  // Legyen http:// vagy https:// az elején
  url = url.includes('http') ? url : `https://${url}`;
  // Biztosan / legyen a végén
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};
// ===============================================

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/');
        router.refresh();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  // A JAVÍTÁS ITT TÖRTÉNIK
  const redirectUrl = getURL() + 'auth/callback';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Jelentkezz be a fiókodba
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          // ITT VAN A KULCSFONTOSSÁGÚ VÁLTOZTATÁS!
          // A teljes URL-t adjuk át a redirectTo-nak.
          redirectTo={redirectUrl}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email cím',
                password_label: 'Jelszó',
                button_label: 'Bejelentkezés',
                social_provider_text: 'Belépés ezzel: {{provider}}',
                link_text: 'Már van fiókod? Jelentkezz be',
              },
              sign_up: {
                email_label: 'Email cím',
                password_label: 'Jelszó',
                button_label: 'Regisztráció',
                social_provider_text: 'Regisztráció ezzel: {{provider}}',
                link_text: 'Nincs még fiókod? Regisztrálj',
              },
            },
          }}
        />
      </div>
    </div>
  );
}