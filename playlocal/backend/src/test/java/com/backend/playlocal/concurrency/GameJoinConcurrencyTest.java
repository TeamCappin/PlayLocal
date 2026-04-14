import com.backend.playlocal.model.dto.GameDto;
import com.backend.playlocal.model.entity.Game;
import com.backend.playlocal.model.entity.Sport;
import com.backend.playlocal.model.entity.User;
import com.backend.playlocal.model.entity.Location;
import com.backend.playlocal.repository.GameParticipationRepository;
import com.backend.playlocal.repository.GameRepository;
import com.backend.playlocal.repository.GameVisibilityRepository;
import com.backend.playlocal.repository.SportRepository;
import com.backend.playlocal.repository.UserRepository;
import com.backend.playlocal.service.EmailService;
import com.backend.playlocal.service.GameService;
import com.backend.playlocal.testutil.DockerOrExternalDbCondition;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Concurrency tests for join/waitlist operations.
 * Validates: Concurrency P0 - No overbooking under parallel requests.
 * UserStory: US-2.5 Join/Leave + Waitlist (Concurrency-Safe)
 */
@SpringBootTest(
    classes = com.backend.playlocal.PlayLocalApplication.class, 
    properties = {
        "mail.from-email=test@playlocal.com",
        "mail.from-name=PlayLocal",
        "mail.enabled=false",
        "mail.brevo-api-key=test-key",
        "jwt.secret=test-secret-key-that-is-long-enough-for-testing-purposes",
        "jwt.expiration=86400000",
        "recaptcha.secret-key=test-key",
        "recaptcha.enabled=false",
        "recaptcha.score-threshold=0.5",
        "s3.bucket=test-bucket",
        "s3.region=us-east-2",
        "s3.accessKey=test-key",
        "s3.secretKey=test-secret",
        "s3.endpoint=http://localhost:4566",
        "s3.publicEndpoint=http://localhost:4566",
        "s3.forcePathStyle=true",
        "s3.presignExpirySeconds=900"
})
@Tag("concurrency")
@ExtendWith(DockerOrExternalDbCondition.class)
class GameJoinConcurrencyTest {
    @MockBean
    private EmailService emailService;


    // Only initialize container if not in CI (Spring Boot will use SPRING_DATASOURCE_URL env var in CI)
    static PostgreSQLContainer<?> postgres;

    static {
        // Only create container for local development (CI uses service container via SPRING_DATASOURCE_URL)
        if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            try {
                postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                        .withDatabaseName("playlocal_concurrency_test")
                        .withUsername("test")
                        .withPassword("test");
                postgres.start();
            } catch (Exception e) {
                postgres = null; // Docker unavailable; tests will be skipped
            }
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Only configure Testcontainers properties if running locally with Docker
        if (postgres != null) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        } else if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:concurrency;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
            registry.add("spring.flyway.enabled", () -> "false");
        }
        if (postgres != null || System.getenv("SPRING_DATASOURCE_URL") != null) {
            registry.add("spring.flyway.enabled", () -> "true");
        }
    }

    @Autowired
    private GameService gameService;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private GameParticipationRepository participationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private GameVisibilityRepository gameVisibilityRepository;

    private Game testGame;
    private List<User> testUsers;
    private static final int MAX_PLAYERS = 5;
    private static final int CONCURRENT_USERS = 20;

    @BeforeEach
    void setUp() {
        Assumptions.assumeTrue(postgres != null || System.getenv("SPRING_DATASOURCE_URL") != null,
                "Docker/Postgres required for concurrency tests");
        // Clean up previous test data
        participationRepository.deleteAll();
        gameRepository.deleteAll();

        // Get existing sport and visibility (seeded by migration)
        Sport basketball = sportRepository.findByNameIgnoreCase("Basketball")
                .orElseThrow(() -> new RuntimeException("Sport not seeded"));

        var visibility = gameVisibilityRepository.findByCode("public")
                .orElseThrow(() -> new RuntimeException("GameVisibility 'public' not seeded"));

        // Create organizer with unique displayName to avoid slug collisions
        String organizerUuid = UUID.randomUUID().toString().substring(0, 8);
        User organizer = User.builder()
                .email("organizer-" + organizerUuid + "@test.com")
                .passwordHash("hash")
                .displayName("Organizer-" + organizerUuid)
            .slug("organizer-" + organizerUuid)
                .status(User.UserStatus.ACTIVE)
                .build();
        organizer = userRepository.save(organizer);

        // Create test game with limited capacity
        Location location = Location.builder()
                .name("Test Court")
                .city("Montreal")
                .latitude(45.5017f)
                .longitude(-73.5673f)
                .build();

        testGame = Game.builder()
                .createdBy(organizer)
                .sport(basketball)
                .location(location)
                .visibility(visibility)
                .title("Concurrency Test Game")
                .minPlayers(2)
                .maxPlayers(MAX_PLAYERS)
                .allowWaitlist(true)
                .startTime(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();
        testGame = gameRepository.save(testGame);

        // Create test users
        testUsers = new ArrayList<>();
        for (int i = 0; i < CONCURRENT_USERS; i++) {
            String userUuid = UUID.randomUUID().toString().substring(0, 8);
            User user = User.builder()
                    .email("user" + i + "-" + userUuid + "@test.com")
                    .passwordHash("hash")
                    .displayName("User-" + i + "-" + userUuid) // Unique displayName for unique slug
                    .slug("user-" + i + "-" + userUuid)
                    .status(User.UserStatus.ACTIVE)
                    .reliabilityScore(100.0f)
                    .build();
            testUsers.add(userRepository.save(user));
        }
    }

    @AfterAll
    static void tearDown() {
        if (postgres != null) {
            postgres.stop();
        }
    }

    @Test
    @DisplayName("US-2.5: Concurrent joins should not overbook (20 users competing for 5 slots)")
    void concurrentJoinsDoNotOverbook() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(CONCURRENT_USERS);

        AtomicInteger confirmedCount = new AtomicInteger(0);
        AtomicInteger waitlistedCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        List<GameDto.JoinResponse> responses = Collections.synchronizedList(new ArrayList<>());

        // Submit all join requests
        for (User user : testUsers) {
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready
                    GameDto.JoinResponse response = gameService.joinGame(testGame.getGameId(), user.getUserId());
                    responses.add(response);

                    if ("CONFIRMED".equals(response.getJoinStatus())) {
                        confirmedCount.incrementAndGet();
                    } else if ("WAITLISTED".equals(response.getJoinStatus())) {
                        waitlistedCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        // Release all threads simultaneously
        startLatch.countDown();

        // Wait for all to complete
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);
        assertThat(completed).isTrue().describedAs("All concurrent joins should complete");

        executor.shutdown();

        // Verify: No overbooking
        int dbConfirmedCount = participationRepository.countConfirmedParticipants(testGame.getGameId());

        // The organizer takes 1 slot, so we expect MAX_PLAYERS including organizer
        assertThat(dbConfirmedCount)
                .describedAs("Confirmed count should not exceed max players")
                .isLessThanOrEqualTo(MAX_PLAYERS);

        assertThat(confirmedCount.get())
                .describedAs("Application-level confirmed count matches expected")
                .isLessThanOrEqualTo(MAX_PLAYERS); // All slots available (organizer not auto-added)

        assertThat(waitlistedCount.get())
                .describedAs("Remaining users should be waitlisted")
                .isGreaterThanOrEqualTo(CONCURRENT_USERS - MAX_PLAYERS);

        assertThat(errorCount.get())
                .describedAs("No errors should occur during concurrent joins")
                .isEqualTo(0);

        // Verify waitlist positions are unique and sequential
        var waitlisted = participationRepository.findWaitlistedByGame(testGame.getGameId());
        Set<Integer> positions = new HashSet<>();
        for (var p : waitlisted) {
            assertThat(p.getWaitlistPosition()).isNotNull().isPositive();
            positions.add(p.getWaitlistPosition());
        }
        assertThat(positions.size())
                .describedAs("Waitlist positions should be unique")
                .isEqualTo(waitlisted.size());
    }

    @Test
    @DisplayName("US-2.5: Joining same game multiple times is idempotent")
    void joinIsIdempotent() {
        User user = testUsers.get(0);
        UUID gameId = testGame.getGameId();

        // First join
        GameDto.JoinResponse first = gameService.joinGame(gameId, user.getUserId());
        assertThat(first.getJoinStatus()).isIn("CONFIRMED", "WAITLISTED");

        // Second join (should return same status)
        GameDto.JoinResponse second = gameService.joinGame(gameId, user.getUserId());
        assertThat(second.getParticipationId()).isEqualTo(first.getParticipationId());
        assertThat(second.getJoinStatus()).isEqualTo(first.getJoinStatus());
        assertThat(second.getMessage()).contains("Already joined");
    }
}
