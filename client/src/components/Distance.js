import {useMutation, useQuery} from "@apollo/client";
import queries from "../queries";
import React, {useEffect, useState} from "react";
import {Button, CardActionArea, CardActions, Grid} from "@mui/material";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import noImg from "../img/no-image.png";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

function Distance () {
    const [sumOfDistances, setSumOfDistances] = useState(null);
    const [numOfLocs, setNumOfLocs] = useState(null);
    const [location, setLocation] = useState({latitude: null, longitude: null});
    const {loading, error, data} = useQuery(queries.GET_TOP_TEN, {
        variables: {latitude: location.latitude, longitude: location.longitude},
        fetchPolicy: 'cache-and-network',
        skip: location.latitude === null || location.longitude === null,
    });
    const [updateLocation] = useMutation(queries.UPDATE_LOCATION_MUTATION, {
        refetchQueries: [
            {
                query: queries.GET_TOP_TEN,
                variables: {latitude: location.latitude, longitude: location.longitude}
            }
        ]
    });

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    console.log(latitude, longitude);

                    setLocation({ latitude, longitude });
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        } else {
            console.error('Geolocation not available in this browser');
        }
    }, []);

    useEffect(() => {
        if (data && data.getTopTenClosestLocations) {
            const {getTopTenClosestLocations} = data;
            setSumOfDistances(getTopTenClosestLocations.reduce((accumulator, currValue) => {
                return accumulator + currValue.distance;
            }, 0));

            setNumOfLocs(getTopTenClosestLocations.length);

        }
    }, [data]);

    useEffect(() => {
        console.log(sumOfDistances);
    }, [sumOfDistances]);

    const handleLikeButtonClick = async (location) => {
        // console.log(location.liked);

        await updateLocation({
            variables: {
                id: location.id,
                image: location.image,
                name: location.name,
                address: location.address,
                userPosted: location.userPosted,
                liked: !location.liked
            },
        });
    };

    const buildCard = (location) => {
        return (
            <Grid item xs={12} sm={7} md={5} lg={4} xl={3} key={location.id} sx={{marginTop: 4}} >
                <Card sx={{maxWidth: 345}}>
                    <CardActionArea>
                        <CardMedia
                            component="img"
                            height="140"
                            image={location.image !== 'none' ? location.image : noImg}
                            alt="location image"
                        />
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                {location.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {location.address}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        <Button size="small" color="primary" onClick={() => handleLikeButtonClick(location)}>
                            {location.liked ? 'Remove like' : "Like"}
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        );
    };

    if (loading) return <p>Loading...</p>;
    if (error) return (
        <p>Error: {error.message}</p>
    );

    let card;


    if (data && data.getTopTenClosestLocations) {
        const {getTopTenClosestLocations} = data;
        if (getTopTenClosestLocations.length === 0) {
            return (<p>There is no total distance of your closest liked locations from you to show since you have no liked locations.</p>);
        }
        else {
            card = getTopTenClosestLocations.map((location) => {
                return buildCard(location);
            });
        }
    }
    else {
        return <p>Loading...</p>;
    }

    return (
        <div>
            {numOfLocs === 1 ? (<h4>The total distance of your top {numOfLocs} closest liked location from you is {sumOfDistances} miles.</h4>) : <h4>The total distance of your top {numOfLocs} closest liked locations from you is {sumOfDistances} miles.</h4>}
            {sumOfDistances && sumOfDistances < 50 ? (<h1>You are a local!</h1>) : (<h1>You are a traveler!</h1>)}
            <Grid
                container
                spacing={2}
                sx={{
                    flexGrow: 1,
                    flexDirection: 'row'
                }}
            >
                {card}
            </Grid>
        </div>
    );



}

export default Distance;