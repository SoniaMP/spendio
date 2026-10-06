/**
 * Contract between the API and the client. The server answers with one of
 * these codes instead of user-facing copy, and the client turns it into a
 * translated message. Shared so a typo cannot drift between the two sides.
 */
export const ErrorCode = {
  // Auth
  MissingRegistrationFields: 'MISSING_REGISTRATION_FIELDS',
  EmailAlreadyRegistered: 'EMAIL_ALREADY_REGISTERED',
  MissingCredentials: 'MISSING_CREDENTIALS',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  NotAuthenticated: 'NOT_AUTHENTICATED',
  UserNotFound: 'USER_NOT_FOUND',
  TooManyRequests: 'TOO_MANY_REQUESTS',
  MissingTokenOrPassword: 'MISSING_TOKEN_OR_PASSWORD',
  PasswordTooShort: 'PASSWORD_TOO_SHORT',
  InvalidResetLink: 'INVALID_RESET_LINK',
  ResetLinkAlreadyUsed: 'RESET_LINK_ALREADY_USED',
  ResetLinkExpired: 'RESET_LINK_EXPIRED',
  UnsupportedLanguage: 'UNSUPPORTED_LANGUAGE',

  // Generic
  NotAuthorized: 'NOT_AUTHORIZED',
  NameRequired: 'NAME_REQUIRED',
  ConstraintViolation: 'CONSTRAINT_VIOLATION',
  InternalError: 'INTERNAL_ERROR',

  // Categories
  CategoryNotFound: 'CATEGORY_NOT_FOUND',
  CategoryHasExpenses: 'CATEGORY_HAS_EXPENSES',

  // Expenses
  MissingExpenseFields: 'MISSING_EXPENSE_FIELDS',
  ExpenseNotFound: 'EXPENSE_NOT_FOUND',
  NoPermissionOnTargetSheet: 'NO_PERMISSION_ON_TARGET_SHEET',
  MissingDuplicateFields: 'MISSING_DUPLICATE_FIELDS',
  MissingRecurringFields: 'MISSING_RECURRING_FIELDS',

  // Recurring expenses
  RecurringNotFound: 'RECURRING_NOT_FOUND',
  IsActiveMustBeBoolean: 'IS_ACTIVE_MUST_BE_BOOLEAN',
  AmountMustBePositive: 'AMOUNT_MUST_BE_POSITIVE',
  InvalidPeriod: 'INVALID_PERIOD',
  StartDateInPast: 'START_DATE_IN_PAST',
  NoticeDaysNegative: 'NOTICE_DAYS_NEGATIVE',
  EndDateBeforeStart: 'END_DATE_BEFORE_START',

  // Sheets
  SheetNotFound: 'SHEET_NOT_FOUND',
  OrderedIdsRequired: 'ORDERED_IDS_REQUIRED',
  CannotDeleteLastSheet: 'CANNOT_DELETE_LAST_SHEET',

  // Sheet shares
  InvalidShareInput: 'INVALID_SHARE_INPUT',
  CannotShareWithSelf: 'CANNOT_SHARE_WITH_SELF',
  AlreadyShared: 'ALREADY_SHARED',
  InvalidPermission: 'INVALID_PERMISSION',
  ShareNotFound: 'SHARE_NOT_FOUND',

  // Summary
  MissingSummaryParams: 'MISSING_SUMMARY_PARAMS',
  FromAfterTo: 'FROM_AFTER_TO',

  // Monthly income (amount validation reuses AmountMustBePositive above)
  MissingMonth: 'MISSING_MONTH',
  InvalidMonthFormat: 'INVALID_MONTH_FORMAT',
  IncomeLabelRequired: 'INCOME_LABEL_REQUIRED',
  IncomeLineNotFound: 'INCOME_LINE_NOT_FOUND',
  IncomeRecurrenceRequired: 'INCOME_RECURRENCE_REQUIRED',
  IncomeLineNotInForce: 'INCOME_LINE_NOT_IN_FORCE',
  InvalidIncomeChangeScope: 'INVALID_INCOME_CHANGE_SCOPE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
