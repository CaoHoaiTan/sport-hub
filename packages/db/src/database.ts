import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// ─── Enums ───────────────────────────────────────────────
export type UserRole = 'admin' | 'organizer' | 'team_manager' | 'player' | 'referee';

// ─── Users ───────────────────────────────────────────────
export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: ColumnType<UserRole, UserRole | undefined, UserRole>;
  is_active: ColumnType<boolean, boolean | undefined, boolean>;
  email_verified: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// ─── Refresh Tokens ──────────────────────────────────────
export interface RefreshTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type RefreshToken = Selectable<RefreshTokensTable>;
export type NewRefreshToken = Insertable<RefreshTokensTable>;

// ─── Enums (Tournament) ──────────────────────────────────
export type SportType = 'football' | 'volleyball' | 'badminton';
export type TournamentFormat = 'round_robin' | 'single_elimination' | 'double_elimination' | 'group_stage_knockout';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';

// ─── Tournaments ─────────────────────────────────────────
export interface TournamentsTable {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string | null;
  sport: SportType;
  format: TournamentFormat;
  status: ColumnType<TournamentStatus, TournamentStatus | undefined, TournamentStatus>;
  organizer_id: string;
  max_teams: number | null;
  min_players_per_team: number;
  max_players_per_team: number;
  group_count: number | null;
  teams_per_group_advance: number | null;
  registration_start: Date | null;
  registration_end: Date | null;
  start_date: Date;
  end_date: Date | null;
  points_for_win: ColumnType<number, number | undefined, number>;
  points_for_draw: ColumnType<number, number | undefined, number>;
  points_for_loss: ColumnType<number, number | undefined, number>;
  entry_fee: ColumnType<string | null, string | number | null | undefined, string | number | null>;
  currency: ColumnType<string, string | undefined, string>;
  banner_url: string | null;
  rules_text: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Tournament = Selectable<TournamentsTable>;
export type NewTournament = Insertable<TournamentsTable>;
export type TournamentUpdate = Updateable<TournamentsTable>;

// ─── Enums (Match) ───────────────────────────────────────
export type MatchStatusType = 'scheduled' | 'checkin_open' | 'live' | 'completed' | 'postponed' | 'cancelled';

// ─── Teams ──────────────────────────────────────────────
export interface TeamsTable {
  id: Generated<string>;
  tournament_id: string;
  name: string;
  logo_url: string | null;
  manager_id: string;
  group_name: string | null;
  seed: number | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Team = Selectable<TeamsTable>;
export type NewTeam = Insertable<TeamsTable>;
export type TeamUpdate = Updateable<TeamsTable>;

// ─── Team Players ───────────────────────────────────────
export interface TeamPlayersTable {
  id: Generated<string>;
  team_id: string;
  user_id: string | null;
  full_name: string;
  jersey_number: number;
  position: string | null;
  is_captain: ColumnType<boolean, boolean | undefined, boolean>;
  is_active: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type TeamPlayer = Selectable<TeamPlayersTable>;
export type NewTeamPlayer = Insertable<TeamPlayersTable>;
export type TeamPlayerUpdate = Updateable<TeamPlayersTable>;

// ─── Matches ────────────────────────────────────────────
export interface MatchesTable {
  id: Generated<string>;
  tournament_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  round: number;
  round_name: string | null;
  group_name: string | null;
  bracket_position: number | null;
  venue_id: string | null;
  scheduled_at: Date | null;
  started_at: Date | null;
  ended_at: Date | null;
  status: ColumnType<MatchStatusType, MatchStatusType | undefined, MatchStatusType>;
  referee_id: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  is_draw: boolean | null;
  notes: string | null;
  postponed_reason: string | null;
  checkin_opens_at: Date | null;
  checkin_deadline: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Match = Selectable<MatchesTable>;
export type NewMatch = Insertable<MatchesTable>;
export type MatchUpdate = Updateable<MatchesTable>;

// ─── Match Sets ─────────────────────────────────────────
export interface MatchSetsTable {
  id: Generated<string>;
  match_id: string;
  set_number: number;
  home_score: ColumnType<number, number | undefined, number>;
  away_score: ColumnType<number, number | undefined, number>;
}

export type MatchSet = Selectable<MatchSetsTable>;
export type NewMatchSet = Insertable<MatchSetsTable>;

// ─── Match Events ───────────────────────────────────────
export interface MatchEventsTable {
  id: Generated<string>;
  match_id: string;
  team_id: string | null;
  player_id: string | null;
  event_type: string;
  minute: number | null;
  set_number: number | null;
  description: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type MatchEvent = Selectable<MatchEventsTable>;
export type NewMatchEvent = Insertable<MatchEventsTable>;

// ─── Venues ─────────────────────────────────────────────
export interface VenuesTable {
  id: Generated<string>;
  name: string;
  address: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  capacity: number | null;
  sport_types: string[] | null;
  surface_type: string | null;
  amenities: string[] | null;
  contact_info: Record<string, unknown> | null;
  created_by: string;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Venue = Selectable<VenuesTable>;
export type NewVenue = Insertable<VenuesTable>;
export type VenueUpdate = Updateable<VenuesTable>;

// ─── Standings ──────────────────────────────────────────
export interface StandingsTable {
  id: Generated<string>;
  tournament_id: string;
  team_id: string;
  group_name: string | null;
  played: ColumnType<number, number | undefined, number>;
  won: ColumnType<number, number | undefined, number>;
  drawn: ColumnType<number, number | undefined, number>;
  lost: ColumnType<number, number | undefined, number>;
  goals_for: ColumnType<number, number | undefined, number>;
  goals_against: ColumnType<number, number | undefined, number>;
  goal_difference: ColumnType<number, number | undefined, number>;
  points: ColumnType<number, number | undefined, number>;
  sets_won: ColumnType<number, number | undefined, number>;
  sets_lost: ColumnType<number, number | undefined, number>;
  rank: number | null;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Standing = Selectable<StandingsTable>;
export type NewStanding = Insertable<StandingsTable>;
export type StandingUpdate = Updateable<StandingsTable>;

// ─── Player Statistics ──────────────────────────────────
export interface PlayerStatisticsTable {
  id: Generated<string>;
  tournament_id: string;
  player_id: string;
  team_id: string;
  goals: ColumnType<number, number | undefined, number>;
  assists: ColumnType<number, number | undefined, number>;
  yellow_cards: ColumnType<number, number | undefined, number>;
  red_cards: ColumnType<number, number | undefined, number>;
  points_scored: ColumnType<number, number | undefined, number>;
  aces: ColumnType<number, number | undefined, number>;
  matches_played: ColumnType<number, number | undefined, number>;
  mvp_count: ColumnType<number, number | undefined, number>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type PlayerStatistic = Selectable<PlayerStatisticsTable>;
export type NewPlayerStatistic = Insertable<PlayerStatisticsTable>;
export type PlayerStatisticUpdate = Updateable<PlayerStatisticsTable>;

// ─── Enums (Checkin) ────────────────────────────────────
export type CheckinStatusType = 'pending' | 'checked_in' | 'absent';

// ─── Match Checkins ─────────────────────────────────────
export interface MatchCheckinsTable {
  id: Generated<string>;
  match_id: string;
  team_id: string;
  player_id: string;
  status: ColumnType<CheckinStatusType, CheckinStatusType | undefined, CheckinStatusType>;
  checked_in_at: Date | null;
  method: string | null;
  checked_in_by: string | null;
  is_starting: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type MatchCheckin = Selectable<MatchCheckinsTable>;
export type NewMatchCheckin = Insertable<MatchCheckinsTable>;
export type MatchCheckinUpdate = Updateable<MatchCheckinsTable>;

// ─── Checkin QR Codes ───────────────────────────────────
export interface CheckinQrCodesTable {
  id: Generated<string>;
  match_id: string;
  code: string;
  expires_at: Date;
  is_used: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type CheckinQrCode = Selectable<CheckinQrCodesTable>;
export type NewCheckinQrCode = Insertable<CheckinQrCodesTable>;

// ─── Enums (Payment) ────────────────────────────────────
export type PaymentStatusType = 'pending' | 'paid' | 'overdue' | 'refunded' | 'cancelled';
export type PaymentMethodType = 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay' | 'cash';

// ─── Payment Plans ──────────────────────────────────────
export interface PaymentPlansTable {
  id: Generated<string>;
  tournament_id: string;
  name: string;
  amount: string;
  currency: ColumnType<string, string | undefined, string>;
  per_team: ColumnType<boolean, boolean | undefined, boolean>;
  early_bird_amount: string | null;
  early_bird_deadline: Date | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  transfer_content: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type PaymentPlan = Selectable<PaymentPlansTable>;
export type NewPaymentPlan = Insertable<PaymentPlansTable>;
export type PaymentPlanUpdate = Updateable<PaymentPlansTable>;

// ─── Payments ───────────────────────────────────────────
export interface PaymentsTable {
  id: Generated<string>;
  payment_plan_id: string;
  team_id: string;
  user_id: string;
  amount: string;
  currency: ColumnType<string, string | undefined, string>;
  status: ColumnType<PaymentStatusType, PaymentStatusType | undefined, PaymentStatusType>;
  method: PaymentMethodType | null;
  transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  payment_url: string | null;
  promo_code: string | null;
  discount_amount: ColumnType<string, string | undefined, string>;
  refunded_at: Date | null;
  refund_reason: string | null;
  paid_at: Date | null;
  expires_at: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type Payment = Selectable<PaymentsTable>;
export type NewPayment = Insertable<PaymentsTable>;
export type PaymentUpdate = Updateable<PaymentsTable>;

// ─── Promo Codes ────────────────────────────────────────
export interface PromoCodesTable {
  id: Generated<string>;
  tournament_id: string;
  code: string;
  discount_type: string;
  discount_value: string;
  max_uses: number | null;
  used_count: ColumnType<number, number | undefined, number>;
  valid_from: Date | null;
  valid_until: Date | null;
  is_active: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type PromoCode = Selectable<PromoCodesTable>;
export type NewPromoCode = Insertable<PromoCodesTable>;
export type PromoCodeUpdate = Updateable<PromoCodesTable>;

// ─── Enums (Notification) ───────────────────────────────
export type NotificationTypeType = 'match_reminder' | 'match_result' | 'schedule_change' | 'payment_reminder' | 'registration' | 'checkin' | 'announcement' | 'system';

// ─── Notifications ──────────────────────────────────────
export interface NotificationsTable {
  id: Generated<string>;
  user_id: string;
  type: NotificationTypeType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: ColumnType<boolean, boolean | undefined, boolean>;
  read_at: Date | null;
  sent_email: ColumnType<boolean, boolean | undefined, boolean>;
  sent_push: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type Notification = Selectable<NotificationsTable>;
export type NewNotification = Insertable<NotificationsTable>;
export type NotificationUpdate = Updateable<NotificationsTable>;

// ─── Tournament Posts ───────────────────────────────────
export interface TournamentPostsTable {
  id: Generated<string>;
  tournament_id: string;
  author_id: string;
  title: string;
  content: string;
  media_urls: string[] | null;
  is_pinned: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type TournamentPost = Selectable<TournamentPostsTable>;
export type NewTournamentPost = Insertable<TournamentPostsTable>;
export type TournamentPostUpdate = Updateable<TournamentPostsTable>;

// ─── Match Comments ─────────────────────────────────────
export interface MatchCommentsTable {
  id: Generated<string>;
  match_id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  parent_id: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type MatchComment = Selectable<MatchCommentsTable>;
export type NewMatchComment = Insertable<MatchCommentsTable>;

// ─── Match Reactions ────────────────────────────────────
export interface MatchReactionsTable {
  id: Generated<string>;
  match_id: string;
  user_id: string;
  reaction: string;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export type MatchReaction = Selectable<MatchReactionsTable>;
export type NewMatchReaction = Insertable<MatchReactionsTable>;

// ─── Database ────────────────────────────────────────────
export interface Database {
  users: UsersTable;
  refresh_tokens: RefreshTokensTable;
  tournaments: TournamentsTable;
  teams: TeamsTable;
  team_players: TeamPlayersTable;
  matches: MatchesTable;
  match_sets: MatchSetsTable;
  match_events: MatchEventsTable;
  venues: VenuesTable;
  standings: StandingsTable;
  player_statistics: PlayerStatisticsTable;
  match_checkins: MatchCheckinsTable;
  checkin_qr_codes: CheckinQrCodesTable;
  payment_plans: PaymentPlansTable;
  payments: PaymentsTable;
  promo_codes: PromoCodesTable;
  notifications: NotificationsTable;
  tournament_posts: TournamentPostsTable;
  match_comments: MatchCommentsTable;
  match_reactions: MatchReactionsTable;
}
