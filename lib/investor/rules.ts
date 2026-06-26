/** PrimeFx investor platform rules and constraints */
export const INVESTOR_RULES = {
  financial: {
    minimumDeposit: 10,
    maximumSingleDeposit: 500_000,
    minimumWithdrawal: 20,
    withdrawalProcessingDays: '1-5 business days',
    maximumActiveInvestments: 10,
    profitWithdrawalMinimum: 10,
    newAccountWithdrawalHoldHours: 72,
    kycRequiredForWithdrawal: true,
    kycRequiredForInvestmentAbove: 1000,
  },
  security: {
    twoFactorRequiredForWithdrawal: true,
    transactionPinRequiredForTransfers: true,
    emailConfirmationForLargeWithdrawals: true,
    largeWithdrawalThreshold: 5000,
    sessionTimeoutMinutes: 30,
    maxFailedLoginAttempts: 5,
  },
  compliance: {
    kycRequiredForFullAccess: true,
    amlScreeningOnLargeDeposits: true,
    amlThreshold: 3000,
    restrictedCountriesApply: true,
    oneAccountPerPerson: true,
    selfReferralProhibited: true,
  },
} as const
