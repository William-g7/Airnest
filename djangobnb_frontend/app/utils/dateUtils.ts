import { getLocaleState } from '@/app/stores/localeStore';

/**
 * 将 UTC ISO 字符串转换为指定时区的日期对象, 用于在datepicker中显示每个房源的当地时间
 * 防止让客人预定到当地已经"过期"的时间
 */
export function convertUTCToTimezone(isoString: string, timezone: string): Date {
    // 创建一个日期对象，它会被解析为本地时区
    const date = new Date(isoString);

    // 格式化日期，将日期转换为指定时区的当前日期
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    // 从格式化后的部分重建日期对象
    const dateObj: Record<string, number> = {};
    parts.forEach(part => {
        if (part.type !== 'literal') {
            dateObj[part.type] = parseInt(part.value, 10);
        }
    });

    // 创建新的日期对象，只需要年月日即可
    return new Date(
        dateObj.year,
        dateObj.month - 1,
        dateObj.day
    );
}

/**
 * 添加当前时区到 YYYY-MM-DD 格式的日期
 * 交给Date Picker进行渲染
 */
export function addTimezoneToDate(dateString: string, timezone: string): Date {
    // 创建日期并设置为当地时间的中午
    const date = new Date(`${dateString}T12:00:00`);

    // 使用 Intl.DateTimeFormat 将日期转换为指定时区
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    const dateObj: Record<string, number> = {};
    parts.forEach(part => {
        if (part.type !== 'literal') {
            dateObj[part.type] = parseInt(part.value, 10);
        }
    });

    return new Date(
        dateObj.year,
        dateObj.month - 1,
        dateObj.day,
        dateObj.hour,
        dateObj.minute,
        dateObj.second
    );
}

/**
 * 将日期格式化为 YYYY-MM-DD 格式的字符串
 * 后端返回的日期格式为字符串数组，需要把date picker中的date对象转化为字符串进行比较
 */
export function formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    // 月份从0开始，需要+1
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 将日期格式化为用于显示的字符串，不考虑时区
 * 用于日期选择器等组件中
 * @param date 日期对象
 * @returns YYYY-MM-DD 格式的字符串
 */
export function formatToDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 计算两个日期之间的天数
 * @param checkIn 入住日期（日期对象或ISO字符串）
 * @param checkOut 退房日期（日期对象或ISO字符串）
 * @returns 天数
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
    const startDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
    const endDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 将日期本地化并格式化为显示用的字符串，考虑时区
 * 支持客户端和服务端同时使用
 */
export function formatLocalizedDate(
    date: Date | string,
    timezone: string,
    format: 'long' | 'short' | 'numeric' = 'long',
    locale?: string
): string {
    // 如果未提供特定locale，尝试从store获取
    const { intlLocale } = getLocaleState();
    const finalLocale = locale || intlLocale;

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 对于中文环境，使用特定的格式
    if (finalLocale.includes('zh')) {
        // 中文格式
        const formatOptions: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: format === 'numeric' ? 'numeric' : format === 'short' ? 'numeric' : 'numeric',
            day: 'numeric',
        };

        // 为中文添加自定义年月日
        const formatted = new Intl.DateTimeFormat(finalLocale, formatOptions).format(dateObj);
        const result = formatted
            .replace('/', '年')
            .replace('/', '月') + '日';
        return result;
    }

    // 其他语言使用默认格式
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
        long: {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        short: {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },
        numeric: {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }
    };

    return new Intl.DateTimeFormat(finalLocale, formatOptions[format]).format(dateObj);
} 