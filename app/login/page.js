// app/login/page.js
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Sikeres bejelentkezés után átirányítjuk a főoldalra
        router.push('/');
        router.refresh(); // Frissítjük az oldalt, hogy a middleware lefusson
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

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
          providers={['google']} // Itt adjuk meg a Google-t
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
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