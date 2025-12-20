Stakeholders asked us to assess Screaming Frog SEO Spider for finding municipal web sources before we write custom scrapers. It’s an SEO crawler, but it can also surface pages, documents and datasets across a city’s domains. This summary evaluates its fit, features, licensing and automation for our pre-permit discovery work.

Screaming Frog can crawl domains and subdomains, list internal links and files and extract elements like PDF/CSV links. It’s a discovery aid, not a replacement for our scrapers. We still need to review results and feed selected sources into sources.yaml.

The app runs on Windows, macOS and Linux. The free edition caps crawls at 500 URLs; the paid annual license removes that limit.

Features that matter to us: JavaScript rendering for SPAs and portals; custom extraction via CSS/XPath/regex (generally requires a license); spider and list modes; scheduling and full headless CLI; and exports to CSV or Google Sheets/Drive.

Pros: fast site mapping, flexible targeted extraction, built-in scheduling/automation, cross-platform use and useful SEO diagnostics that can hint at site quality.

Cons: the free crawl limit, likely needing a license for custom extraction, some learning curve for selectors, heavier RAM/CPU use on large JS sites and no direct integration with our parsing models or storage.

How we’d use it: pilot on laval.ca to gauge coverage, define extractors for document links and basic metadata, enable JS rendering where needed, export to CSV/Sheets, review and update sources.yaml and schedule weekly headless runs. If coverage or extraction limits block us, buy one license and continue.

Bottom line: with respectful settings and light review, Screaming Frog can speed up pre-permit source discovery and complement our bespoke scrapers. A short pilot will tell us if the ROI justifies a license.


PlantUML Diagram:
@startuml
title Screaming Frog Discovery Workflow


participant "Screaming Frog SEO Spider" as SF
participant "Project Team" as Team
participant "sources" as Config
participant "Custom Scraper" as Scraper


Team -> SF: Configure crawl (domains, subdomains, JS rendering, extractors)
SF -> SF: Crawl domain and subdomains
SF -> Team: Export URL inventory (CSV/Sheet)
Team -> Config: Review and add selected sources
Team -> Scraper: Build and run custom scrapers on selected sources

@enduml
