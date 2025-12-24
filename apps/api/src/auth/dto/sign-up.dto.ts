import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class SignUpDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;

  @IsOptional()
  @IsString({ message: "Name must be a string" })
  name?: string;
}
