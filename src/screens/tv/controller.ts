import { Request, Response } from 'express';
import { backend, backendSettings } from 'mythtv-services-api';
import * as moment from 'moment-timezone';
import { TvConfig } from './routes';

function formatDuration(startTime, endTime) {
    const duration = endTime.diff(startTime, 'minutes');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    let result = '';

    if (hours > 0) {
        result += hours + ' hour';

        if (hours > 1) {
            result += 's'
        }
    }

    if (minutes > 0) {
        if (hours > 0) {
            result += ' ';
        }

        result += minutes + ' minute';

        if (minutes > 1) {
            result += 's';
        }
    }

    return result;
}

export default class TvController {

    private timezone: string;
    private hostname: string;

    public constructor(data: TvConfig) {
        this.timezone = data.timezone;
        this.hostname = data.hostname;
    }

    private parseDate(input: string) {
        return moment.utc(input).tz(this.timezone);
    }
    
    public async index(req: Request, res: Response): Promise<void> {
        backendSettings({
            hostname: this.hostname,
            port: 6544,
            protocol: 'http'
        });
        
        const programList = await backend.dvrService.GetUpcomingList({});
        const programsByDate = {};

        programList
            .Programs
            .forEach((program) => {
                const startTime = this.parseDate((program as any).StartTime);
                const endTime = this.parseDate((program as any).EndTime);
                const date = startTime.format('dddd, MMMM Do');
                
                if (!programsByDate[date]) {
                    programsByDate[date] = [];
                }

                const title = program.Title;
                const time = startTime.format('h:mm A');
                const duration = formatDuration(startTime, endTime);

                programsByDate[date].push(`${title} (${time}, ${duration})`);
            });

        const model = [];

        for (let date in programsByDate) {
            model.push({
                name: date,
                items: programsByDate[date]
            });
        }

        res.render(
            'tv.html',
            { lists: model }
        );
    }
}