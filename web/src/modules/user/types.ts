export type User = {
  id: string;
  name: string;
  color: string;
};

export type UserSlice = {
  user: User | undefined;
  users: User[];
  initUsers: (users: User[]) => void;
  setUser: (user: User) => void;
  setColor: (color: string) => void;
  selectColor: (color: string) => Promise<any>;
};
