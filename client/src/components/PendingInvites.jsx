import React, { useState, useEffect } from 'react';
import { chatsAPI } from '../services/api';

const PendingInvites = ({ user, onInviteAccept }) => {
    const [invites, setInvites] = useState(user.pendingInvites || []);
    const [loading, setLoading] = useState({});

    useEffect(() => {
        setInvites(user.pendingInvites || []);
    }, [user.pendingInvites]);

    const handleAccept = async (fromUserId) => {
        setLoading({ ...loading, [fromUserId]: 'accepting' });

        try {
            await chatsAPI.acceptInvite(fromUserId);
            setInvites(invites.filter(invite => invite.fromUserId !== fromUserId));
            onInviteAccept();
        } catch (error) {
            console.error('Failed to accept invite:', error);
        } finally {
            setLoading({ ...loading, [fromUserId]: null });
        }
    };

    const handleReject = async (fromUserId) => {
        setLoading({ ...loading, [fromUserId]: 'rejecting' });

        try {
            await chatsAPI.rejectInvite(fromUserId);
            setInvites(invites.filter(invite => invite.fromUserId !== fromUserId));
        } catch (error) {
            console.error('Failed to reject invite:', error);
        } finally {
            setLoading({ ...loading, [fromUserId]: null });
        }
    };

    if (invites.length === 0) return null;

    return (
        <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Pending Invites ({invites.length})
            </h3>
            <ul className="space-y-3">
                {invites.map((invite) => (
                    <li key={invite.fromUserId} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                        <div>
                            <div className="font-medium text-gray-900">
                                {invite.fromUsername}
                            </div>
                            <div className="text-sm text-gray-500">
                                Invited at {new Date(invite.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleAccept(invite.fromUserId)}
                                disabled={loading[invite.fromUserId]}
                                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading[invite.fromUserId] === 'accepting' ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleReject(invite.fromUserId)}
                                disabled={loading[invite.fromUserId]}
                                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading[invite.fromUserId] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PendingInvites;
