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

const UPDATE_LOCATION_MUTATION = gql`
  mutation UpdateLocation($id: ID!, $image: String, $name: String, $address: String, $userPosted: Boolean, $liked: Boolean) {
    updateLocation(id: $id, image: $image, name: $name, address: $address, userPosted: $userPosted, liked: $liked) {
      id
      name
    }
  }
`;

let exported = {
    LOCATION_POSTS_QUERY,
    UPDATE_LOCATION_MUTATION,
    LIKED_LOCATIONS_QUERY
};

export default exported;
