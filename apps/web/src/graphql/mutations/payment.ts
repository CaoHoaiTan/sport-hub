import { gql } from '@apollo/client';

import { PAYMENT_FIELDS } from '../fragments/payment';

export const CREATE_PAYMENT_PLAN = gql`
  mutation CreatePaymentPlan($input: CreatePaymentPlanInput!) {
    createPaymentPlan(input: $input) {
      id
      tournamentId
      name
      amount
      currency
      perTeam
      earlyBirdAmount
      earlyBirdDeadline
      bankName
      bankAccountNumber
      bankAccountHolder
      transferContent
      createdAt
    }
  }
`;

export const UPDATE_PAYMENT_PLAN = gql`
  mutation UpdatePaymentPlan($id: ID!, $input: UpdatePaymentPlanInput!) {
    updatePaymentPlan(id: $id, input: $input) {
      id
      tournamentId
      name
      amount
      currency
      perTeam
      earlyBirdAmount
      earlyBirdDeadline
      bankName
      bankAccountNumber
      bankAccountHolder
      transferContent
      createdAt
    }
  }
`;

export const DELETE_PAYMENT_PLAN = gql`
  mutation DeletePaymentPlan($id: ID!) {
    deletePaymentPlan(id: $id)
  }
`;

export const INITIATE_PAYMENT = gql`
  ${PAYMENT_FIELDS}
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) {
      ...PaymentFields
    }
  }
`;

export const CONFIRM_MANUAL_PAYMENT = gql`
  ${PAYMENT_FIELDS}
  mutation ConfirmManualPayment($paymentId: ID!, $transactionId: String) {
    confirmManualPayment(paymentId: $paymentId, transactionId: $transactionId) {
      ...PaymentFields
    }
  }
`;

export const REFUND_PAYMENT = gql`
  ${PAYMENT_FIELDS}
  mutation RefundPayment($paymentId: ID!, $reason: String!) {
    refundPayment(paymentId: $paymentId, reason: $reason) {
      ...PaymentFields
    }
  }
`;

export const CREATE_PROMO_CODE = gql`
  mutation CreatePromoCode($input: CreatePromoCodeInput!) {
    createPromoCode(input: $input) {
      id
      tournamentId
      code
      discountType
      discountValue
      maxUses
      usedCount
      validFrom
      validUntil
      isActive
      createdAt
    }
  }
`;
