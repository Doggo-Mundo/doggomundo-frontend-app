export type UserType = "CUSTOMER" | "STAFF" | "ADMIN";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  username: string;
  phone: string;
  photo: string | null;
  user_type: UserType;
  email_verified: boolean;
  is_active: boolean;
  date_joined: string;
}
