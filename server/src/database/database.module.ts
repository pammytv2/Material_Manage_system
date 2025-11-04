//  ----- 📖 Library 📖 -----
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
class DatabaseModule {}

export { DatabaseModule };
