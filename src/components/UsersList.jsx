import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function UsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Pobierz użytkowników z auth.users poprzez funkcję RPC
            const { data: authUsers, error: authError } = await supabase
                .rpc('get_users_with_auth_details');

            if (authError) throw authError;

            // Pobierz profile użytkowników
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, email, role');

            if (profilesError) throw profilesError;

            // Połącz dane z obu tabel
            const combinedUsers = authUsers.map(user => ({
                id: user.user_id,
                email: user.user_email,
                email_confirmed_at: user.user_email_confirmed_at,
                profile: profiles.find(profile => profile.id === user.user_id) || {}
            }));

            setUsers(combinedUsers);
        } catch (error) {
            console.error('Błąd podczas pobierania użytkowników:', error);
            setError('Nie udało się pobrać listy użytkowników');
        } finally {
            setLoading(false);
        }
    };

    const confirmUser = async (userId) => {
        try {
            setLoading(true);
            // Aktualizuj status potwierdzenia emaila
            const { error } = await supabase
                .rpc('admin_confirm_user', { user_id: userId });

            if (error) throw error;

            // Odśwież listę użytkowników
            await fetchUsers();

        } catch (error) {
            console.error('Błąd podczas potwierdzania użytkownika:', error);
            setError('Nie udało się potwierdzić użytkownika');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
        </div>
    );

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista użytkowników</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rola
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Akcje
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.profile.role === 'admin'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {user.profile.role || 'user'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email_confirmed_at
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {user.email_confirmed_at ? 'Potwierdzony' : 'Niepotwierdzony'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {!user.email_confirmed_at && (
                                        <button
                                            onClick={() => confirmUser(user.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            disabled={loading}
                                        >
                                            Potwierdź
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UsersList; 