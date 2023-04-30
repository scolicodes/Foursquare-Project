import {gql} from '@apollo/client';

const LOCATION_POSTS_QUERY = gql`
  query($pageNum: Int) {
    locationPosts(pageNum: $pageNum) {
      nextLink
      locations {
        id
        image
        name
        address
        userPosted
        liked
      }
    }
  }
`;

const GET_TOP_TEN = gql`
    query($latitude: Float, $longitude: Float) {
    getTopTenClosestLocations(latitude: $latitude, longitude: $longitude) {
      id
      image
      name
      address
      userPosted
      liked
      distance
    }
  }
`;

const LIKED_LOCATIONS_QUERY = gql`
    query {
    likedLocations {
      id
      image
      name
      address
      userPosted
      liked
    }
  }
`;

const USER_POSTED_LOCATIONS_QUERY = gql`
    query {
    userPostedLocations {
      id
      image
      name
      address
      userPosted
      liked
    }
  }
`;

const UPDATE_LOCATION_MUTATION = gql`
  mutation UpdateLocation($id: ID!, $image: String, $name: String, $address: String, $userPosted: Boolean, $liked: Boolean) {
    updateLocation(id: $id, image: $image, name: $name, address: $address, userPosted: $userPosted, liked: $liked) {
      id
      name
    }
  }
`;

const UPLOAD_LOCATION_MUTATION = gql`
  mutation UploadLocation($image: String!, $address: String, $name: String!) {
    uploadLocation(image: $image, address: $address, name: $name) {
      id
      name
    }
  }
`;

const DELETE_LOCATION_MUTATION = gql`
  mutation DeleteLocation($id: ID!) {
    deleteLocation(id: $id) {
      id
      name
    }
  }
`;

let exported = {
    LOCATION_POSTS_QUERY,
    UPDATE_LOCATION_MUTATION,
    LIKED_LOCATIONS_QUERY,
    UPLOAD_LOCATION_MUTATION,
    USER_POSTED_LOCATIONS_QUERY,
    DELETE_LOCATION_MUTATION,
    GET_TOP_TEN
};

export default exported;
