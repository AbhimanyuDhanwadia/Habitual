import React, { useState, useEffect } from 'react';
import CalendarHeatmap from '../../components/CalendarHeatmap/CalendarHeatmap';
import { friendsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import './Friends.css';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  
  // Track history for each friend
  const [friendsHistory, setFriendsHistory] = useState({});
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      friends.forEach(friend => {
        fetchFriendHistory(friend._id, year, month);
      });
    }
  }, [friends, year, month]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await friendsAPI.getAll();
      setFriends(res.data.friends || []);
      setFriendRequests(res.data.friendRequests || []);
    } catch (error) {
      console.error(error);
      showNotification({ message: 'Error loading friends', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendHistory = async (friendId, y, m) => {
    try {
      const res = await friendsAPI.getHistory(friendId, m, y);
      setFriendsHistory(prev => ({
        ...prev,
        [friendId]: res.data.history
      }));
    } catch (error) {
      console.error(`Error loading history for friend ${friendId}`, error);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    
    try {
      const res = await friendsAPI.request(searchUsername);
      showNotification({ message: res.data.message || 'Friend request sent!', type: 'success' });
      setSearchUsername('');
    } catch (error) {
      showNotification({ message: error.response?.data?.message || 'Error sending request', type: 'error' });
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      await friendsAPI.accept(friendId);
      showNotification({ message: 'Friend added!', type: 'success' });
      fetchFriends();
    } catch (error) {
      showNotification({ message: 'Error accepting request', type: 'error' });
    }
  };

  const handleNudge = async (friendId, friendName) => {
    try {
      await friendsAPI.nudge(friendId);
      showNotification({ message: `Nudged ${friendName}!`, type: 'success' });
    } catch (error) {
      showNotification({ message: 'Error sending nudge', type: 'error' });
    }
  };

  return (
    <div className="friends-page page-container fade-in">
      <header className="friends-header animate-fade-in-up">
        <div>
          <h1>Friends</h1>
          <p className="friends-subtitle">Check on your homies and stay accountable together</p>
        </div>
      </header>

      <div className="friends-content">
        <section className="friends-sidebar">
          <div className="add-friend-card card">
            <h3>Add a Friend</h3>
            <form onSubmit={handleAddFriend} className="add-friend-form">
              <input
                type="text"
                placeholder="Username"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="input"
              />
              <button type="submit" className="btn btn-primary">Add</button>
            </form>
          </div>

          {friendRequests.length > 0 && (
            <div className="friend-requests-card card">
              <h3>Pending Requests</h3>
              <ul className="request-list">
                {friendRequests.map(req => (
                  <li key={req._id} className="request-item">
                    <div className="request-info">
                      <span className="request-name">{req.firstName} {req.lastName}</span>
                      <span className="request-username">@{req.username}</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAcceptRequest(req._id)}
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="friends-main">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading friends...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="empty-state">
              <p>You haven't added any friends yet.</p>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map(friend => (
                <div key={friend._id} className="friend-card card">
                  <div className="friend-header">
                    <div className="friend-profile">
                      <div className={`avatar avatar-md ${friend.avatar || 'default-1'}`}></div>
                      <div className="friend-details">
                        <h3>{friend.firstName} {friend.lastName}</h3>
                        <span className="friend-username">@{friend.username}</span>
                      </div>
                    </div>
                    <div className="friend-actions">
                      <div className="friend-stats">
                        <span className="streak-badge">🔥 {friend.currentStreak || 0}</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm nudge-btn"
                        onClick={() => handleNudge(friend._id, friend.firstName)}
                      >
                        🔔 Nudge
                      </button>
                    </div>
                  </div>
                  
                  <div className="friend-calendar">
                    <CalendarHeatmap 
                      year={year} 
                      month={month} 
                      historyData={friendsHistory[friend._id] || []} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
