export { cn } from "./cn";

export {
  capitalize,
  capitalizeWords,
  slugify,
  truncate,
  normalizeSpaces,
  trimToNull,
  escapeHtml,
  unescapeHtml,
  stripHtml,
  isBlank,
  isNotBlank,
  levenshtein,
} from "./string";

export {
  clamp,
  roundTo,
  floorTo,
  ceilTo,
  inRange,
  fuzzyEquals,
  formatNumber,
  formatCurrency,
  formatPercent,
} from "./number";

export { formatDate, formatTime, formatDateTime, formatRelative } from "./date/format";
export { parseDate, parseDateSafe } from "./date/parse";
export { addDays, addMonths, startOfDay, endOfDay, isDateBetween, isDateValid, toISOString } from "./date/arithmetic";

export {
  pick,
  omit,
  renameKey,
  mapKeys,
  mapValues,
  deepMerge,
  isPlainObject,
  isEmptyObject,
  hasKey,
  getNested,
  setNested,
  toRecord,
  toMap,
  uniqBy,
  partition,
  chunk,
  intersection,
  difference,
  toggleItem,
  moveItem,
  updateItem,
  groupBy,
} from "./collection";

export {
  buildUrl,
  getQueryParam,
  getQueryParams,
  setQueryParam,
  removeQueryParam,
  isExternalUrl,
} from "./url";

export { isEmail, isUrl, isUuid, isPhone, isAlphanumeric, isNumeric, isHexColor, isInLength, matches } from "./validation";

export {
  stringComparator,
  numberComparator,
  dateComparator,
  booleanComparator,
  nullSafeComparator,
} from "./compare";

export { shallowEqual, deepEqual } from "./equal";

export { sleep, timeout, withRetry, concurrentPool, safePromise, isPromise, defer } from "./async";

export { getErrorMessage, getErrorCode, safeExecute, isAppError, isNetworkError, createAppError } from "./error";

export { logger, setLogLevel } from "./logger";

export { memoize, debounce, throttle, once, noop } from "./performance";

export {
  createMockUser,
  createMockAlumni,
  createMockEvent,
  createMockJob,
  range as testRange,
  repeat,
} from "./testing";

export { createId, idEquals, idToString, isValidId } from "./id";

export { sortBy, sortByDesc, sortByMultiple, sortByDate, sortByString, sortByNumber } from "./sort";
export { paginate, getPageMeta, getPageRange } from "./pagination";
export { filterBySearch, composeFilters } from "./filter";
export { normalizeEmail, normalizePhone, normalizeUrl, normalizeWhitespace } from "./normalize";
export { bytesToSize, msToSeconds, secondsToMs, minutesToMs, hoursToMs, daysToMs } from "./conversion";
export { generateSlug, generateColor, generateInitials } from "./generate";
export { randomInt, pickRandom, shuffle } from "./random";
export { isBrowser, isOnline, isReducedMotion, getViewport, scrollToTop, copyToClipboard, getCookie } from "./browser";
export { mapTo, mapNullable } from "./mapping";
export { formatList, getBrowserLocale } from "./i18n";
export { sanitizeHtml, sanitizeUrl, base64Encode, base64Decode } from "./security";
export { serialize, deserialize, safeDeserialize } from "./serialization";