import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Habit from '../models/Habit.js';
import ShopItem from '../models/ShopItem.js';

dotenv.config();

const defaultHabits = [
  // Fitness
  {
    title: 'Morning Stretch Routine',
    category: 'fitness',
    description: 'A 10-minute stretching routine to start your day with increased flexibility and energy.',
    benefits: 'Stretching improves blood circulation, reduces muscle tension, and enhances flexibility. Morning stretches activate your parasympathetic nervous system, reducing stress hormones like cortisol. Research published in the Journal of Physical Therapy Science shows that regular stretching improves posture and reduces chronic pain.',
    howTo: 'Start with neck rolls (30 seconds each direction), then shoulder rolls, arm circles, standing toe touches, quad stretches, and finish with a full-body stretch reaching overhead. Hold each stretch for 15-30 seconds. Never bounce — use slow, controlled movements.',
    difficulty: 'easy',
    icon: '🧘',
  },
  {
    title: '10,000 Steps Daily',
    category: 'fitness',
    description: 'Walk at least 10,000 steps throughout the day to maintain cardiovascular health.',
    benefits: 'Walking 10,000 steps burns approximately 400-500 calories and significantly reduces the risk of heart disease, type 2 diabetes, and certain cancers. A study in JAMA Internal Medicine found that higher step counts are associated with lower mortality rates.',
    howTo: 'Break it into chunks: a 15-minute walk in the morning, taking stairs instead of elevators, a lunch walk, and an evening stroll. Use your phone pedometer to track progress. Park farther away and take phone calls while walking.',
    difficulty: 'medium',
    icon: '🚶',
  },
  {
    title: '20 Push-Ups',
    category: 'fitness',
    description: 'Complete 20 push-ups daily to build upper body strength and core stability.',
    benefits: 'Push-ups engage the chest, shoulders, triceps, and core simultaneously. A Harvard study found that men who could do 40+ push-ups had a 96% reduced risk of cardiovascular disease compared to those who could do fewer than 10.',
    howTo: 'Start with as many as you can with proper form. Keep your body in a straight line, lower until your chest nearly touches the floor, and push back up. If 20 is too many, start with knee push-ups or incline push-ups and progress gradually.',
    difficulty: 'medium',
    icon: '💪',
  },
  // Mindfulness
  {
    title: '5-Minute Meditation',
    category: 'mindfulness',
    description: 'A daily 5-minute guided or silent meditation practice for mental clarity.',
    benefits: 'Regular meditation reduces anxiety by 60% according to a meta-analysis in JAMA Internal Medicine. It physically changes the brain — increasing gray matter density in areas associated with memory, empathy, and stress regulation. Even 5 minutes daily shows measurable benefits after 8 weeks.',
    howTo: 'Find a quiet spot. Sit comfortably with your back straight. Close your eyes and focus on your breath — the sensation of air entering and leaving your nostrils. When your mind wanders (it will), gently bring attention back to your breath. Use apps like Headspace or Calm for guided sessions.',
    difficulty: 'easy',
    icon: '🧠',
  },
  {
    title: 'Gratitude Journaling',
    category: 'mindfulness',
    description: 'Write down 3 things you are grateful for each day before bed.',
    benefits: 'Gratitude journaling is one of the most scientifically validated happiness interventions. A UC Davis study found that participants who journaled about gratitude were 25% happier, exercised 33% more, and had fewer visits to physicians. It rewires your brain to notice positive patterns.',
    howTo: 'Keep a small notebook by your bed. Each night, write 3 specific things you\'re grateful for — be detailed. Instead of "family," write "My mom called to check on me today." Specificity is key. Aim to find new things each day.',
    difficulty: 'easy',
    icon: '📝',
  },
  {
    title: 'Digital Detox Hour',
    category: 'mindfulness',
    description: 'Spend one hour daily completely disconnected from all screens and digital devices.',
    benefits: 'Excessive screen time is linked to increased anxiety, depression, and poor sleep quality. A digital detox hour allows your brain to recover from constant stimulation, improves attention span, and enhances face-to-face social skills. Stanford research shows it significantly reduces the stress hormone cortisol.',
    howTo: 'Choose a consistent time (ideally 1 hour before bed). Put all devices in another room or in a drawer. Fill the time with reading physical books, taking a walk, cooking, stretching, or having a conversation. Use a physical alarm clock instead of your phone.',
    difficulty: 'hard',
    icon: '📵',
  },
  // Nutrition
  {
    title: 'Drink 8 Glasses of Water',
    category: 'nutrition',
    description: 'Stay hydrated by drinking at least 8 glasses (2 liters) of water throughout the day.',
    benefits: 'Proper hydration improves cognitive function by up to 30%, boosts metabolism, aids digestion, and keeps skin healthy. Even mild dehydration (1-2% body weight) significantly impairs concentration and increases fatigue. Water is essential for every cellular process in your body.',
    howTo: 'Start your day with a glass of water before coffee. Keep a reusable water bottle at your desk. Set hourly reminders if needed. Drink a glass before each meal. If plain water is boring, add lemon, cucumber, or mint. Track your intake until it becomes habitual.',
    difficulty: 'easy',
    icon: '💧',
  },
  {
    title: 'Eat 5 Servings of Fruits & Vegetables',
    category: 'nutrition',
    description: 'Incorporate at least 5 servings of fruits and vegetables into your daily diet.',
    benefits: 'A meta-analysis of 95 studies (2 million participants) in the International Journal of Epidemiology found that 5 daily servings of fruits and vegetables reduce the risk of heart disease by 28%, stroke by 33%, and premature death by 31%. They provide essential vitamins, minerals, fiber, and antioxidants.',
    howTo: 'Add fruit to breakfast (berries in oatmeal, banana with toast). Have a salad with lunch. Snack on carrots, apples, or nuts. Include two vegetables with dinner. One serving = 1 cup raw or ½ cup cooked. Frozen vegetables are just as nutritious as fresh.',
    difficulty: 'medium',
    icon: '🥗',
  },
  // Sleep
  {
    title: 'Consistent Sleep Schedule',
    category: 'sleep',
    description: 'Go to bed and wake up at the same time every day, including weekends.',
    benefits: 'A consistent sleep schedule regulates your circadian rhythm, improving sleep quality dramatically. Research from Harvard shows that irregular sleepers have a 27% higher risk of metabolic issues. Consistent sleepers fall asleep faster, sleep deeper, and wake up more refreshed.',
    howTo: 'Choose a bedtime that allows 7-9 hours of sleep. Set an alarm for the same wake time every day. Create a 30-minute wind-down routine before bed. Avoid the temptation to "sleep in" on weekends — consistency is more important than duration.',
    difficulty: 'hard',
    icon: '😴',
  },
  {
    title: 'No Screens 30 Minutes Before Bed',
    category: 'sleep',
    description: 'Avoid all screens (phone, TV, computer) for at least 30 minutes before sleeping.',
    benefits: 'Blue light from screens suppresses melatonin production by up to 50%, making it harder to fall asleep. A study in PNAS showed that reading on a screen before bed delays sleep onset by an average of 10 minutes, reduces REM sleep, and increases next-day sleepiness.',
    howTo: 'Set a phone alarm for 30 minutes before bedtime labeled "screens off." Replace screen time with reading a physical book, light stretching, journaling, or preparing clothes for tomorrow. If you must use devices, enable the strongest blue-light filter available.',
    difficulty: 'medium',
    icon: '🌙',
  },
  // Social
  {
    title: 'Reach Out to Someone',
    category: 'social',
    description: 'Send a meaningful message, make a call, or meet someone you care about daily.',
    benefits: 'Strong social connections reduce mortality risk by 50% — more protective than exercise or quitting smoking, according to a Brigham Young University meta-analysis. Social interaction releases oxytocin, reduces cortisol, and significantly decreases rates of depression and anxiety.',
    howTo: 'Each day, pick one person and reach out genuinely. Send a text asking how they are, share an article they\'d like, call a family member, or schedule a coffee. Quality matters more than quantity. Aim for depth, not just "hey."',
    difficulty: 'easy',
    icon: '💬',
  },
  // Learning
  {
    title: 'Read for 20 Minutes',
    category: 'learning',
    description: 'Dedicate at least 20 minutes daily to reading books or long-form articles.',
    benefits: 'Reading for just 20 minutes daily exposes you to approximately 1.8 million words per year. It improves vocabulary, empathy, critical thinking, and reduces cognitive decline by 32% in later life. A Yale study found that book readers live an average of 2 years longer than non-readers.',
    howTo: 'Choose books that genuinely interest you — fiction or non-fiction both work. Set a daily reading time (morning with coffee, lunch break, or before bed). Keep a book within reach. Start with 10 minutes if 20 feels hard. Use a bookmark to track progress and maintain momentum.',
    difficulty: 'easy',
    icon: '📚',
  },
  {
    title: 'Learn Something New',
    category: 'learning',
    description: 'Spend 15 minutes daily learning a new skill, language, or topic.',
    benefits: 'Continuous learning builds neuroplasticity — the brain\'s ability to form new neural connections. This protects against cognitive decline and boosts problem-solving skills. A study in Psychological Science found that learning new skills improves memory function even more than doing familiar cognitive activities.',
    howTo: 'Pick one skill to focus on for a month (a language on Duolingo, coding on freeCodeCamp, drawing tutorials, or a musical instrument). Dedicate the same 15 minutes daily. Use spaced repetition for retention. Track your progress weekly.',
    difficulty: 'medium',
    icon: '🎯',
  },
];

const defaultShopItems = [
  // Avatars
  { name: 'Cosmic Voyager', type: 'avatar', description: 'A space-themed avatar with starry vibes', price: 100, rarity: 'common', imageUrl: 'avatar-cosmic' },
  { name: 'Neon Samurai', type: 'avatar', description: 'Cyberpunk-inspired warrior avatar', price: 200, rarity: 'rare', imageUrl: 'avatar-samurai' },
  { name: 'Crystal Guardian', type: 'avatar', description: 'A mystical guardian encased in crystals', price: 350, rarity: 'rare', imageUrl: 'avatar-crystal' },
  { name: 'Phoenix Rising', type: 'avatar', description: 'A legendary phoenix avatar wreathed in flames', price: 500, rarity: 'epic', imageUrl: 'avatar-phoenix' },
  { name: 'Shadow Monarch', type: 'avatar', description: 'An enigmatic ruler of shadows', price: 750, rarity: 'epic', imageUrl: 'avatar-shadow' },
  { name: 'Celestial Dragon', type: 'avatar', description: 'The rarest avatar — a divine dragon of legend', price: 1500, rarity: 'legendary', imageUrl: 'avatar-dragon' },

  // Themes
  { name: 'Ocean Depths', type: 'theme', description: 'Deep blue and teal color scheme', price: 150, rarity: 'common', previewData: { primary: '#0ea5e9', secondary: '#06b6d4', bg: '#0c1929' } },
  { name: 'Forest Mist', type: 'theme', description: 'Calming green and emerald tones', price: 150, rarity: 'common', previewData: { primary: '#10b981', secondary: '#34d399', bg: '#0c1f17' } },
  { name: 'Sunset Blaze', type: 'theme', description: 'Warm orange and crimson gradients', price: 300, rarity: 'rare', previewData: { primary: '#f97316', secondary: '#ef4444', bg: '#1a0f0a' } },
  { name: 'Aurora Borealis', type: 'theme', description: 'Ethereal green-to-purple northern lights', price: 500, rarity: 'epic', previewData: { primary: '#22d3ee', secondary: '#a855f7', bg: '#0a1520' } },
  { name: 'Golden Dynasty', type: 'theme', description: 'Luxurious gold and dark amber accents', price: 1000, rarity: 'legendary', previewData: { primary: '#f59e0b', secondary: '#d97706', bg: '#1a1508' } },

  // Borders
  { name: 'Gradient Ring', type: 'border', description: 'A smooth gradient border around your avatar', price: 75, rarity: 'common' },
  { name: 'Pulsing Glow', type: 'border', description: 'Your avatar border pulses with soft light', price: 200, rarity: 'rare' },
  { name: 'Lightning Arc', type: 'border', description: 'Electric sparks dance around your profile', price: 400, rarity: 'epic' },
  { name: 'Cosmic Orbit', type: 'border', description: 'Tiny stars orbit your avatar in real-time', price: 800, rarity: 'legendary' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed Habits
    const existingHabits = await Habit.countDocuments();
    if (existingHabits === 0) {
      await Habit.insertMany(defaultHabits);
      console.log(`✅ Seeded ${defaultHabits.length} default habits`);
    } else {
      console.log(`ℹ️  ${existingHabits} habits already exist, skipping seed`);
    }

    // Seed Shop Items
    const existingItems = await ShopItem.countDocuments();
    if (existingItems === 0) {
      await ShopItem.insertMany(defaultShopItems);
      console.log(`✅ Seeded ${defaultShopItems.length} shop items`);
    } else {
      console.log(`ℹ️  ${existingItems} shop items already exist, skipping seed`);
    }

    console.log('\n🎉 Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
