import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule }   from "../prisma/prisma.module";
import { AuthModule }     from "../modules/auth/auth.module";
import { UserModule }     from "../modules/user/user.module";
import { WalletModule }   from "../modules/wallet/wallet.module";
import { ExchangeModule } from "../modules/exchange/exchange.module";
import { BinaryModule }   from "../modules/binary/binary.module";
import { FuturesModule }  from "../modules/futures/futures.module";
import { FinanceModule }  from "../modules/finance/finance.module";
import { KycModule }      from "../modules/kyc/kyc.module";
import { StakingModule }  from "../modules/staking/staking.module";
import { P2pModule }      from "../modules/p2p/p2p.module";
import { AffiliateModule }from "../modules/affiliate/affiliate.module";
import { EcosystemModule }from "../modules/ecosystem/ecosystem.module";
import { DexModule }      from "../modules/dex/dex.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { AdminModule }    from "../modules/admin/admin.module";
import { BlogModule }     from "../modules/blog/blog.module";
import { LearnModule }    from "../modules/learn/learn.module";
import { ReferralModule } from "../modules/referral/referral.module";
import { WebhooksModule } from "../modules/webhooks/webhooks.module";
import { ComplianceModule}from "../modules/compliance/compliance.module";
import { WebsocketModule }from "../websocket/websocket.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule, UserModule, WalletModule,
    ExchangeModule, BinaryModule, FuturesModule,
    FinanceModule, KycModule, StakingModule,
    P2pModule, AffiliateModule, EcosystemModule, DexModule,
    NotificationsModule, AdminModule, BlogModule,
    LearnModule, ReferralModule, WebhooksModule, ComplianceModule,
    WebsocketModule,
  ],
})
export class AppModule {}
