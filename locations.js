// Sample location data for team members
// To update a location, modify the latitude, longitude, and last_updated fields for the respective person.
// You can also add notes, for example, about where they are heading or if they need help.

const locations = [
    {
        name: "Alice",
        latitude: 34.0522,
        longitude: -118.2437,
        last_updated: "2024-05-21T10:00:00Z",
        notes: "At the main hall, checking event schedules."
    },
    {
        name: "Bob",
        latitude: 34.0530,
        longitude: -118.2445,
        last_updated: "2024-05-21T10:05:00Z",
        notes: "Heading to Chemistry event."
    },
    {
        name: "Charlie",
        latitude: 34.0525,
        longitude: -118.2420,
        last_updated: "2024-05-21T09:55:00Z",
        notes: "Currently at the cafeteria."
    },
    {
        name: "Diana",
        latitude: 0, // Example of someone whose location is not yet reported
        longitude: 0,
        last_updated: "N/A",
        notes: "Location not yet reported."
    }
];

// To make this data accessible to other scripts, you might not need to explicitly export
// if it's included via a <script> tag before the script that uses it.
// However, if you were using modules, you would do:
// export default locations;
