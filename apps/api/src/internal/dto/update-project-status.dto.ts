import { IsEnum, IsNotEmpty } from 'class-validator';
import { DomainDnsStatus } from 'generated/prisma/enums';

export class UpdateProjectStatusDto {
  @IsEnum(DomainDnsStatus)
  @IsNotEmpty()
  onlineStatus: DomainDnsStatus;
}
