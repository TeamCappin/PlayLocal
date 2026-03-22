# Performance Plan

## Implemented Optimization

### Batched query reduction for game discovery responses

Status: Implemented

What changed:
The game discovery flow now batches the main data needed to render nearby and upcoming game lists. The service first loads matched nearby games in one repository call after the geospatial lookup returns ordered game IDs. It then preloads response metadata in batches instead of querying per game for participant counts, waitlist counts, tags, and exact-location access checks.

Where it was changed:
- `playlocal/backend/src/main/java/com/backend/playlocal/service/GameService.java`
- `playlocal/backend/src/main/java/com/backend/playlocal/repository/GameRepository.java`
- `playlocal/backend/src/main/java/com/backend/playlocal/repository/GameParticipationRepository.java`
- `playlocal/backend/src/main/java/com/backend/playlocal/repository/GameTagAssignmentRepository.java`
- `playlocal/backend/src/test/java/com/backend/playlocal/unit/GameServiceDiscoveryTest.java`

Why it improves performance:
The previous implementation performed one native query to find nearby game IDs and then additional per-game lookups while assembling the response. That included repeated game fetches, repeated participant summary queries, repeated tag queries, and repeated participation checks for exact-location access. Those round trips scaled with the number of returned games. The updated implementation batches those lookups so the discovery endpoints perform a small fixed set of queries for the list instead of several queries per game.

Expected impact:
- Fewer database queries during nearby game discovery
- Fewer database queries during upcoming game discovery list rendering
- Lower latency when many games match the search radius
- Less database load from repeated entity and metadata fetches for the same request
- Better scaling as the number of returned games increases

Evidence:
- `GameService.findNearbyGames(...)` now calls `gameRepository.findAllByGameIdIn(gameIds)` instead of looping over `gameRepository.findById(...)`
- `GameService.getUpcomingGames(...)` and `GameService.findNearbyGames(...)` now route list rendering through a shared batched mapping path
- `GameParticipationRepository` now exposes batched queries for confirmed and waitlist counts plus confirmed-game access checks
- `GameTagAssignmentRepository` now exposes batched tag loading for multiple games
- `GameServiceDiscoveryTest` was updated to cover the batched discovery response path
- Targeted verification was run with `./mvnw -Dtest=GameServiceDiscoveryTest test` and completed with `BUILD SUCCESS`

Notes:
This is a real implemented optimization in the production code path for game discovery. The performance section is no longer only aspirational because the codebase now includes a concrete change that reduces repeated database calls across both nearby and upcoming discovery responses.

Environment note:
The targeted Maven test passed on this machine using the Homebrew OpenJDK installation. The run emitted JaCoCo instrumentation warnings because the local environment is on OpenJDK 25, but the build still completed successfully and the discovery test class passed.
