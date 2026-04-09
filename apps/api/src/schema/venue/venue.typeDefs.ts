import { gql } from 'graphql-tag';

export const venueTypeDefs = gql`
  scalar JSON

  type Venue {
    id: ID!
    name: String!
    address: String
    city: String
    latitude: Float
    longitude: Float
    capacity: Int
    sportTypes: [SportType!]
    surfaceType: String
    amenities: [String!]
    contactInfo: JSON
    createdBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateVenueInput {
    name: String!
    address: String
    city: String
    latitude: Float
    longitude: Float
    capacity: Int
    sportTypes: [SportType!]
    surfaceType: String
    amenities: [String!]
    contactInfo: JSON
  }

  input UpdateVenueInput {
    name: String
    address: String
    city: String
    latitude: Float
    longitude: Float
    capacity: Int
    sportTypes: [SportType!]
    surfaceType: String
    amenities: [String!]
    contactInfo: JSON
  }

  extend type Query {
    venue(id: ID!): Venue
    venues(city: String, sportType: SportType): [Venue!]!
  }

  extend type Mutation {
    createVenue(input: CreateVenueInput!): Venue!
    updateVenue(id: ID!, input: UpdateVenueInput!): Venue!
    deleteVenue(id: ID!): Boolean!
  }
`;
