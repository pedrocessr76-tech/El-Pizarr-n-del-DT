import { Module } from '@nestjs/common';
import { RepositoryPortModule } from '../persistence/repository-port.module';
import { UserEntity } from './user.entity';

@Module({
  imports: [RepositoryPortModule.forFeature([UserEntity])],
  exports: [],
})
export class UserModule {}
