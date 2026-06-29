export interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  avatarUrl: string
  tier: string
  kycStatus: 'Verified' | 'Pending' | 'Rejected'
  isVerified: boolean
  verificationStatus: 'pending' | 'approved' | 'declined' | 'expired'
  twoFactorEnabled: boolean
  memberSince: string
  emailVerified: boolean
}

export interface ProfileActivity {
  id: string
  action: string
  device: string
  time: string
  createdAt: string
}

export interface UpdateProfileInput {
  fullName: string
  phone: string
  dateOfBirth: string
  address: string
  avatarUrl?: string
}
