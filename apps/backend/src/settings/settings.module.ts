import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { GoogleOAuthService } from './google-oauth.service';

@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService, GoogleOAuthService],
  exports: [SettingsService, GoogleOAuthService],
})
export class SettingsModule {}
