import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './channels/email.service';
import { WhatsAppService } from './channels/whatsapp.service';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    WhatsAppService,
    NotificationListener,
  ],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
