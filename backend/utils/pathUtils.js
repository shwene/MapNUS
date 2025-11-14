export const processPath = (path) => {
    const getDirection = (current, previous) => {
        if (current === "U") return "Go Up";
        if (current === "D") return "Go Down";
        if (current === "L") return "Take Lift";

        if (!previous) {
            return "Go Straight";
        }

        const turns = {
            N: { N: "Go Straight", W: "Turn Right", E: "Turn Left", S: "Turn Around", U: "Go Straight", D: "Go Straight", L: "Go Straight" },
            S: { S: "Go Straight", E: "Turn Right", W: "Turn Left", N: "Turn Around", U: "Go Straight", D: "Go Straight", L: "Go Straight" },
            E: { E: "Go Straight", S: "Turn Left", N: "Turn Right", W: "Turn Around", U: "Go Straight", D: "Go Straight", L: "Go Straight" },
            W: { W: "Go Straight", N: "Turn Left", S: "Turn Right", E: "Turn Around", U: "Go Straight", D: "Go Straight", L: "Go Straight" },
        };

        return turns[current][previous] || "Go Straight";
    };

    const nodes = path.segments.map(s => s.start.properties)
        .concat(path.segments.length ? [path.end.properties] : []);

    let totalDistance = 0;
    let totalTimeCost = 0;
    let previousHeading = null;

    const edges = path.segments.map(segment => {
        const distance = Number(segment.relationship.properties.Distance) || 0;
        const time_cost = Number(segment.relationship.properties.Time_Cost) || 0;
        const layer = segment.relationship.properties.Parent_Layer || "Unknown";
        const heading = segment.relationship.properties.Heading || "N";

        totalDistance += distance;
        totalTimeCost += time_cost;

        const direction = getDirection(heading, previousHeading);
        previousHeading = heading;

        return {
            src: segment.start.properties.Name,
            dest: segment.end.properties.Name,
            distance,
            time_cost,
            geometry: segment.relationship.properties.coordinates || [],
            layer,
            heading,
            direction
        };
    });

    return { nodes, edges, total_distance: totalDistance, total_time_cost: totalTimeCost };
};
