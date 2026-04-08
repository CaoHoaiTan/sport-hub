import gql from 'graphql-tag';

export const paymentTypeDefs = gql`
  enum PaymentStatus {
    pending
    paid
    overdue
    refunded
    cancelled
  }

  enum PaymentMethod {
    bank_transfer
    momo
    vnpay
    cash
  }

  type PaymentPlan {
    id: ID!
    tournamentId: ID!
    tournament: Tournament!
    name: String!
    amount: Float!
    currency: String!
    perTeam: Boolean!
    earlyBirdAmount: Float
    earlyBirdDeadline: DateTime
    createdAt: DateTime!
  }

  type Payment {
    id: ID!
    paymentPlanId: ID!
    paymentPlan: PaymentPlan!
    teamId: ID!
    team: Team!
    userId: ID!
    amount: Float!
    currency: String!
    status: PaymentStatus!
    method: PaymentMethod
    transactionId: String
    paymentUrl: String
    promoCode: String
    discountAmount: Float!
    refundedAt: DateTime
    refundReason: String
    paidAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PromoCode {
    id: ID!
    tournamentId: ID!
    code: String!
    discountType: String!
    discountValue: Float!
    maxUses: Int
    usedCount: Int!
    validFrom: DateTime
    validUntil: DateTime
    isActive: Boolean!
    createdAt: DateTime!
  }

  type FinancialSummary {
    totalRevenue: Float!
    totalPending: Float!
    totalRefunded: Float!
    paymentCount: Int!
    paidCount: Int!
    overdueCount: Int!
  }

  type PromoValidation {
    valid: Boolean!
    discountAmount: Float
    message: String
  }

  input CreatePaymentPlanInput {
    tournamentId: ID!
    name: String!
    amount: Float!
    currency: String
    perTeam: Boolean
    earlyBirdAmount: Float
    earlyBirdDeadline: DateTime
  }

  input InitiatePaymentInput {
    paymentPlanId: ID!
    teamId: ID!
    method: PaymentMethod!
    promoCode: String
    returnUrl: String
  }

  input CreatePromoCodeInput {
    tournamentId: ID!
    code: String!
    discountType: String!
    discountValue: Float!
    maxUses: Int
    validFrom: DateTime
    validUntil: DateTime
  }

  extend type Query {
    paymentPlansByTournament(tournamentId: ID!): [PaymentPlan!]!
    paymentsByTournament(tournamentId: ID!): [Payment!]!
    paymentsByTeam(teamId: ID!): [Payment!]!
    financialSummary(tournamentId: ID!): FinancialSummary!
    validatePromoCode(tournamentId: ID!, code: String!, amount: Float!): PromoValidation!
  }

  extend type Mutation {
    createPaymentPlan(input: CreatePaymentPlanInput!): PaymentPlan!
    initiatePayment(input: InitiatePaymentInput!): Payment!
    confirmManualPayment(paymentId: ID!, transactionId: String): Payment!
    handlePaymentCallback(paymentId: ID!, transactionId: String!, gatewayResponse: String!): Payment!
    refundPayment(paymentId: ID!, reason: String!): Payment!
    createPromoCode(input: CreatePromoCodeInput!): PromoCode!
  }
`;
