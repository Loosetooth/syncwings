export interface User {
  username: string;
  passwordHash: string;
  syncthingInstance: string;
  isAdmin?: boolean;
}