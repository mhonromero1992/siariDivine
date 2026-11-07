/**
 * Mass and confession times. Leave empty until the shrine confirms them: the site never prints
 * a time that might send a pilgrim to a Mass that is not happening. When filled, the Masses
 * page shows a schedule table instead of the pointer to Facebook.
 *
 * Example:
 *   export const MASSES = [
 *     { days: 'Sunday', times: ['6:00 am', '8:00 am'] },
 *     { days: 'Monday to Saturday', times: ['6:00 am'] },
 *   ];
 *   export const CONFESSIONS = 'Saturday, 3:00 pm to 5:00 pm';
 *   export const SCHEDULE_CHECKED = '2026-11-07';
 */
export const MASSES = [];
export const CONFESSIONS = '';
export const SCHEDULE_CHECKED = '';
