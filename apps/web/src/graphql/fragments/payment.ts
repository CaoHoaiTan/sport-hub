import { gql } from '@apollo/client';

export const PAYMENT_FIELDS = gql`
  fragment PaymentFields on Payment {
    id
    paymentPlanId
    teamId
    userId
    amount
    currency
    status
    method
    transactionId
    paymentUrl
    promoCode
    discountAmount
    paidAt
    expiresAt
    createdAt
    updatedAt
    team {
      id
      name
    }
    paymentPlan {
      id
      name
    }
  }
`;
