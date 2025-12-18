import React, { useState } from 'react';
import { usersAPI, chatsAPI } from '../services/api';

const InviteUser = ({ onClose, onInviteSent }) => {
    const [username, setUsername] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async () => {
        if (username.length < 2) {
            setError('Enter at least 2 characters to search');
            return;
        }

        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            const res = await usersAPI.search(username);
            setSearchResults(res.data.users);
        } catch (err) {
            setError(err.response?.data?.error || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (inviteUsername) => {
        try {
            await chatsAPI.sendInvite(inviteUsername);
            setSuccess(`Invitation sent to ${inviteUsername}!`);
            setSearchResults([]);
            setUsername('');
            onInviteSent();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send invitation');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Invite User to Chat</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <span className="sr-only">Close</span>
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                <div className="mb-4">
                    <div className="flex">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by username..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                        <ul>
                            {searchResults.map((user) => (
                                <li key={user.id} className="border-b last:border-b-0">
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                                        <span className="font-medium">{user.username}</span>
                                        <button
                                            onClick={() => handleInvite(user.username)}
                                            className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                                        >
                                            Invite
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {searchResults.length === 0 && username.length >= 2 && !loading && (
                    <div className="text-center py-4 text-gray-500">
                        No users found
                    </div>
                )}

                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteUser;
