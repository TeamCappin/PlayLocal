## [Explainer video](https://youtu.be/8C5GtDA0mdk)

## 1) Dev Infrastructure End-To-End
- DB user personalization field: [playlocal/backend/src/main/java/com/backend/playlocal/model/entity/UserPrivacySettings.java [L50-L52]](../../playlocal/backend/src/main/java/com/backend/playlocal/model/entity/UserPrivacySettings.java#L50)
- Privacy persistence defaults and update semantics: [playlocal/backend/src/main/java/com/backend/playlocal/service/PrivacySettingsService.java [L75-L99]](../../playlocal/backend/src/main/java/com/backend/playlocal/service/PrivacySettingsService.java#L75)
- DB global switch schema and seed: [playlocal/backend/src/main/resources/db/migration/V33__create_global_feature_flag_table.sql [L1-L11]](../../playlocal/backend/src/main/resources/db/migration/V33__create_global_feature_flag_table.sql#L1)
- Feature flag service foundation: [playlocal/backend/src/main/java/com/backend/playlocal/service/FeatureFlagService.java [L17-L60]](../../playlocal/backend/src/main/java/com/backend/playlocal/service/FeatureFlagService.java#L17)
- Feature flag controller foundation: [playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java [L25-L41]](../../playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java#L25)
- Privacy controller foundation: [playlocal/backend/src/main/java/com/backend/playlocal/controller/UserController.java [L124-L143]](../../playlocal/backend/src/main/java/com/backend/playlocal/controller/UserController.java#L124)
- Security boundary setup: [playlocal/backend/src/main/java/com/backend/playlocal/config/SecurityConfig.java [L63-L69]](../../playlocal/backend/src/main/java/com/backend/playlocal/config/SecurityConfig.java#L63)
- Runtime gate chain (5 booleans): [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L77-L97]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L77)
- Route allow-list setup: [playlocal/frontend/components/ads/adsConfig.ts [L39-L60]](../../playlocal/frontend/components/ads/adsConfig.ts#L39)
- Dev placeholder behavior: [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L199-L210]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L199)

## 2) Admin End-To-End (Kill Switch)
- Controller read/write contract: [playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java [L25-L41]](../../playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java#L25)
- Admin role guard: [playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java [L30-L32]](../../playlocal/backend/src/main/java/com/backend/playlocal/controller/FeatureFlagController.java#L30)
- Frontend switch fetch, cancelled flag, fail-closed: [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L100-L122]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L100)
- Service persistence and fallback: [playlocal/backend/src/main/java/com/backend/playlocal/service/FeatureFlagService.java [L17-L60]](../../playlocal/backend/src/main/java/com/backend/playlocal/service/FeatureFlagService.java#L17)
- Admin path integration proof: [playlocal/backend/src/test/java/com/backend/playlocal/integration/FeatureFlagIntegrationTest.java [L39-L89]](../../playlocal/backend/src/test/java/com/backend/playlocal/integration/FeatureFlagIntegrationTest.java#L39)
- Admin path service proof: [playlocal/backend/src/test/java/com/backend/playlocal/service/FeatureFlagServiceTest.java [L52-L88]](../../playlocal/backend/src/test/java/com/backend/playlocal/service/FeatureFlagServiceTest.java#L52)

## 3) User End-To-End (Consent Behavior)
- Non-consenting behavior: [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L92-L97]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L92)
- Consenting behavior from stored settings: [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L124-L136]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L124)
- AdSense `requestNonPersonalizedAds` 0/1 call: [playlocal/frontend/components/ads/GoogleAdsenseClient.tsx [L165-L197]](../../playlocal/frontend/components/ads/GoogleAdsenseClient.tsx#L165)
- User settings API binding: [playlocal/frontend/lib/api.ts [L354-L363]](../../playlocal/frontend/lib/api.ts#L354)
- User privacy controller flow: [playlocal/backend/src/main/java/com/backend/playlocal/controller/UserController.java [L124-L143]](../../playlocal/backend/src/main/java/com/backend/playlocal/controller/UserController.java#L124)
- User privacy persistence flow: [playlocal/backend/src/main/java/com/backend/playlocal/service/PrivacySettingsService.java [L75-L99]](../../playlocal/backend/src/main/java/com/backend/playlocal/service/PrivacySettingsService.java#L75)

## Isolated / Out Of Scope
- Basic AdSense fetching (Melissa section)
