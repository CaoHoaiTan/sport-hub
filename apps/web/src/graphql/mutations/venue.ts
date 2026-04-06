import { gql } from '@apollo/client';

export const CREATE_VENUE = gql`
  mutation CreateVenue($input: CreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      address
      city
      latitude
      longitude
      capacity
      sportTypes
      surfaceType
      amenities
      contactInfo
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VENUE = gql`
  mutation UpdateVenue($id: ID!, $input: UpdateVenueInput!) {
    updateVenue(id: $id, input: $input) {
      id
      name
      address
      city
      latitude
      longitude
      capacity
      sportTypes
      surfaceType
      amenities
      contactInfo
      updatedAt
    }
  }
`;

export const DELETE_VENUE = gql`
  mutation DeleteVenue($id: ID!) {
    deleteVenue(id: $id)
  }
`;
