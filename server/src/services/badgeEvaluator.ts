import { User, IUser } from '../models/User';
import { Badge } from '../models/Badge';

export const evaluateBadges = async (userId: string): Promise<IUser | null> => {
  const user = await User.findById(userId);
  if (!user) return null;

  const allBadges = await Badge.find();
  let newBadgesEarned = false;

  for (const badge of allBadges) {
    if (user.badges.includes(badge.name)) continue;

    let earned = false;
    switch (badge.criteriaType) {
      case 'weekly_goal':
        earned = user.weeklyGoalCompletions >= badge.criteriaValue;
        break;
      case 'three_month_goal':
        earned = user.threeMonthGoalCompletions >= badge.criteriaValue;
        break;
      case 'streak':
        earned = user.streakCompletions >= badge.criteriaValue;
        break;
    }

    if (earned) {
      user.badges.push(badge.name);
      newBadgesEarned = true;
    }
  }

  if (newBadgesEarned) {
    await user.save();
  }

  return user;
};
