import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentUserId = '507f1f77bcf86cd799439011';
const friendId = '507f191e810c19729de860ea';

const mockUser = {
  findById: vi.fn(),
  findOne: vi.fn(),
};

const mockNotification = {
  create: vi.fn(),
};

vi.mock('../src/middleware/auth.js', () => ({
  auth: (req, res, next) => {
    req.user = { _id: currentUserId, username: 'current' };
    next();
  },
}));

vi.mock('../src/models/User.js', () => ({
  default: mockUser,
}));

vi.mock('../src/models/Notification.js', () => ({
  default: mockNotification,
}));

const { app } = await import('../src/index.js');

const makeUser = (overrides = {}) => ({
  _id: currentUserId,
  username: 'current',
  friends: [],
  friendRequests: [],
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('friends API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects accepting a friend when there is no pending request', async () => {
    const currentUser = makeUser();
    const friend = makeUser({ _id: friendId, username: 'friend' });

    mockUser.findById.mockImplementation(async id => (id === currentUserId ? currentUser : friend));

    const res = await request(app)
      .post('/api/friends/accept')
      .send({ friendId });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('No pending friend request from this user');
    expect(currentUser.save).not.toHaveBeenCalled();
    expect(friend.save).not.toHaveBeenCalled();
  });

  it('accepts a friend only when a pending request exists', async () => {
    const currentUser = makeUser({ friendRequests: [friendId] });
    const friend = makeUser({ _id: friendId, username: 'friend' });

    mockUser.findById.mockImplementation(async id => (id === currentUserId ? currentUser : friend));

    const res = await request(app)
      .post('/api/friends/accept')
      .send({ friendId });

    expect(res.statusCode).toBe(200);
    expect(currentUser.friends.map(id => id.toString())).toContain(friendId);
    expect(friend.friends.map(id => id.toString())).toContain(currentUserId);
    expect(mockNotification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: friendId,
      type: 'friend_accepted',
      fromUserId: currentUserId,
    }));
  });
});
