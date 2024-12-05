import { useState } from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            console.log('Próba logowania dla:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Szczegóły błędu:', error);
                console.error('Kod błędu:', error.status);
                console.error('Wiadomość błędu:', error.message);
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('Email nie został potwierdzony. Sprawdź swoją skrzynkę email.');
                }
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error(`Nieprawidłowy email lub hasło. Użyj: admin-test@gmail.com / admin1234`);
                }
                throw error;
            }

            console.log('Dane logowania:', data);

            if (data.user) {
                console.log('ID użytkownika:', data.user.id);
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Błąd pobierania profilu:', profileError);
                    throw new Error('Błąd podczas pobierania profilu użytkownika');
                }

                console.log('Profil użytkownika:', profileData);
            }
        } catch (error) {
            console.error('Złapany błąd:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setMessage(null);

            // Sprawdź czy to pierwszy użytkownik
            const { data: existingUsers, error: checkError } = await supabase
                .from('user_profiles')
                .select('id');

            if (checkError) {
                console.error('Błąd sprawdzania użytkowników:', checkError);
            }

            const isFirstUser = !existingUsers || existingUsers.length === 0;

            // Zarejestruj użytkownika
            const { error: signUpError, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'https://react-supabase.bgrela.dev'
                }
            });

            if (signUpError) throw signUpError;

            // Dodaj profil użytkownika
            if (data?.user) {
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([
                        {
                            id: data.user.id,
                            email: email,
                            role: isFirstUser ? 'admin' : 'user'
                        },
                    ]);
                if (profileError) {
                    console.error('Błąd tworzenia profilu:', profileError);
                    throw profileError;
                }
            }

            setMessage('Konto zostało utworzone. Sprawdź swoją skrzynkę email aby potwierdzić rejestrację.');
        } catch (error) {
            console.error('Błąd rejestracji:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                            Logowanie / Rejestracja
                        </h2>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                                {message}
                            </div>
                        )}
                    </div>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="password"
                                placeholder="Hasło"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {loading ? 'Logowanie...' : 'Zaloguj'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                        >
                            {loading ? 'Rejestracja...' : 'Zarejestruj'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Auth; 