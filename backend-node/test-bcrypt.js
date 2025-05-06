const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hash);
}

hashPassword('Haslo321!?');
