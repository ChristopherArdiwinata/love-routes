import json
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import time
import random

@dataclass
class User:
    user_id: str
    name: str
    home_station: str
    work_station: str
    commute_times: list
    age: int
    interests: list

class TransitNetwork:
    def __init__(self, data):
        self.stations = set(data['stations'])
        self.connections = data['connections']
        self.graph = self.build_graph()

    def build_graph(self):
        graph = defaultdict(list)
        for s1, s2 in self.connections:
            graph[s1].append(s2)
            graph[s2].append(s1)
        return graph

    def find_shortest_path(self, start, end):
        if start not in self.stations or end not in self.stations:
            return []
        if start == end:
            return [start]
        queue = deque([(start, [start])])
        visited = {start}
        while queue:
            current, path = queue.popleft()
            for neighbor in self.graph[current]:
                if neighbor == end:
                    return path + [neighbor]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        return []

class RouteOverlapCalculator:
    def calculate_overlap(self, path1, path2):
        if not path1 or not path2:
            return 0.0
        set1 = set(path1)
        set2 = set(path2)
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        jaccard = intersection / union if union else 0.0
        seq = 0
        for i in range(len(path1)-1):
            for j in range(len(path2)-1):
                if path1[i] == path2[j] and path1[i+1] == path2[j+1]:
                    seq += 1
        seq_bonus = seq / ((len(path1)+len(path2))/2)
        return 0.7 * jaccard + 0.3 * seq_bonus

class CommuteOverlapCalculator:
    def __init__(self, network):
        self.network = network
        self.route_calc = RouteOverlapCalculator()

    def calculate_user_overlap(self, user1, user2):
        path1 = self.network.find_shortest_path(user1.home_station, user1.work_station)
        path2 = self.network.find_shortest_path(user2.home_station, user2.work_station)
        route_overlap = self.route_calc.calculate_overlap(path1, path2)
        reverse_overlap = self.route_calc.calculate_overlap(list(reversed(path1)), list(reversed(path2)))
        time_overlap = self.time_overlap(user1.commute_times, user2.commute_times)
        proximity = self.station_proximity(user1, user2)
        interest_overlap = self.interest_overlap(user1, user2)
        overall = (0.35*route_overlap +
                   0.25*reverse_overlap +
                   0.25*time_overlap +
                   0.15*proximity +
                   0.2*interest_overlap)
        return {'overall_score': overall, 'route_overlap': route_overlap, 'reverse_overlap': reverse_overlap,
                'time_overlap': time_overlap, 'proximity': proximity, 'interest_overlap': interest_overlap,
                'user1_path': path1, 'user2_path': path2}

    def time_overlap(self, times1, times2):
        score = 0
        count = 0
        for t1_start, t1_end in times1:
            for t2_start, t2_end in times2:
                s1 = t1_start.hour*60 + t1_start.minute
                e1 = t1_end.hour*60 + t1_end.minute
                s2 = t2_start.hour*60 + t2_start.minute
                e2 = t2_end.hour*60 + t2_end.minute
                start = max(s1, s2)
                end = min(e1, e2)
                if start < end:
                    score += (end-start)/max(e1-s1, e2-s2)
                count += 1
        return score/count if count else 0.0

    def station_proximity(self, user1, user2):
        home_dist = len(self.network.find_shortest_path(user1.home_station, user2.home_station))
        work_dist = len(self.network.find_shortest_path(user1.work_station, user2.work_station))
        max_dist = 20
        home_score = max(0, (max_dist-home_dist)/max_dist) if home_dist else 1
        work_score = max(0, (max_dist-work_dist)/max_dist) if work_dist else 1
        return (home_score + work_score)/2

    def interest_overlap(self, user1, user2):
        set1 = set(user1.interests)
        set2 = set(user2.interests)
        if not set1 or not set2:
            return 0.0
        return len(set1 & set2)/len(set1 | set2)

class MatchingEngine:
    def __init__(self, network):
        self.network = network
        self.overlap_calc = CommuteOverlapCalculator(network)
        self.users = {}

    def add_user(self, user):
        self.users[user.user_id] = user

    def find_matches(self, user_id, min_score=0.3, max_matches=10):
        if user_id not in self.users:
            return []
        target = self.users[user_id]
        matches = []
        for uid, other in self.users.items():
            if uid == user_id:
                continue
            overlap = self.overlap_calc.calculate_user_overlap(target, other)
            if overlap['overall_score'] >= min_score:
                matches.append({'user': other, 'score': overlap['overall_score'], 'details': overlap})
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:max_matches]

class UserGenerator:
    def __init__(self, network):
        self.network = network
        self.stations = list(network.stations)
        self.pop_home = ["Bondi Junction","Chatswood","Parramatta","Liverpool","Cronulla"]
        self.pop_work = ["Central","Town Hall","Wynyard","Martin Place","Circular Quay"]

    def generate_users(self, n=10):
        names = ["Alex","Sam","Jordan","Casey","Taylor","Morgan"]
        interests_pool = ["Coffee","Books","Fitness","Music","Travel","Food"]
        users = []
        for i in range(n):
            home = random.choice(self.pop_home)
            work = random.choice(self.pop_work)
            while home==work:
                work = random.choice(self.stations)
            m_start = time(random.randint(7,9), random.choice([0,15,30,45]))
            m_end = time((m_start.hour*60 + m_start.minute + random.randint(15,45))//60,
                         (m_start.hour*60 + m_start.minute + random.randint(15,45))%60)
            e_start = time(random.randint(16,18), random.choice([0,15,30,45]))
            e_end = time((e_start.hour*60 + e_start.minute + random.randint(15,45))//60,
                         (e_start.hour*60 + e_start.minute + random.randint(15,45))%60)
            user = User(f"user{i+1}", random.choice(names)+f"_{i+1}", home, work,
                        [(m_start,m_end),(e_start,e_end)], random.randint(22,45),
                        random.sample(interests_pool, random.randint(2,4)))
            users.append(user)
        return users

def load_network(path='sydney_network_data.json'):
    with open(path,'r') as f:
        return json.load(f)

def main():
    data = load_network()
    network = TransitNetwork(data)
    engine = MatchingEngine(network)
    generator = UserGenerator(network)
    users = generator.generate_users(10)
    for u in users:
        engine.add_user(u)

    for u in users:
        path = network.find_shortest_path(u.home_station, u.work_station)
        print(f"{u.name}: {u.home_station} → {u.work_station} | Path: {' → '.join(path)} | Interests: {', '.join(u.interests)}")

    target = users[0]
    print(f"\nMatches for {target.name}:")
    matches = engine.find_matches(target.user_id, 0.2)
    for i,m in enumerate(matches):
        print(f"{i+1}. {m['user'].name} | Score: {m['score']:.2f} | Route overlap: {m['details']['route_overlap']:.2f} | Interests: {m['details']['interest_overlap']:.2f}")

if __name__ == "__main__":
    main()
