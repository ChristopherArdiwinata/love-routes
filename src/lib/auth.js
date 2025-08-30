import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'salt', 1000, 64, 'sha512').toString('hex');
}

export function registerUser(email, password) {
  const users = readUsers();
  
  if (users.find(user => user.email === email)) {
    throw new Error('User already exists');
  }
  
  const newUser = {
    id: crypto.randomUUID(),
    email,
    password: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeUsers(users);
  
  return { id: newUser.id, email: newUser.email };
}

export function signInUser(email, password) {
  const users = readUsers();
  const user = users.find(user => user.email === email);
  
  if (!user || user.password !== hashPassword(password)) {
    throw new Error('Invalid credentials');
  }
  
  return { id: user.id, email: user.email };
}