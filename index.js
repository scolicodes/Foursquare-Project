// import server
const {ApolloServer, gql} = require('apollo-server');
const lodash = require('lodash');
const uuid = require('uuid');
const redis = require('redis');
const client = redis.createClient();
client.connect().then(() => {});
const axios = require('axios');

const headers = {
    Accept: 'application/json',
    Authorization: 'fsq37hPhcQUPsfJvWmCfcRREMmRZI07Cwn37GE2Ck/O9WCE='
};





// async function getApiData(url = 'https://api.foursquare.com/v3/places/search') {
//     let locations = [];
//
//     const response = await axios.get(url, { headers });
//
//     const places = response.data.results.map(async (place) => {
//         const image = await getImageUrl(headers, place.fsq_id);
//         return {
//             id: place.fsq_id,
//             image: image,
//             name: place.name,
//             address: place.location.address,
//             userPosted: false,
//             liked: false,
//         };
//     });
//
//     locations = locations.concat(await Promise.all(places));
//
//     // console.log(response.headers);
//     // console.log(response.headers.link);
//
//     if (response.headers && response.headers.link) {
//         const linkHeader = response.headers.link;
//         const nextLink = linkHeader.match(/<([^>]*)>/)[1];
//         const nextLocations = await getApiData(nextLink);
//         locations = locations.concat(nextLocations);
//     }
//
//     return locations;
// }

async function getApiData(url, nextPageNum) {
    console.log(nextPageNum);

    const response = await axios.get(url, { headers });


    const locations = await Promise.all(response.data.results.map(async (place) => {
        const image = await getImageUrl(headers, place.fsq_id);
        console.log(place);
        return {
            id: place.fsq_id,
            image: image,
            name: place.name,
            address: `${place.location.formatted_address}`,
            userPosted: false,
            liked: false,
        };
    }));


    let pageInfo;
    if (response.headers && response.headers.link) {
        const linkHeader = response.headers.link;
        const nextLink = linkHeader.match(/<([^>]*)>/)[1];
        pageInfo = {
            nextLink: nextLink,
            locations: locations,
        };
        await client.hSet('pageUrls', `Page_${nextPageNum}`, nextLink);
    } else {
        pageInfo = {
            nextLink: null,
            locations: locations,
        };
    }

    return pageInfo;
}

// Helper function to fetch image URL
const getImageUrl = async (headers, id) => {
    const photoResponse = await axios.get(`https://api.foursquare.com/v3/places/${id}/photos`, {headers});
    // console.log(photoResponse.data);
    if (photoResponse.data[0])  {
        const { prefix, suffix, width, height } = photoResponse.data[0];
        return `${prefix}300x300${suffix}`;
    }
    else {
        return 'none';
    }
};

// Type Definitions
const typeDefs = gql`
type LocationPostResult {
    nextLink: String
    locations: [Location]
}
type Location {
    id: ID!
    image: String!
    name: String!
    address: String
    userPosted: Boolean!
    liked: Boolean!
}
type Query {
    locationPosts(pageNum: Int): LocationPostResult
    likedLocations: [Location]
    userPostedLocations: [Location]
}
type Mutation {
    uploadLocation(image: String!, address: String, name: String): Location
    updateLocation(id: ID!, image: String, name: String, address: String, userPosted: Boolean, liked: Boolean): Location
    deleteLocation(id: ID!): Location

}
`;


// Resolvers
const resolvers = {
    Query: {
        locationPosts: async (_, {pageNum}) => {
            const firstPageUrlExists = await client.hExists('pageURLS', `Page_1`);
            if (!firstPageUrlExists) await client.hSet('pageUrls', 'Page_1', 'https://api.foursquare.com/v3/places/search');

            const pageExists = await client.hExists('pageResultsHash', `Page_${pageNum}`);
            let pageInfo;
            if (pageExists) {
                console.log(`Locations on page ${pageNum} found in the cache`);
                let locationsList = await client.hGet('pageResultsHash', `Page_${pageNum}`);
                pageInfo = JSON.parse(locationsList);

            }
            else {
                let url = await client.hGet('pageUrls', `Page_${pageNum}`);


                pageInfo = await getApiData(url, pageNum + 1);

                await client.hSet("pageResultsHash", `Page_${pageNum}`, JSON.stringify(pageInfo));
            }
            const likedLocsInRedis = await client.lRange('likedLocations', 0, -1);
            // console.log('redis', likedLocsInRedis);

            pageInfo.locations = pageInfo.locations.map((location) => {
                const isLiked = likedLocsInRedis.some(likedLocInRedis => likedLocInRedis === location.id);
                return {...location, liked: isLiked};
            });

            // console.log(`Page ${pageNum}: `, pageInfo);

            return pageInfo;
        }
        ,
        likedLocations: async () => {
            const locations = await client.lRange('likedLocations', 0, -1);
            // console.log(locations);
            return locations.map((location) => JSON.parse(location));
        },
        userPostedLocations: async () => {
            const locations = await client.lRange('userPostedLocations', 0, -1);
            return locations.map(location => JSON.parse(location));
        }

    },
    Mutation: {
        uploadLocation: async(_, {image, address, name}) => {
            const newLocation = {
                id: uuid.v4(),
                image: image,
                name: name,
                address: address,
                userPosted: true,
                liked: false,
            };

            await client.rPush('userPostedLocations', JSON.stringify(newLocation));
            return newLocation;
        },
        updateLocation: async(_, {id, image, name, address, userPosted, liked}) => {

            let newLocation = {
                id: id
            };

            if (liked === true) {
                await client.rPush('likedLocations', id);
            }
            else {
                await client.lRem('likedLocations', 1, id);
            }
        },
        deleteLocation: async(_, {id}) => {
            const locationKey = 'userPostedLocations';
            const locations = await client.lRange(locationKey, 0, -1);
            const index = locations.findIndex(location => JSON.parse(location).id === id);

            if (index === -1) {
                throw `404 Error: User-posted location with id ${id} not found`;
            }

            const locationToDelete = JSON.parse(locations[index]);

            // Remove the location from Redis Cache
            await client.lRem(locationKey, 1, JSON.stringify(locationToDelete));

            return locationToDelete;
        }
    }
};

const server = new ApolloServer({typeDefs, resolvers});
server.listen().then(({url}) => {
    console.log(`🚀Server ready at ${url}🚀 `);
});