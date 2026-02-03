import { IsEnum, IsNotEmpty } from 'class-validator';
import { DomainDnsStatus } from 'generated/prisma/enums';

export class UpdateDomainStatusDto {
  @IsEnum(DomainDnsStatus)
  @IsNotEmpty()
  status: DomainDnsStatus;
}
