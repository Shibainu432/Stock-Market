
export const getDateFromDay = (day: number, startDateISO: string): Date => {
    const startDate = new Date(startDateISO);
    const resultDate = new Date(startDate);
    resultDate.setDate(startDate.getDate() + day);
    return resultDate;
};

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

export const formatDateTime = (date: Date, timeZone?: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };
    if (timeZone) {
        options.timeZone = timeZone;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatTime = (date: Date, timeZone: string): string => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: timeZone,
    }).format(date);
};
