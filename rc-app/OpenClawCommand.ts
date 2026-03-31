import {
    IHttp,
    IModify,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';

import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';

export class OpenClawCommand implements ISlashCommand {
    public command = 'openclaw';
    public i18nDescription = 'Ask the OpenClaw agent';
    public i18nParamsExample = 'where is los angeles';
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
    ): Promise<void> {
        const args = context.getArguments();
        const prompt = args.join(' ').trim();
        const room = context.getRoom();
        const sender = context.getSender();

        const backendUrlSetting = await read.getEnvironmentReader().getSettings().getById('openclaw_backend_url');
        const botUsernameSetting = await read.getEnvironmentReader().getSettings().getById('openclaw_bot_username');

        const backendUrl = backendUrlSetting?.value || 'http://host.docker.internal:3100';
        const botUsername = botUsernameSetting?.value || 'openclaw-bot';

        const botUser = await read.getUserReader().getByUsername(botUsername);

        const postMessage = async (text: string) => {
            const builder = modify.getCreator().startMessage().setRoom(room);
            if (botUser) {
                builder.setSender(botUser);
            } else {
                builder.setSender(sender);
            }
            builder.setText(text);
            await modify.getCreator().finish(builder);
        };

        if (!prompt) {
            await postMessage(
                '**OpenClaw Bot**\n\n' +
                'Usage: `/openclaw <question>`\n\n' +
                'Examples:\n' +
                '• `/openclaw where is Paris?`\n' +
                '• `/openclaw remind me in 30 seconds meeting`\n' +
                '• `/openclaw clear` — reset conversation memory'
            );
            return;
        }

        try {
            const response = await http.post(`${backendUrl}/execute`, {
                headers: { 'Content-Type': 'application/json' },
                data: {
                    roomId: room.id,
                    user: sender.username,
                    text: prompt,
                },
            });

            const data: any = response.data;

            if (data?.type === 'reminder' || data?.type === 'clear' || data?.type === 'auth') {
                await postMessage(data.text);
            }

        } catch (err: any) {
            await postMessage('Could not reach OpenClaw backend. Make sure it is running.');
        }
    }
}