import { useEffect, useState } from "react";
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import UsersList from './components/UsersList';

function App() {
  const [countries, setCountries] = useState([]);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      setError('Błąd podczas pobierania roli użytkownika');
      return;
    }

    setUserRole(data.role);
  };

  useEffect(() => {
    if (session && userRole === 'admin') {
      getCountries();
    }
  }, [session, userRole]);

  async function getCountries() {
    try {
      const { data, error } = await supabase.from("countries").select();
      if (error) throw error;
      setCountries(data);
      setError(null);
    } catch {
      setError("Nie masz uprawnień do wyświetlenia tych danych");
      setCountries([]);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Nagłówek */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-800">
                Panel administracyjny
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {session.user.email} ({userRole})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Główna zawartość */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {userRole !== 'admin' ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
            Tylko administratorzy mają dostęp do tych danych.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lista użytkowników */}
            <UsersList />

            {/* Lista krajów */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista krajów</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {countries.map((country) => (
                  <div
                    key={country.name}
                    className="bg-gray-50 p-4 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {country.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;