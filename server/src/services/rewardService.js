import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// Streak milestone thresholds and their rewards
const STREAK_MILESTONES = {
  3: { coins: 15, label: '3-Day Streak!' },
  7: { coins: 50, label: 'Week Warrior!' },
  14: { coins: 100, label: 'Two-Week Titan!' },
  30: { coins: 250, label: 'Monthly Master!' },
  60: { coins: 500, label: 'Two-Month Legend!' },
  100: { coins: 1000, label: 'Century Champion!' },
  365: { coins: 5000, label: 'Year-Long Dynamo!' },
};

// Coins per task completion
const TASK_COMPLETE_COINS = 2;

// Bonus for completing ALL daily tasks
const ALL_TASKS_BONUS = 10;

// Signup bonus
const SIGNUP_BONUS = 50;

/**
 * Update user streak based on activity.
 * Call this when a user completes a task or logs in.
 */
export const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (user.lastActiveDate) {
    const lastActive = new Date(user.lastActiveDate);
    const lastActiveDay = new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()));
    const diffMs = today.getTime() - lastActiveDay.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day — no streak change
      return { streakChanged: false, currentStreak: user.currentStreak };
    } else if (diffDays === 1) {
      // Consecutive day — increment streak
      user.currentStreak += 1;
    } else {
      // Gap > 1 day — reset streak
      user.currentStreak = 1;
    }
  } else {
    // First activity ever
    user.currentStreak = 1;
  }

  // Update longest streak if needed
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastActiveDate = now;

  // Check for streak milestones
  let milestoneReward = null;
  if (STREAK_MILESTONES[user.currentStreak]) {
    const milestone = STREAK_MILESTONES[user.currentStreak];
    user.coins += milestone.coins;

    await Transaction.create({
      userId: user._id,
      amount: milestone.coins,
      type: 'earned',
      source: 'milestone',
      description: `🏆 ${milestone.label} (+${milestone.coins} coins)`,
    });

    milestoneReward = milestone;
  }

  await user.save();

  return {
    streakChanged: true,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    milestoneReward,
  };
};

/**
 * Award coins for completing a task
 */
export const awardTaskCompletion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.coins += TASK_COMPLETE_COINS;

  await Transaction.create({
    userId: user._id,
    amount: TASK_COMPLETE_COINS,
    type: 'earned',
    source: 'task-complete',
    description: `Task completed (+${TASK_COMPLETE_COINS} coins)`,
  });

  await user.save();
  return { coins: user.coins, earned: TASK_COMPLETE_COINS };
};

/**
 * Award bonus for completing ALL daily tasks
 */
export const awardDailyCompletion = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.coins += ALL_TASKS_BONUS;

  await Transaction.create({
    userId: user._id,
    amount: ALL_TASKS_BONUS,
    type: 'earned',
    source: 'daily-completion',
    description: `All daily tasks completed! (+${ALL_TASKS_BONUS} coins)`,
  });

  await user.save();
  return { coins: user.coins, earned: ALL_TASKS_BONUS };
};

/**
 * Award signup bonus
 */
export const awardSignupBonus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.coins += SIGNUP_BONUS;

  await Transaction.create({
    userId: user._id,
    amount: SIGNUP_BONUS,
    type: 'earned',
    source: 'signup-bonus',
    description: `Welcome to Habitual! (+${SIGNUP_BONUS} coins)`,
  });

  await user.save();
  return { coins: user.coins, earned: SIGNUP_BONUS };
};

/**
 * Purchase an item from the shop
 */
export const purchaseItem = async (userId, itemId, price) => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };

  if (user.coins < price) {
    return { success: false, message: 'Insufficient coins' };
  }

  if (user.ownedItems.includes(itemId)) {
    return { success: false, message: 'Item already owned' };
  }

  user.coins -= price;
  user.ownedItems.push(itemId);

  await Transaction.create({
    userId: user._id,
    amount: price,
    type: 'spent',
    source: 'purchase',
    description: `Shop purchase (-${price} coins)`,
    itemId,
  });

  await user.save();
  return { success: true, coins: user.coins };
};
