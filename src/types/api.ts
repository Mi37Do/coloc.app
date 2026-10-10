// Response shapes returned by coloc.api.

export type User = {
  id: string
  username: string
  firstname: string
  lastname: string
  email: string
  emailVerified: boolean
}

export type AuthResponse = {
  accessToken: string
  user: User
  joinedHouseholdId?: string
  /** register only: false when the confirmation email could not be sent */
  codeSent?: boolean
}

export type RegisterInput = {
  firstname: string
  lastname: string
  username: string
  email: string
  password: string
  countryId: number
  birthDate: string
  inviteToken?: string
}

export type Household = {
  id: string
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
}

/** GET /invites/:token and /invites/code/:code */
export type InvitePreview = {
  household: { id: string; name: string; city?: string | null }
  memberCount: number
  expiresAt: string | null
}

/** POST /households/:id/invite-links */
export type HouseholdInvite = {
  id: string
  token: string
  code: string | null
  displayCode: string | null
  url: string
  maxUses: number | null
  usesCount: number
  expiresAt: string | null
}

export type Membership = { householdId: string; userId: string }

export type ChoreStatus = 'todo' | 'done'
export type ChoreRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type Chore = {
  id: string
  householdId: string
  title: string
  description: string | null
  assigneeId: string | null
  assignee: Pick<User, 'id' | 'username' | 'firstname' | 'lastname'> | null
  dueAt: string | null
  recurrence: ChoreRecurrence
  rotateAssignee: boolean
  status: ChoreStatus
  completedAt: string | null
  completedById: string | null
  createdById: string | null
}

export type PublicUser = Pick<User, 'id' | 'username' | 'firstname' | 'lastname'>

/** GET /households/:id/members (active members, oldest first) */
export type Member = {
  id: string
  householdId: string
  userId: string
  role: 'admin' | 'member'
  joinedAt: string | null
  user: PublicUser
}

export type CreateChoreInput = {
  title: string
  assigneeId?: string
  dueAt?: string
  recurrence?: ChoreRecurrence
}

// ── Shopping ──────────────────────────────────────────────────

export type ShoppingItem = {
  id: string
  name: string
  quantity: number
  unit: string | null
  note: string | null
  checkedAt: string | null
  createdAt: string
  addedBy: PublicUser | null
  checkedBy: PublicUser | null
}

export type ShoppingList = {
  id: string
  householdId: string
  name: string
  archivedAt: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
  /** GET /shopping-lists only: items still to buy */
  remainingCount?: number
  /** GET /shopping-lists/:id only */
  items?: ShoppingItem[]
}

export type ShoppingItemInput = { name: string; quantity?: number; unit?: string; note?: string }

// ── Bills ─────────────────────────────────────────────────────

export type BillCategory = 'rent' | 'utilities' | 'internet' | 'groceries' | 'household' | 'other'

export type BillShare = {
  id: string
  billId: string
  userId: string
  amountCents: number
  settledAt: string | null
  user?: PublicUser
}

export type Bill = {
  id: string
  householdId: string
  title: string
  category: BillCategory
  amountCents: number
  currency: string
  paidById: string | null
  paidBy: PublicUser | null
  dueDate: string | null
  shares: BillShare[]
  createdById: string | null
  createdAt: string
}

export type CreateBillInput = {
  title: string
  category?: BillCategory
  amountCents: number
  currency?: string
  paidById?: string
  dueDate?: string
} & (
  | { split: 'equal'; participantIds?: string[] }
  | { split: 'custom'; shares: { userId: string; amountCents: number }[] }
)

/** GET /bills/balances: one entry per currency */
export type Balances = {
  currency: string
  /** Positive: the household owes them. Negative: they owe. */
  members: { userId: string; netCents: number }[]
  owes: { fromUserId: string; toUserId: string; amountCents: number }[]
}[]

// ── Chat ──────────────────────────────────────────────────────

export type Message = {
  id: string
  conversationId: string
  senderId: string | null
  sender?: PublicUser | null
  body: string
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
}

export type Conversation = {
  id: string
  type: 'group' | 'direct'
  lastMessageAt: string | null
  unreadCount: number
  lastMessage: Message | null
  /** Direct chats: the other person */
  with: PublicUser | null
}

// ── Notifications ─────────────────────────────────────────────

export type NotificationType =
  | 'household_invite'
  | 'member_joined'
  | 'chore_assigned'
  | 'chore_due'
  | 'bill_created'
  | 'bill_due'
  | 'event_created'
  | 'event_cancelled'
  | 'event_soon'
  | 'alert'
  | 'reminder'

export type AppNotification = {
  id: string
  userId: string
  householdId: string | null
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

// ── Events ────────────────────────────────────────────────────

export type RsvpResponse = 'going' | 'maybe' | 'declined'

export type EventParticipant = {
  id: string
  userId: string
  response: RsvpResponse
  respondedAt: string
  /** Detail endpoint only */
  user?: PublicUser
}

export type HouseholdEvent = {
  id: string
  householdId: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string | null
  cancelledAt: string | null
  createdById: string | null
  createdAt: string
  participants: EventParticipant[]
  /** Detail endpoint only */
  createdBy?: PublicUser | null
  excludedUserIds?: string[]
}

export type EventInput = {
  title: string
  description?: string
  location?: string
  startsAt: string
  endsAt?: string
  excludedUserIds?: string[]
}

export type Media = {
  id: string
  householdId: string
  eventId: string | null
  choreId: string | null
  mimeType: string
  originalName: string
  size: number
  createdAt: string
  uploadedBy: PublicUser | null
}
