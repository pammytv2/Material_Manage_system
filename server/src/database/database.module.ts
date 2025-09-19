//  ----- 📖 Library 📖 -----
import { Module } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
class DatabaseModule {}

export { DatabaseModule };
