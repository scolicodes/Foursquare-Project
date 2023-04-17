import '../../App.css';
import ReactModal from 'react-modal';
import {useMutation} from '@apollo/client';
//Import the file where my query constants are defined
import queries from '../../queries';
import React, {useState} from "react";

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
function DeleteEmployeeModal(props) {
    const [showDeleteModal, setShowDeleteModal] = useState(props.isOpen);
    const [location, setLocation] = useState (props.deleteLocation);

    const [removeLocation] = useMutation(queries.DELETE_LOCATION_MUTATION, {
        update(cache, {data: {removeEmployee}}) {
            const {userPostedLocations} = cache.readQuery({query: queries.USER_POSTED_LOCATIONS_QUERY});
            cache.writeQuery({
                query: queries.USER_POSTED_LOCATIONS_QUERY, data: {userPostedLocations: userPostedLocations.filter((l) => l.id !== location.id)}
            });
        }
    });

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setLocation(null);
        props.handleClose();
    };

    return (
        <div>
            <ReactModal name='deleteModal' isOpen={showDeleteModal} contentLabel="Delete Employee" style={customStyles}>
                <div>
                    <p>Are you sure you want to delete {location.name}?</p>
                    <form className='form' id='delete-employee' onSubmit={async (e) => {
                        e.preventDefault();
                        await removeLocation({
                            variables: {
                                id: location.id
                            }
                        });
                        setShowDeleteModal(false);
                        alert(`${location.name} deleted`);
                        props.handleClose();
                    }}>
                        <br/>
                        <br/>
                        <button className="button add-button" type="submit">Delete Location</button>
                        <button className='button cancel-button' onClick={handleCloseDeleteModal}>
                            Cancel
                        </button>
                    </form>
                </div>
            </ReactModal>
        </div>
    );

}

export default DeleteEmployeeModal;