import { format } from 'date-fns';

/**
 * Centralized date formatting utilities.
 * All dates across the app use DD/MM/YY format.
 */

/** Full date: 25/03/26 */
export const formatDate = (date: Date | string): string =>
  format(new Date(date), 'dd/MM/yy');

/** Date with time: 25/03/26 02:30:45 PM */
export const formatDateTime = (date: Date | string): string =>
  format(new Date(date), 'dd/MM/yy hh:mm:ss a');

/** Short date for compact spaces: 25/03 */
export const formatDateShort = (date: Date | string): string =>
  format(new Date(date), 'dd/MM');

/** Full date for display: 25/03/2026 */
export const formatDateFull = (date: Date | string): string =>
  format(new Date(date), 'dd/MM/yyyy');

/** For file names: 20260325 */
export const formatDateForFile = (date: Date | string): string =>
  format(new Date(date), 'yyyyMMdd');
