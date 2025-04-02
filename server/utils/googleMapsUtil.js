const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const generateStaticMapUrl = (coordinates, zoom = 15) => {
    const [longitude, latitude] = coordinates;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x300&markers=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
};

const getDirectionsUrl = (pickupCoords) => {
    const [pickupLon, pickupLat] = pickupCoords;
    // Origin is left empty, Google Maps will request user's current location
    return `https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLon}&travelmode=driving`;
};

const getDistance = async (originCoords, destCoords) => {
    try {
        const [originLon, originLat] = originCoords;
        const [destLon, destLat] = destCoords;
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLon}&destinations=${destLat},${destLon}&key=${GOOGLE_MAPS_API_KEY}`
        );
        return response.data.rows[0].elements[0];
    } catch (error) {
        console.error('Error calculating distance:', error);
        return null;
    }
};

module.exports = {
    generateStaticMapUrl,
    getDirectionsUrl,
    getDistance
};