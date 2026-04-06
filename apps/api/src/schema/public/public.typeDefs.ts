import gql from 'graphql-tag';

export const publicTypeDefs = gql`
  type TournamentPost {
    id: ID!
    tournamentId: ID!
    authorId: ID!
    author: User
    title: String!
    content: String!
    mediaUrls: [String!]
    isPinned: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MatchComment {
    id: ID!
    matchId: ID!
    userId: ID
    user: User
    guestName: String
    content: String!
    parentId: ID
    replies: [MatchComment!]!
    createdAt: DateTime!
  }

  type MatchReaction {
    id: ID!
    matchId: ID!
    userId: ID!
    reaction: String!
    createdAt: DateTime!
  }

  type ReactionCount {
    reaction: String!
    count: Int!
  }

  input CreatePostInput {
    tournamentId: ID!
    title: String!
    content: String!
    mediaUrls: [String!]
    isPinned: Boolean
  }

  input UpdatePostInput {
    title: String
    content: String
    mediaUrls: [String!]
    isPinned: Boolean
  }

  input AddCommentInput {
    matchId: ID!
    content: String!
    guestName: String
    parentId: ID
  }

  extend type Query {
    publicTournament(slug: String!): Tournament
    publicMatch(id: ID!): Match
    publicStandings(tournamentSlug: String!): [Standing!]!
    publicSchedule(tournamentSlug: String!): [Match!]!
    tournamentPosts(tournamentId: ID!, limit: Int, offset: Int): [TournamentPost!]!
    matchComments(matchId: ID!, limit: Int, offset: Int): [MatchComment!]!
    matchReactionCounts(matchId: ID!): [ReactionCount!]!
  }

  extend type Mutation {
    createPost(input: CreatePostInput!): TournamentPost!
    updatePost(id: ID!, input: UpdatePostInput!): TournamentPost!
    deletePost(id: ID!): Boolean!
    addComment(input: AddCommentInput!): MatchComment!
    deleteComment(id: ID!): Boolean!
    addReaction(matchId: ID!, reaction: String!): Boolean!
  }
`;
