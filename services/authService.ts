
import { User } from "../types";

// Mock database key in localStorage
const DB_KEY = 'matchoracle_users';
const SESSION_KEY = 'matchoracle_session';

export const authService = {
  // Register a new user
  signup: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error("User already exists with this email.");
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In a real app, never store plain text passwords!
    };

    users.push(newUser);
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    
    // Auto login
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  // Login existing user
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

    return sessionUser;
  },

  // Check if user is already logged in
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
