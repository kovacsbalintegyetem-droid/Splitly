// app/page.js
"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import OnboardingSurvey from "./components/OnboardingSurvey";

// Egy egyszerű komponens, ami a betöltést jelzi
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
  </div>
);

// Ez lesz a fő alkalmazás felület, a kérdőív után
const Dashboard = () => {
    // Később itt lesz egy Kijelentkezés gomb és a többi funkció
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold">Üdv a Splitly-ben! 🎉</h1>
            <p className="mt-4">Sikeresen bejelentkeztél és kitöltötted a kérdőívet.</p>
            {/* Ide jön majd a költségkezelő felület */}
        </div>
    )
}

export default function Home() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      // 1. Felhasználó lekérdezése
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Profiladatok lekérdezése az adatbázisból
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('education_level') // Elég egy mezőt ellenőrizni
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Hiba a profil lekérdezésekor:", error);
        }

        // 3. Döntés: ha a profil mező üres, a kérdőívet mutatjuk
        if (profile && !profile.education_level) {
          setShowSurvey(true);
        } else {
          setShowSurvey(false);
        }
      }
      setLoading(false);
    };

    checkUserProfile();
  }, [supabase]);

  const handleSurveyComplete = () => {
    setShowSurvey(false); // A kérdőív befejezése után elrejtjük azt
  };

  // Amíg töltünk, mutassunk egy töltőképernyőt
  if (loading) {
    return <LoadingSpinner />;
  }

  // A betöltés után, a state alapján renderelünk
  return (
    <main>
      {showSurvey ? (
        <OnboardingSurvey onComplete={handleSurveyComplete} />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}