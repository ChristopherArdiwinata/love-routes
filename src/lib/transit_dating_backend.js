const fs = require('fs');

// User class equivalent
class User {
    constructor(userId, name, age, gender, startStation, endStation, interests, preference) {
        this.userId = userId;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.startStation = startStation;
        this.endStation = endStation;
        this.interests = interests;
        this.preference = preference;
    }
}

class TransitNetwork {
    constructor(networkData) {
        this.stations = new Set(networkData.stations);
        this.connections = networkData.connections;
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

    findAllPaths(start, end, maxLength = 20) {
        if (!this.stations.has(start) || !this.stations.has(end)) {
            return [];
        }
        if (start === end) {
            return [[start]];
        }

        const allPaths = [];

        const dfs = (current, target, path, visited) => {
            if (path.length > maxLength) {
                return;
            }
            if (current === target) {
                allPaths.push([...path]);
                return;
            }
            
            for (const next of this.graph[current] || []) {
                if (!visited.has(next)) {
                    visited.add(next);
                    path.push(next);
                    dfs(next, target, path, visited);
                    path.pop();
                    visited.delete(next);
                }
            }
        };

        dfs(start, end, [start], new Set([start]));
        return allPaths;
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

    findAllMatchesOptimized(minScore = 0.3) {
        const allMatches = {};
        const userIds = Object.keys(this.users);

        // Initialize all users with empty arrays
        userIds.forEach(id => {
            allMatches[id] = [];
        });

        for (let i = 0; i < userIds.length; i++) {
            for (let j = i + 1; j < userIds.length; j++) {
                const user1 = this.users[userIds[i]];
                const user2 = this.users[userIds[j]];

                if (!this._compatible(user1, user2)) {
                    continue;
                }

                const overlap = this.calc.calculateUserOverlap(user1, user2);
                if (overlap.overallScore >= minScore) {
                    allMatches[user1.userId].push({
                        userId: user2.userId,
                        user: user2,
                        overlapScore: overlap.overallScore,
                        details: overlap
                    });
                    allMatches[user2.userId].push({
                        userId: user1.userId,
                        user: user1,
                        overlapScore: overlap.overallScore,
                        details: overlap
                    });
                }
            }
        }

        // Sort each user's matches by overlap score descending
        Object.values(allMatches).forEach(matches => {
            matches.sort((a, b) => b.overlapScore - a.overlapScore);
        });

        return allMatches;
    }

    getAllMatches(minScore = 0.3) {
        return this.findAllMatchesOptimized(minScore);
    }
}

// Utility functions
function loadNetworkData() {
    try {
        const data = fs.readFileSync('sydney_network_data.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading network data:', error.message);
        return null;
    }
}

function loadUsers() {
    try {
        const data = fs.readFileSync('users.json', 'utf8');
        const parsed = JSON.parse(data);
        return parsed.users.map(u => new User(
            u.user_id || u.userId,
            u.name,
            u.age,
            u.gender,
            u.start_station || u.startStation,
            u.end_station || u.endStation,
            u.interests,
            u.preference
        ));
    } catch (error) {
        console.error('Error loading users:', error.message);
        return [];
    }
}

function main() {
    const networkData = loadNetworkData();
    if (!networkData) {
        console.error('Failed to load network data');
        return;
    }

    const network = new TransitNetwork(networkData);
    const engine = new MatchingEngine(network);

    const users = loadUsers();
    if (users.length === 0) {
        console.error('Failed to load users');
        return;
    }

    users.forEach(user => engine.addUser(user));

    // Example usage - finding matches for the first user
    const targetUser = users[0];
    console.log(`Finding matches for ${targetUser.name}:`);
    
    const matches = engine.findMatches(targetUser.userId, 0.1);
    matches.forEach((match, index) => {
        const user = match.user;
        const details = match.details;
        console.log(`${index + 1}. ${user.name} (Score: ${match.overlapScore.toFixed(3)})`);
        console.log(`   Commute: ${user.startStation} → ${user.endStation}`);
        console.log(`   Route overlap: ${details.routeOverlap.toFixed(3)}`);
        console.log(`   Interest overlap: ${details.interestOverlap.toFixed(3)}`);
        console.log(`   Path 1: ${details.user1Path.join(' → ')}`);
        console.log(`   Path 2: ${details.user2Path.join(' → ')}`);
        console.log();
    });

    // Batch matching
    const allMatches = engine.findAllMatchesOptimized(0.1);
    const totalMatches = Object.values(allMatches).reduce((sum, matches) => sum + matches.length, 0);
    const avgMatches = totalMatches / users.length;

    console.log("=== OPTIMIZED BATCH MATCHING ===");
    console.log(`Total users: ${users.length}`);
    console.log(`Total matches: ${totalMatches}`);
    console.log(`Average matches per user: ${avgMatches.toFixed(1)}`);
}

// Export classes for use as modules
module.exports = {
    User,
    TransitNetwork,
    RouteOverlapCalculator,
    CommuteOverlapCalculator,
    MatchingEngine,
    loadNetworkData,
    loadUsers,
    main
};

// Run main if this file is executed directly
if (require.main === module) {
    main();
}