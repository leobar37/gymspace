// Example API functions for TanStack Query
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const userApi = {
  fetchUser: async (userId: string): Promise<User> => {
    await delay(1000); // Simulate network request
    
    // Mock data
    return {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://i.pravatar.cc/150?img=1",
    };
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    await delay(800);
    
    return {
      id: userId,
      name: data.name || "John Doe",
      email: data.email || "john@example.com",
      avatar: data.avatar,
    };
  },

  fetchUsers: async (): Promise<User[]> => {
    await delay(1200);
    
    return [
      { id: "1", name: "John Doe", email: "john@example.com" },
      { id: "2", name: "Jane Smith", email: "jane@example.com" },
      { id: "3", name: "Bob Johnson", email: "bob@example.com" },
    ];
  },
};