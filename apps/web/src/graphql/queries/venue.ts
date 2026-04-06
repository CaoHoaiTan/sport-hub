import { gql } from '@apollo/client';

export const GET_VENUES = gql`
  query GetVenues($city: String, $sportType: SportType) {
    venues(city: $city, sportType: $sportType) {
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

export const GET_VENUE = gql`
  query GetVenue($id: ID!) {
    venue(id: $id) {
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
