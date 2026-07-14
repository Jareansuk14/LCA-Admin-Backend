const User = require('../models/User');

const seedUserIfMissing = async ({ user, password, role }) => {
  const existing = await User.findOne({ user });

  if (!existing) {
    await new User({ user, password, role }).save();
    console.log(`Default ${role} user created successfully`);
    console.log(`Username: ${user}`);
    console.log(`Password: ${password}`);
  } else {
    console.log(`Default user already exists: ${user}`);
  }
};

const seedDefaultAdmin = async () => {
  try {
    await seedUserIfMissing({
      user: 'Admin',
      password: '1234',
      role: 'Admin'
    });

    await seedUserIfMissing({
      user: 'TEST',
      password: 'TEST123',
      role: 'User'
    });
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
};

module.exports = seedDefaultAdmin;
