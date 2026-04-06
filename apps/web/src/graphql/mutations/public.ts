import { gql } from '@apollo/client';

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      tournamentId
      authorId
      author {
        id
        fullName
        avatarUrl
      }
      title
      content
      mediaUrls
      isPinned
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      content
      mediaUrls
      isPinned
      updatedAt
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      id
      matchId
      userId
      user {
        id
        fullName
        avatarUrl
      }
      guestName
      content
      parentId
      createdAt
    }
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const ADD_REACTION = gql`
  mutation AddReaction($matchId: ID!, $reaction: String!) {
    addReaction(matchId: $matchId, reaction: $reaction)
  }
`;
