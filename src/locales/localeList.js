export default [
    {
        name: 'English (UK)',
        locale: 'en',
        localeName: 'en',
        iso: 'en',
        timeFormat: (yr, mo, da) => `${da}/${mo}/${yr}`,
        timeFormatTime: (yr, mo, da, hr, mi) => `${da}/${mo}/${yr} ${hr}:${mi}`,
        timeFormatTimeSecond: (yr, mo, da, hr, mi, sc) => `${da}/${mo}/${yr} ${hr}:${mi}:${sc}`,
        timeFormatWeek: (mo, da, wd) => `${da} ${mo}, ${wd}`,
    },
    {
        name: '中文（简体）',
        locale: 'zh',
        localeName: 'zhHans',
        iso: 'zh-CN',
        timeFormat: (yr, mo, da) => `${yr}${mo}${da}`,
        timeFormatTime: (yr, mo, da, hr, mi) => `${yr}${mo}${da} ${hr}:${mi}`,
        timeFormatTimeSecond: (yr, mo, da, hr, mi, sc) => `${yr}${mo}${da} ${hr}:${mi}:${sc}`,
        timeFormatWeek: (mo, da, wd) => `${mo}${da}，${wd}`,
    },
];