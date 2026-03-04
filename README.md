# PlayLocal - Location-based social platform for organizing local pickup sports

Dev branch
[![codecov](https://codecov.io/gh/TeamCappin/PlayLocal/branch/dev/graph/badge.svg?token=8P22R0Z90L)](https://codecov.io/gh/TeamCappin/PlayLocal)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TeamCappin_PlayLocal&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TeamCappin_PlayLocal)

Release branch
[![codecov](https://codecov.io/gh/TeamCappin/PlayLocal/branch/release/graph/badge.svg?token=8P22R0Z90L)](https://codecov.io/gh/TeamCappin/PlayLocal)
[![Netlify Status](https://api.netlify.com/api/v1/badges/9e082237-585c-4ac5-9085-c19eb58954ee/deploy-status)](https://app.netlify.com/projects/playlocal/deploys)

## Project Overview

PlayLocal is a location-based social platform for organizing local pickup sports. The primary
goal is to foster community and consistent participation by solving the most common problems
in casual sports: reliability, safety, and finding a welcoming group.

As lifestyles become more digital and isolated, many people seek low-pressure ways to stay
active and meet new people. The biggest barriers are often logistical uncertainty (Will enough
people show up?) and social anxiety (Will the group be welcoming and safe?). 

PlayLocal addresses these issues by creating a platform that prioritizes reliability and positive social
connections. We are committed to building an inclusive and safe environment, ensuring
everyone can find a group where they feel comfortable and respected.


### Team Members

| Name                     | Student Number | GitHub Username       |
|--------------------------|----------------|-----------------------|
| Minh Huynh               | 40210039       | @vibqetowi           |
| Omar Elmasaoudi          | 40255123       | @Omare04             |
| Asif Ali Khan            | 40211000       | @AsifAliKhan2001     |
| Melissa Rahman           | 40249231       | @mE3lissa            |
| Younes Bouhaba           | 40205816       | @Younesbhb           |
| Alexander El Ghaoui      | 40200062       | @Ghawi25             |
| David Onwionoko          | 40167358       | @d-realblank         |
| Steven Zrihen            | 40174529       | @elshito             |
| Youssef Yacoub           | 40189020       | @Pharo-14            |
| Hudson Lu                | 40254326       | @HudsonLu            |
| Allaye Dicko             | 40224071       | @allaye4             |
| Adib Akkari              | 40216815       | @adssib              |

## Release Demos 

### Release 1 : https://github.com/TeamCappin/PlayLocal/tree/dev/Admin/Release-1-Presentation

### Release 2

Release 2 Presentation video: https://drive.google.com/file/d/1mFgsqjgU6McoWA14zVe59H-5EelsNpwP/view?usp=drive_link

Release 2 Product-Demo: https://drive.google.com/file/d/1PNaAeSPwOFa7_IYM0w3t6a3zuS-GDuko/view?usp=drive_link

Release 2 Presentation: [PlayLocal - 490 Release 2 Presentation.pdf](https://github.com/user-attachments/files/25198789/PlayLocal.-.490.Release.2.Presentation.pdf)


### Release 3

Release 3 Presentation video: 

Release 3 Product-Demo:

Release 3 Presentation: 

## Developer Manual

Make sure you have both `npm` & `mvn` installed
```sh
mvn --version
npm --version
```

### Docker Development (Recommended)

Run the full stack (Frontend + Backend + Database) with a single command:

```sh
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Database**: localhost:5432

To stop the services:
```sh
docker compose down
```

### Manual Development

```sh
cd backend/playlocal/
mvn clean install
mvn spring-boot:run
```

the go to `http://localhost:8080/`

```sh
cd frontend/playlocal/
npm install
npm run dev
```

then go to `http://localhost:3000`

### Testing 
```sh
mvn test

npm test
```

### Formatting & Lint:

```sh
cd playlocal/backend/
mvn -B checkstyle:check

cd playlocal/frontend/
npm run lint:errors


npm run format:check
npm run format:write
```




## Wiki Table of Contents


```
