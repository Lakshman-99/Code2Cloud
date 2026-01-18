import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AddDomainDto {
  @IsString()
  @IsNotEmpty()
  // Basic domain regex
  @Matches(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/, { message: 'Invalid domain format' })
  name: string;
}

