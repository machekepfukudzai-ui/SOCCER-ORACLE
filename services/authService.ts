
import { User } from "../types";

// Mock database key in localStorage
const DB_KEY = 'matchoracle_users';
const SESSION_KEY = 'matchoracle_session';

// Helper to safely parse JSON from localStorage
const safeJsonParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error parsing localStorage key "${key}", resetting to fallback.`, e);
    // If data is corrupted, remove it to prevent persistent crashes
    localStorage.removeItem(key);
    return fallback;
  }
};

export const authService = {
  // Register a new user
  signup: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Validate input
    if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("All fields are required.");
    }

    let users = safeJsonParse(DB_KEY, []);
    
    // Safety check: Ensure users is actually an array
    if (!Array.isArray(users)) {
        users = [];
    }
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error("User already exists with this email.");
    }

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      password: password.trim(), // In a real app, never store plain text passwords!
    };

    users.push(newUser);
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    } catch (e) {
        throw new Error("Failed to save user data. Storage might be full.");
    }
    
    // Auto login
    const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  // Login existing user
  login: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    let users = safeJsonParse(DB_KEY, []);
    
    // Safety check
    if (!Array.isArray(users)) {
        users = [];
    }

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
    const user = safeJsonParse(SESSION_KEY, null);
    // Basic structure validation
    if (user && user.id && user.name && user.email) {
        return user;
    }
    // Invalid session data
    if (user) localStorage.removeItem(SESSION_KEY);
    return null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
