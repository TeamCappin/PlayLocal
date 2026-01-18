# Meeting Notes — 2026-01-11 (6:30pm - 7:00pm)

**Iteration:** 7  
**Note-taker:** Younes  
**Attendees:** Alexander, Allaye, Hudson, Melissa, Steven, Younes, Asif  
**Absent:** Minh, David, Omar, Youssef, Adib  

---

## Agenda / Updates
- Review progress on current user stories.
- Backend & frontend status updates.
- Release planning and deployment discussion.

---

## Key Decisions / Agreements
- Backend tickets must follow a **clear bug naming convention** (to be added to coding standards).
- If Docker-related bugs occur, **rebase the Docker setup** using this command suggested by Steven :<br>
  `docker-compose down -v && docker-compose build --no-cache && docker-compose up -d
`
- The team must follow the **PlayLocal ERD** [PlayLocal Database ERD — Documentation](https://github.com/TeamCappin/PlayLocal/wiki/PlayLocal-Database-ERD-%E2%80%94-Documentation) as well as the class diagrams for the user stories [here](https://github.com/TeamCappin/PlayLocal/wiki/Class-Diagrams--And-Sequence-Diagrams--And--State-Machines-For-User-Stories)
  - Disregard and remove the deprecated **Local ERD** present in [system architecture](https://github.com/TeamCappin/PlayLocal/wiki/System-Architecture#2-system-design)
- **Steven** is the main technical reference for coding questions.
- The team is **on track**, according to the professor.

---

## Deployment & Documentation
- Deployment strategy still needs clarification.
- Deployment instructions will be added to the **README** once **Adib** is available.
- Potential future consideration: **Web app implementation**.

---

## Timeline & Milestones
- **MVP Plan:**
  - **MVP 0:** Core functionalities by January 26.
  - **Special / advanced features:** By February 9.

---

## Action Items
- **Team:** Follow the PlayLocal ERD and class diagrams, remove deprecated ERD.
- **Team:** Apply backend bug naming conventions and update coding standards.
- **Team:** Clarify deployment workflow.
- **Team:** Add deployment instructions to the README.
- **Team:** Share ideas for a **new logo** in the general chat.





