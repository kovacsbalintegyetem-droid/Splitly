// components/OnboardingSurvey.js
"use client";

import { useState } from 'react';
// Töröltük a régi importot, helyette ezt használjuk:
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Itt definiáljuk a kérdéseket és a válaszlehetőségeket
const surveyQuestions = [
  {
    key: 'education_level',
    question: 'Hol tanulsz jelenleg?',
    options: ['Egyetemen', 'Középiskolában', 'Máshol'],
    values: ['egyetem', 'középiskola', 'más']
  },
  {
    key: 'used_similar_app',
    question: 'Használtál már korábban pénzügyi nyomonkövető appot?',
    options: ['Igen, rendszeresen', 'Próbáltam már', 'Nem, ez az első'],
    values: [true, true, false]
  },
  {
    key: 'primary_goal',
    question: 'Mi a fő célod az alkalmazással?',
    options: ['Költések követése', 'Számlák elosztása', 'Pénzügyi tudatosság', 'Csak kíváncsi vagyok'],
    values: ['tracking', 'splitting', 'awareness', 'curious']
  },
  {
    key: 'expense_tracking_habit',
    question: 'Mennyire jellemző rád, hogy követed a kiadásaidat?',
    options: ['Mindent felírok', 'Néha követem', 'Inkább csak érzésre', 'Egyáltalán nem'],
    values: ['meticulous', 'sometimes', 'by_feel', 'not_at_all']
  }
];

export default function OnboardingSurvey({ onComplete }) {
  // A komponenensen belül hozzuk létre a klienst!
  const supabase = createClientComponentClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswerSelect = async (value, key) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fontos: Az adatbázis frissítésnek az 'update' helyett 'upsert'-nek kell lennie,
        // hogy új profil létrehozásakor is működjön.
        const finalAnswers = { ...newAnswers, id: user.id, updated_at: new Date() };
        const { error } = await supabase
          .from('profiles')
          .upsert(finalAnswers)
          .eq('id', user.id);

        if (error) {
          console.error('Hiba a profil frissítésekor:', error);
          alert('Hiba történt a mentés során.');
        } else {
          console.log('Sikeres mentés!', newAnswers);
          if (onComplete) onComplete();
        }
      }
      setIsLoading(false);
    }
  };

  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            {currentQuestion.question}
          </h2>
          <div className="flex flex-col space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.values[index], currentQuestion.key)}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}