import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  user_id: string;
  name: string;
  friend_code: string | null;
}

export interface FriendWithProfile extends Friendship {
  friend_profile?: FriendProfile;
  requester_profile?: FriendProfile;
}

export function useFriendships() {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch all friendships where user is involved
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friendships:', error);
      setLoading(false);
      return;
    }

    // Get all friend user IDs
    const friendUserIds = (friendships || []).map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    // Fetch friend profiles
    let profiles: FriendProfile[] = [];
    if (friendUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, name, friend_code')
        .in('user_id', friendUserIds);
      profiles = (profilesData || []) as FriendProfile[];
    }

    // Map friendships with profiles
    const friendshipsWithProfiles = (friendships || []).map(f => {
      const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
      const friendProfile = profiles.find(p => p.user_id === friendUserId);
      const requesterProfile = profiles.find(p => p.user_id === f.user_id);
      
      return {
        ...f,
        friend_profile: friendProfile,
        requester_profile: requesterProfile,
      } as FriendWithProfile;
    });

    // Separate accepted friends from pending requests
    const accepted = friendshipsWithProfiles.filter(f => f.status === 'accepted');
    const pending = friendshipsWithProfiles.filter(
      f => f.status === 'pending' && f.friend_id === user.id
    );

    setFriends(accepted);
    setPendingRequests(pending);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const sendFriendRequest = async (friendCode: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    // Find user by friend code
    const { data: friendProfile, error: findError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('friend_code', friendCode.toUpperCase())
      .maybeSingle();

    if (findError || !friendProfile) {
      return { error: new Error('Código de amigo não encontrado') };
    }

    if (friendProfile.user_id === user.id) {
      return { error: new Error('Você não pode adicionar a si mesmo') };
    }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.user_id}),and(user_id.eq.${friendProfile.user_id},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { error: new Error('Vocês já são amigos') };
      }
      return { error: new Error('Solicitação já enviada') };
    }

    // Create friendship request
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendProfile.user_id,
        status: 'pending',
      });

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  return {
    friends,
    pendingRequests,
    loading,
    myFriendCode: profile?.friend_code,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refetch: fetchFriendships,
  };
}
