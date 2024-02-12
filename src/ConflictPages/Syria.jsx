import React from 'react';
import SyriaChart from '../Charts/SyriaChart';
import ImageList from "../Contents/ImageList"

const Syria = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}> {/* Use flexbox to display components and center them */}
            <div style={{ marginRight: '20px' }}> {/* Adjust margin for spacing */}
                <ImageList /> {/* Render the ImageList component */}
            </div>
            <SyriaChart /> {/* Render the SyriaChart component */}
            <div style={{ marginLeft: '20px' }}> {/* Adjust margin for spacing */}
                <ImageList /> {/* Render the ImageList component */}
            </div>
        </div>
    )
}

export default Syria;