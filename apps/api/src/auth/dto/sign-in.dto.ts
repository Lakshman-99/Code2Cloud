import { IsEmail, IsString } from "class-validator";

export class SignInDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @IsString({ message: "Password is required" })
  password: string;
}
