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

export function registerUser(email, password, name, age, gender) {
  const users = readUsers();
  
  if (users.find(user => user.email === email)) {
    throw new Error('User already exists');
  }
  
  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password: hashPassword(password),
    age: parseInt(age),
    gender,
    interests: [],
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeUsers(users);
  
  return { id: newUser.id, name: newUser.name, email: newUser.email, age: newUser.age, gender: newUser.gender, interests: newUser.interests };
}

export function signInUser(email, password) {
  const users = readUsers();
  const user = users.find(user => user.email === email);
  
  if (!user || user.password !== hashPassword(password)) {
    throw new Error('Invalid credentials');
  }
  
  return { id: user.id, name: user.name, email: user.email, age: user.age, gender: user.gender, interests: user.interests || [] };
}

export function updateUserInterests(email, interests) {
  const users = readUsers();
  const userIndex = users.findIndex(user => user.email === email);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].interests = interests;
  writeUsers(users);
  
  return { success: true, interests };
}

const ROUTES_FILE = path.join(process.cwd(), 'data', 'routes.json');

function readRoutes() {
  try {
    const data = fs.readFileSync(ROUTES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeRoutes(routes) {
  fs.writeFileSync(ROUTES_FILE, JSON.stringify(routes, null, 2));
}

export function saveUserRoute(routeData) {
  const routes = readRoutes();
  
  const newRoute = {
    id: crypto.randomUUID(),
    ...routeData,
    createdAt: new Date().toISOString()
  };
  
  routes.push(newRoute);
  writeRoutes(routes);
  
  return { success: true, routeId: newRoute.id };
}