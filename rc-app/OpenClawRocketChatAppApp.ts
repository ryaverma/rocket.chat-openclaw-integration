import { App } from '@rocket.chat/apps-engine/definition/App';
import {
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger
} from '@rocket.chat/apps-engine/definition/accessors';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { OpenClawCommand } from './OpenClawCommand';

export class OpenClawRocketChatAppApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: any) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
        _environmentRead: IEnvironmentRead
    ): Promise<void> {
        await configuration.settings.provideSetting({
            id: 'openclaw_backend_url',
            type: SettingType.STRING,
            packageValue: 'http://host.docker.internal:3100',
            required: true,
            public: false,
            i18nLabel: 'OpenClaw Backend URL',
            i18nDescription: 'URL of the OpenClaw backend service',
        });

        await configuration.settings.provideSetting({
            id: 'openclaw_bot_username',
            type: SettingType.STRING,
            packageValue: 'openclaw-bot',
            required: true,
            public: false,
            i18nLabel: 'OpenClaw Bot Username',
            i18nDescription: 'Rocket.Chat username of the OpenClaw bot account',
        });

        configuration.slashCommands.provideSlashCommand(
            new OpenClawCommand()
        );
    }
}