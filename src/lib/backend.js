// User class
class User {
    constructor(userId, name, age, gender, startStation, endStation, interests, preference) {
        this.userId = userId;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.startStation = startStation;
        this.endStation = endStation;
        this.interests = interests || [];
        this.preference = preference;
    }
}

class TransitNetwork {
    constructor(networkData) {
        this.stations = new Set(networkData.stations);
        this.connections = networkData.connections || [];
        this.graph = this._buildGraph();
    }

    _buildGraph() {
        const graph = {};

        // Initialize graph with empty arrays for all stations
        this.stations.forEach(station => {
            graph[station] = [];
        });

        // Add connections
        this.connections.forEach(([a, b]) => {
            if (!graph[a]) graph[a] = [];
            if (!graph[b]) graph[b] = [];
            graph[a].push(b);
            graph[b].push(a);
        });

        return graph;
    }

    findShortestPath(start, end) {
        if (!this.stations.has(start) || !this.stations.has(end)) {
            return [];
        }
        if (start === end) {
            return [start];
        }

        const queue = [start];
        const visited = new Set([start]);
        const parent = { [start]: null };

        while (queue.length > 0) {
            const current = queue.shift();

            for (const next of this.graph[current] || []) {
                if (!visited.has(next)) {
                    visited.add(next);
                    parent[next] = current;
                    queue.push(next);

                    if (next === end) {
                        // Reconstruct path
                        const path = [];
                        let node = end;
                        while (node !== null) {
                            path.unshift(node);
                            node = parent[node];
                        }
                        return path;
                    }
                }
            }
        }
        return [];
    }
}

class RouteOverlapCalculator {
    constructor(network) {
        this.network = network;
    }

    calculatePathOverlap(path1, path2) {
        if (!path1.length || !path2.length) {
            return 0.0;
        }

        const set1 = new Set(path1);
        const set2 = new Set(path2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        const jaccard = union.size > 0 ? intersection.size / union.size : 0;

        // Calculate longest common subsequence
        let maxSeqLen = 0;
        for (let i = 0; i < path1.length; i++) {
            for (let j = 0; j < path2.length; j++) {
                let seqLen = 0;
                while (
                    i + seqLen < path1.length &&
                    j + seqLen < path2.length &&
                    path1[i + seqLen] === path2[j + seqLen]
                ) {
                    seqLen++;
                }
                maxSeqLen = Math.max(maxSeqLen, seqLen);
            }
        }

        const seqScore = (path1.length + path2.length) > 0 ?
            (2 * maxSeqLen) / (path1.length + path2.length) : 0;

        return 0.7 * jaccard + 0.3 * seqScore;
    }
}

class CommuteOverlapCalculator {
    constructor(network) {
        this.network = network;
        this.routeCalc = new RouteOverlapCalculator(network);
    }

    calculateUserOverlap(user1, user2) {
        const path1 = this.network.findShortestPath(user1.startStation, user1.endStation);
        const path2 = this.network.findShortestPath(user2.startStation, user2.endStation);

        const routeOverlap = this.routeCalc.calculatePathOverlap(path1, path2);
        const interestOverlap = this._interestOverlap(user1.interests, user2.interests);
        const overallScore = 0.7 * routeOverlap + 0.3 * interestOverlap;

        return {
            overallScore,
            routeOverlap,
            interestOverlap,
            user1Path: path1,
            user2Path: path2
        };
    }

    _interestOverlap(interests1, interests2) {
        if (!interests1.length || !interests2.length) {
            return 0.0;
        }

        const set1 = new Set(interests1);
        const set2 = new Set(interests2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size > 0 ? intersection.size / union.size : 0.0;
    }
}

class MatchingEngine {
    constructor(network) {
        this.network = network;
        this.calc = new CommuteOverlapCalculator(network);
        this.users = {};
    }

    addUser(user) {
        this.users[user.userId] = user;
    }

    _compatible(user1, user2) {
        if (user1.preference === "both" && user2.preference === "both") {
            return true;
        }
        if ((user1.preference === user2.gender || user1.preference === "both") &&
            (user2.preference === user1.gender || user2.preference === "both")) {
            return true;
        }
        return false;
    }

    findMatches(userId, minScore = 0.3, maxMatches = 10) {
        if (!(userId in this.users)) {
            return [];
        }

        const targetUser = this.users[userId];
        const matches = [];

        for (const [otherId, otherUser] of Object.entries(this.users)) {
            if (otherId === userId || !this._compatible(targetUser, otherUser)) {
                continue;
            }

            const overlap = this.calc.calculateUserOverlap(targetUser, otherUser);
            if (overlap.overallScore >= minScore) {
                matches.push({
                    userId: otherId,
                    user: otherUser,
                    overlapScore: overlap.overallScore,
                    details: overlap
                });
            }
        }

        // Sort by overlap score descending
        matches.sort((a, b) => b.overlapScore - a.overlapScore);
        return matches.slice(0, maxMatches);
    }
}

// Global variables to store initialized system
let globalNetwork = null;
let globalEngine = null;
let allUsers = [];

// File loading functions (equivalent to Python version)
async function loadNetworkData() {
    try {
        const response = await fetch('sydney_network_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading network data:', error);
        throw error;
    }
}

async function loadUsers() {
    try {
        const response = await fetch('users.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.users.map(u => new User(
            u.user_id || u.userId,
            u.name,
            u.age,
            u.gender,
            u.start_station || u.startStation,
            u.end_station || u.endStation,
            u.interests || [],
            u.preference
        ));
    } catch (error) {
        console.error('Error loading users:', error);
        throw error;
    }
}

// Initialize system using the load functions (equivalent to Python main())
export async function initializeSystemFromFiles() {
    try {
        const networkData = await loadNetworkData();
        const users = await loadUsers();

        globalNetwork = new TransitNetwork(networkData);
        globalEngine = new MatchingEngine(globalNetwork);

        // Store users globally
        allUsers = users;
        users.forEach(user => globalEngine.addUser(user));

        console.log(`System initialized with ${users.length} users and ${networkData.stations.length} stations`);
        return true;
    } catch (error) {
        console.error('Failed to initialize system:', error);
        return false;
    }
}

// Main function for your route.js API
export function findMatchesForRoute(userId, startPoint, destination, minScore = 0.3, maxMatches = 10) {
    if (!globalEngine || !globalNetwork) {
        throw new Error('System not initialized. Call initializeSystem() first.');
    }

    // Create a temporary user for the route request
    const requestUser = new User(
        userId,
        "RequestUser",
        25,
        "both",
        startPoint,
        destination,
        [],
        "both"
    );

    // Temporarily add to engine
    globalEngine.addUser(requestUser);

    try {
        // Find matches
        const matches = globalEngine.findMatches(userId, minScore, maxMatches);

        // Format matches for your API response (compatible with line 23 var users format)
        const formattedMatches = matches.map(match => ({
            userId: match.userId,
            name: match.user.name,
            age: match.user.age,
            email: match.user.email || `${match.user.name.toLowerCase().replace(' ', '.')}@example.com`,
            matchLevel: `${Math.round(match.overlapScore * 100)}%`,
            routeOverlap: `${Math.round(match.details.routeOverlap * 100)}%`,
            interestOverlap: `${Math.round(match.details.interestOverlap * 100)}%`,
            startStation: match.user.startStation,
            endStation: match.user.endStation,
            userPath: match.details.user2Path.join(' → '),
            requestorPath: match.details.user1Path.join(' → '),
            rawScore: match.overlapScore
        }));

        return formattedMatches;

    } finally {
        // Clean up: remove temporary user
        delete globalEngine.users[userId];
    }
}

// Keep the manual initialization function as well (for flexibility)
export function initializeSystem(stationsData, usersData) {
    try {
        // Create network from stations data
        const networkData = {
            stations: Array.isArray(stationsData) ? stationsData : stationsData.stations,
            connections: stationsData.connections || []
        };

        globalNetwork = new TransitNetwork(networkData);
        globalEngine = new MatchingEngine(globalNetwork);

        // Process users data
        const usersArray = Array.isArray(usersData) ? usersData : usersData.users;
        allUsers = usersArray.map(u => new User(
            u.user_id || u.userId,
            u.name,
            u.age,
            u.gender,
            u.start_station || u.startStation,
            u.end_station || u.endStation,
            u.interests || [],
            u.preference
        ));

        // Add all users to engine
        allUsers.forEach(user => globalEngine.addUser(user));

        console.log(`System initialized with ${allUsers.length} users and ${networkData.stations.length} stations`);
        return true;
    } catch (error) {
        console.error('Error initializing system:', error);
        return false;
    }
}

// Get system status
export function getSystemStatus() {
    return {
        initialized: globalEngine !== null && globalNetwork !== null,
        totalUsers: allUsers.length,
        totalStations: globalNetwork ? globalNetwork.stations.size : 0,
        totalConnections: globalNetwork ? globalNetwork.connections.length : 0
    };
}

// Get all users (for debugging)
export function getAllUsers() {
    return allUsers;
}

// Find specific user by ID
export function getUserById(userId) {
    return allUsers.find(user => user.userId === userId);
}