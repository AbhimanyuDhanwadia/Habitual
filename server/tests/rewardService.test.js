import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = {
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
};

const mockTransaction = {
  create: vi.fn(),
};

vi.mock('../src/models/User.js', () => ({
  default: mockUser,
}));

vi.mock('../src/models/Transaction.js', () => ({
  default: mockTransaction,
}));

const { awardTaskCompletion, awardDailyCompletion } = await import('../src/services/rewardService.js');

describe('rewardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('awards task completion coins only when the reward transaction is new', async () => {
    mockTransaction.create.mockResolvedValueOnce({ _id: 'tx1' });
    mockUser.findByIdAndUpdate.mockResolvedValueOnce({ coins: 12 });

    const result = await awardTaskCompletion('user-1', 'task-1');

    expect(mockTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      rewardKey: 'user-1:task:task-1',
      source: 'task-complete',
    }));
    expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { $inc: { coins: 2 } }, { new: true });
    expect(result).toEqual({ coins: 12, earned: 2 });
  });

  it('does not award task completion coins twice for the same task', async () => {
    mockTransaction.create.mockRejectedValueOnce({ code: 11000 });
    mockUser.findById.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({ coins: 12 }),
    });

    const result = await awardTaskCompletion('user-1', 'task-1');

    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({ coins: 12, earned: 0, alreadyAwarded: true });
  });

  it('does not award daily completion twice for the same date', async () => {
    mockTransaction.create.mockRejectedValueOnce({ code: 11000 });
    mockUser.findById.mockReturnValueOnce({
      select: vi.fn().mockResolvedValueOnce({ coins: 20 }),
    });

    const result = await awardDailyCompletion('user-1', '2026-07-13');

    expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({ coins: 20, earned: 0, alreadyAwarded: true });
  });
});
