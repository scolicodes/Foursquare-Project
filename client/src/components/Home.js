import React, {useEffect, useRef} from 'react';
import { useQuery, useMutation, useApolloClient} from '@apollo/client';
import queries from '../queries'

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import {Button, CardActionArea, CardActions, Grid} from '@mui/material';
import {useState} from 'react';
import Stack from '@mui/material/Stack';
import Pagination from '@mui/material/Pagination';
import noImg from '../img/no-image.png';

function Home() {
    const [currPage, setCurrPage] = useState(2);
    const [isFirstPage, setIsFirstPage] = useState(true);
    const [isLastPage, setIsLastPage] = useState(false);
    const {loading, error, data} = useQuery(queries.LOCATION_POSTS_QUERY, {
        variables: { pageNum: currPage },
        fetchPolicy: 'cache-and-network',
    });

    useEffect(() => {
        if (data) {
            const {locationPosts} = data;
            if (!locationPosts.nextLink) {
                setIsLastPage(true);
            }

        }

    }, [data]);

    useEffect(() => {
        if (error) {
            console.log(error);
        }

    }, [error]);

    useEffect(() => {
        if (currPage === 1) {
            setIsFirstPage(true);
            setIsLastPage(false);
        }
        else {
            setIsFirstPage(false);
        }
        // console.log(currPage);

    }, [currPage]);


    const [updateLocation] = useMutation(queries.UPDATE_LOCATION_MUTATION, {
        refetchQueries: [
            {
                query: queries.LOCATION_POSTS_QUERY,
                variables: {pageNum: currPage}
            }
        ]
    });

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

    const handleNextPage = () => {
        setCurrPage(currPage + 1);
    };

    const handlePrevPage = () => {
        setCurrPage(currPage - 1);
        setIsLastPage(false);
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
    if (data.locationPosts.locations) {
        card = data.locationPosts.locations.map((location) => {
            return buildCard(location);
        });
    }

    return (
        <div>
            {!isFirstPage && (
                <Button className="showlink2" onClick={handlePrevPage}>
                    Prev
                </Button>
            )}
            {!isLastPage && (

                <Button className="showlink2" onClick={handleNextPage}>
                    Next
                </Button>
            )}

            <br />
            <br />
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

export default Home;
