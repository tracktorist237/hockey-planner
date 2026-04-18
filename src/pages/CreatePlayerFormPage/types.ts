import { CreateUserData } from "src/api/users";

export type UserFormData = CreateUserData;

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  birthDate?: string;
}

export type ValidatedFieldName = keyof ValidationErrors;

export type FieldStatus = "default" | "success" | "error";
