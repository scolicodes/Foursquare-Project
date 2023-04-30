// import server
const {ApolloServer, gql} = require('apollo-server');
const lodash = require('lodash');
const uuid = require('uuid');
const redis = require('redis');
const client = redis.createClient();
require('dotenv').config();

client.connect().then(() => {});
const axios = require('axios');

const headers = {
    Accept: 'application/json',
    Authorization: process.env.AUTHORIZATION_KEY
};


async function getApiData(url, nextPageNum) {
    console.log(url);

    let response;
    try {
        response = await axios.get(url, { headers });
    }
    catch (e) {
        console.log(e);
    }

    console.log(response);



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

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     // Distance in miles
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

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
    distance: Int!
}
type Query {
    locationPosts(pageNum: Int): LocationPostResult
    likedLocations: [Location]
    userPostedLocations: [Location]
    getTopTenClosestLocations(latitude: Float, longitude: Float): [Location]
}
type Mutation {
    uploadLocation(image: String!, address: String, name: String!): Location
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
            let likedLocsInRedis = await client.lRange('likedLocations', 0, -1);
            likedLocsInRedis = likedLocsInRedis.map((likedLoc) => JSON.parse(likedLoc));


            pageInfo.locations = pageInfo.locations.map((location) => {
                const isLiked = likedLocsInRedis.some(likedLocInRedis => likedLocInRedis.id === location.id);
                return {...location, liked: isLiked};
            });

            // console.log(`Page ${pageNum}: `, pageInfo);

            return pageInfo;
        }
        ,
        likedLocations: async () => {
            let locations = await client.lRange('likedLocations', 0, -1);
            locations = locations.map(location => JSON.parse(location));
            console.log(locations);

            return locations;
        },
        userPostedLocations: async () => {
            let locations = await client.lRange('userPostedLocations', 0, -1);
            locations = locations.map((location) => JSON.parse(location));

            let likedLocsInRedis = await client.lRange('likedLocations', 0, -1);
            likedLocsInRedis = likedLocsInRedis.map((likedLoc) => JSON.parse(likedLoc));


            console.log(locations);
            locations = locations.map((location) => {
                const isLiked = likedLocsInRedis.some(likedLocInRedis => likedLocInRedis.id === location.id);
                return {...location, liked: isLiked};
            });

            return locations;
        },
        getTopTenClosestLocations: async (_, {latitude, longitude}) => {
            let likedLocsInRedis = await client.lRange('likedLocations', 0, -1);
            likedLocsInRedis = likedLocsInRedis.map((likedLoc) => JSON.parse(likedLoc));

            // Remove the old topTenClosestLocations set before calculating the new top 10
            await client.del('topTenClosestLocations');

            for (const loc of likedLocsInRedis) {
                const {data} = await axios.get(`https://api.foursquare.com/v3/places/${loc.id}`, {headers});
                const locCoords = data.geocodes.main;

                let distance = getDistance(latitude, longitude, locCoords.latitude, locCoords.longitude);  // In miles
                distance = parseInt(distance);

                let updatedLoc = {...loc, distance: distance};
                updatedLoc = JSON.stringify(updatedLoc);

                try {
                    await client.zAdd('topTenClosestLocations', [{score: distance, value: updatedLoc}]);
                }
                catch (e) {
                    console.log(e.message);
                }
            }

            const top10Closest = await client.zRange("topTenClosestLocations", 0, 9);
            return top10Closest.map(loc => JSON.parse(loc));
        }
    },
    Mutation: {
        uploadLocation: async(_, {image, address, name}) => {
            console.log(5);
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
                id: id,
                image: image,
                name: name,
                address: address,
                userPosted: userPosted,
                liked: liked,
            };

            if (liked === true) {
                await client.rPush('likedLocations', JSON.stringify(newLocation));
            }
            else {
                let likedLocations = await client.lRange('likedLocations', 0, -1);


                const locationToRemove = likedLocations.find((likedLocationString) => {
                    const likedLocation = JSON.parse(likedLocationString);
                    return likedLocation.id === id;
                });

                console.log(locationToRemove);

                if (locationToRemove) {
                    await client.lRem('likedLocations', 1, locationToRemove);
                }
                else {
                    console.log('Location with the specified ID not found in likedLocations cache.');
                }
            }



            return newLocation;
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