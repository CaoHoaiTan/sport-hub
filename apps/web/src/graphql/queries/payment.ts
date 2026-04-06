import { gql } from '@apollo/client';

import { PAYMENT_FIELDS } from '../fragments/payment';

export const GET_PAYMENT_PLANS = gql`
  query GetPaymentPlans($tournamentId: ID!) {
    paymentPlansByTournament(tournamentId: $tournamentId) {
      id
      tournamentId
      name
      amount
      currency
      perTeam
      earlyBirdAmount
      earlyBirdDeadline
      createdAt
    }
  }
`;

export const GET_PAYMENTS_BY_TOURNAMENT = gql`
  ${PAYMENT_FIELDS}
  query GetPaymentsByTournament($tournamentId: ID!) {
    paymentsByTournament(tournamentId: $tournamentId) {
      ...PaymentFields
    }
  }
`;

export const GET_PAYMENTS_BY_TEAM = gql`
  ${PAYMENT_FIELDS}
  query GetPaymentsByTeam($teamId: ID!) {
    paymentsByTeam(teamId: $teamId) {
      ...PaymentFields
    }
  }
`;

export const GET_FINANCIAL_SUMMARY = gql`
  query GetFinancialSummary($tournamentId: ID!) {
    financialSummary(tournamentId: $tournamentId) {
      totalRevenue
      totalPending
      totalRefunded
      paymentCount
      paidCount
      overdueCount
    }
  }
`;

export const VALIDATE_PROMO_CODE = gql`
  query ValidatePromoCode($tournamentId: ID!, $code: String!, $amount: Float!) {
    validatePromoCode(tournamentId: $tournamentId, code: $code, amount: $amount) {
      valid
      discountAmount
      message
    }
  }
`;
