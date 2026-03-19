# Performance Plan

## Implemented Optimization

### Batched loading for nearby game discovery

Status: Implemented

What changed:
The nearby game discovery flow now loads matched games in a single batched repository query after the geospatial lookup returns ordered game IDs. Before this change, the service loaded each matched game one at a time, which created an N+1 query pattern.

Where it was changed:
- `playlocal/backend/src/main/java/com/backend/playlocal/service/GameService.java`
- `playlocal/backend/src/main/java/com/backend/playlocal/repository/GameRepository.java`
- `playlocal/backend/src/test/java/com/backend/playlocal/unit/GameServiceDiscoveryTest.java`

Why it improves performance:
The previous implementation performed one native query to find nearby game IDs and then one additional repository query per returned game. That causes database round-trip costs to grow linearly with the number of matches. The updated implementation replaces those repeated lookups with a single batched fetch and then restores the original distance-based order in memory.

Expected impact:
- Fewer database queries during nearby game discovery
- Lower latency when many games match the search radius
- Less database load from repeated entity fetches for the same request

Evidence:
- `GameService.findNearbyGames(...)` now calls `gameRepository.findAllByGameIdIn(gameIds)` instead of looping over `gameRepository.findById(...)`
- `GameRepository` now exposes a batched fetch method for the matched game IDs
- `GameServiceDiscoveryTest` was updated to cover the batched repository call

Notes:
This is a real implemented optimization in the production code path for game discovery. The performance section is no longer only aspirational because the codebase now includes a concrete change whose effect is reducing repeated database calls.
