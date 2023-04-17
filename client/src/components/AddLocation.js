import '../App.css';
import ReactModal from 'react-modal';
import {useQuery, useMutation} from '@apollo/client';
//Import the file where my query constants are defined
import queries from '../queries';
import {useState} from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import noImg from '../img/no-image.png'


// For React-modal
ReactModal.setAppElement('#root');

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '50%',
        border: '1px solid #28547a',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
};
function AddLocation(props) {
    const [addLocation] = useMutation(queries.UPLOAD_LOCATION_MUTATION);


    const {loading, error, data} = useQuery(queries.LOCATION_POSTS_QUERY);
    const handleCloseAddModal = () => {
        // props.handleClose();
    };

    if (data) {
        var {locationPosts: {locations}} = data;
    }

    const isValidImageUrl = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValidImage = await isValidImageUrl(image.value);

        if (!isValidImage) image.value = noImg;

        image.value = image.value.trim();
        address.value = address.value.trim();
        name.value = name.value.trim();


        addLocation({
            variables: {
                image: image.value,
                address: address.value,
                name: name.value
            }
        });
        image.value = '';
        address.value = '';
        name.value = '';
        alert(`Location added`);
        // props.handleClose();
    };


    let body = null;

    let image;
    let address;
    let name;
    body = (
        <form style={{marginTop: '50px'}} className="form" id="add-location" onSubmit={handleSubmit}>
            <div className='form-group'>
                <label>
                    Name:
                    <br/>
                    <input ref={(node) => {
                        name = node;
                    }} required autoFocus={true} style={{borderRadius: '10px'}}/>
                </label>
            </div>
            <br/>
            <div className='form-group'>
                <label>
                    Address:
                    <br/>
                    <input ref={(node) => {
                        address = node;
                    }} required style={{borderRadius: '10px'}}/>
                </label>
            </div>
            <br/>
            <div className='form-group'>
                <label>
                    Image URL:
                    <br/>
                    <input ref={(node) => {
                        image = node;
                    }} required autoFocus={true} style={{borderRadius: '10px'}}/>
                </label>
            </div>
            <br/>
            <button className='button add-button' type='submit' style={{marginRight: '15px'}}>Add Location</button>
        </form>
    );



    return (
        <div>
            {/*<ReactModal name='addModal' isOpen={showAddModal} contentLabel='Add Modal' style={customStyles}>*/}
            {/*    {body}*/}
            {/*</ReactModal>*/}
            {body}
        </div>
    );
}

export default AddLocation;