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

function MyLikes() {
    const [currPageNum, setCurrPageNum] = useState(1);
    const locationsPerPage = 10;
    const [currPageLocs, setCurrPageLocs] = useState();
    const [numOfPages, setNumOfPages] = useState(null);
    const {loading, error, data} = useQuery(queries.LIKED_LOCATIONS_QUERY, {
        fetchPolicy: 'cache-and-network',
    });

    useEffect(() => {
        if (data) {
            const {likedLocations} = data;
            // console.log(likedLocations);
            const numPages = Math.ceil(likedLocations.length/locationsPerPage);
            setNumOfPages(numPages);


            let startIndex = (currPageNum - 1) * locationsPerPage;
            let endIndex = startIndex + locationsPerPage;


            // console.log(currPageNum);

            // console.log(startIndex, endIndex);
            if (endIndex > likedLocations) {
                endIndex = -1;
            }

            setCurrPageLocs(likedLocations.slice(startIndex, endIndex));

        }

    }, [data]);


    useEffect(() => {
        if (error) {
            console.log(error);
        }

    }, [error]);

    useEffect(() => {

        const startIndex = (currPageNum - 1) * locationsPerPage;
        const endIndex = startIndex + locationsPerPage;
        if (data) {
            const {likedLocations} = data;
            setCurrPageLocs(likedLocations.slice(startIndex, endIndex));
        }


    }, [currPageNum]);



    const [updateLocation] = useMutation(queries.UPDATE_LOCATION_MUTATION, {
        refetchQueries: [
            {
                query: queries.LIKED_LOCATIONS_QUERY,
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

    const handlePageChange = (event, page) => {
        setCurrPageNum(page);
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
    console.log(currPageLocs);
    if(currPageLocs) {
        // console.log(currPageLocs);
        if (currPageLocs.length === 0) {
            console.log(numOfPages);
            console.log(currPageNum);
            if (numOfPages < currPageNum && currPageNum > 1) {
                setCurrPageNum(currPageNum - 1);
            }
            else {
                return (<p>You have no liked locations</p>);
            }

        }
        else {
            card = currPageLocs.map((location) => {
                return buildCard(location);
            });
        }
    }


    return (
        <div>
            {currPageLocs && currPageLocs.length > 0 && (
                <Stack spacing={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <Pagination
                        count={numOfPages}
                        variant="outlined"
                        shape="rounded"
                        sx={{ "& .MuiPaginationItem-root": { margin: "0" } }}
                        page={currPageNum}
                        onChange={handlePageChange}
                    />
                </Stack>
            )}
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

export default MyLikes;
