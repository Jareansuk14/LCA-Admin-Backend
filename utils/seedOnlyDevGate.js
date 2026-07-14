const OnlyDevGate = require('../models/OnlyDevGate');

const SEED_PASSWORD = '@Thefinal140243';

const seedOnlyDevGate = async () => {
  try {
    const existing = await OnlyDevGate.findOne();
    if (!existing) {
      await OnlyDevGate.create({ password: SEED_PASSWORD });
      console.log('OnlyDev gate password seeded');
    }
  } catch (error) {
    console.error('Error seeding OnlyDev gate:', error);
  }
};

module.exports = seedOnlyDevGate;
