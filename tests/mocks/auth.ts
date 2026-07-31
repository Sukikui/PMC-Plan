export const auth = jest.fn(async () => ({
  user: {
    id: 'test-user',
    role: 'admin',
  },
}));

export const handlers = {};
export const signIn = async () => undefined;
export const signOut = async () => undefined;
