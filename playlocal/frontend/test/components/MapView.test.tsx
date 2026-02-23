import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import MapView from "../../components/MapView";

// --------------------
// Mocks
// --------------------
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock("lucide-react", () => ({
  MapPin: () => <svg data-testid="icon-mappin" />,
  Clock: () => <svg data-testid="icon-clock" />,
  ChevronRight: () => <svg data-testid="icon-chevron" />,
}));

// Mock @vis.gl/react-google-maps so we can test the component logic without
// a real Google Maps SDK. Each mock element forwards the callbacks used by MapView.
jest.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div data-testid="google-map" onClick={onClick}>
      {children}
    </div>
  ),
  AdvancedMarker: ({
    children,
    onClick,
    title,
  }: {
    children?: React.ReactNode;
    onClick?: (e: { stop: () => void }) => void;
    title?: string;
  }) => (
    <button
      data-testid="map-marker"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick?.({ stop: () => {} }); }}
    >
      {children}
    </button>
  ),
  InfoWindow: ({
    children,
    onCloseClick,
  }: {
    children?: React.ReactNode;
    onCloseClick?: () => void;
  }) => (
    <div data-testid="info-window">
      {children}
      <button data-testid="info-window-close" onClick={onCloseClick}>
        close
      </button>
    </div>
  ),
}));

// --------------------
// Fixtures
// --------------------
const gameWithLocation = {
  id: "g1",
  title: "Basketball Pickup",
  sport: "Basketball",
  lat: 45.5017,
  lng: -73.5673,
  date: "Today",
  time: "6:00 PM",
  location: "Central Park",
};

const gameWithoutLocation = {
  id: "g2",
  title: "Soccer Match",
  sport: "Soccer",
  date: "Tomorrow",
  time: "4:00 PM",
  location: "Field House",
};

// --------------------
// Helpers
// --------------------
function setApiKey(value: string) {
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = value;
}

// --------------------
// Tests
// --------------------
describe("MapView", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  describe("Missing / invalid API key", () => {
    it("shows error when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set", () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      render(<MapView />);
      expect(
        screen.getByText("Google Maps API key is missing or invalid.")
      ).toBeInTheDocument();
    });

    it("shows error when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is 'YOUR_API_KEY_HERE'", () => {
      setApiKey("YOUR_API_KEY_HERE");
      render(<MapView />);
      expect(
        screen.getByText("Google Maps API key is missing or invalid.")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/i)
      ).toBeInTheDocument();
    });
  });

  describe("Empty games", () => {
    it("renders the map and 'No games found' when games array is empty", () => {
      setApiKey("test-key");
      render(<MapView games={[]} />);
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
      expect(screen.getByText("No games found")).toBeInTheDocument();
      expect(
        screen.getByText(/try adjusting your filters/i)
      ).toBeInTheDocument();
    });
  });

  describe("Games with no lat/lng coordinates", () => {
    it("shows plural amber banner when multiple games have no coordinates", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithoutLocation, { ...gameWithoutLocation, id: "g3", title: "Tennis" }]} />);
      expect(
        screen.getByText(/none have a map location yet/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/2 games found/i)).toBeInTheDocument();
    });

    it("shows singular 'game' in amber banner when exactly 1 game has no coordinates", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithoutLocation]} />);
      // Should say "1 game found" (no trailing 's')
      const banner = screen.getByText(/1 game found/);
      expect(banner.textContent).toMatch(/^1 game found$/);
    });

    it("does not render any markers when no games have coordinates", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithoutLocation]} />);
      expect(screen.queryByTestId("map-marker")).not.toBeInTheDocument();
    });
  });

  describe("Games with lat/lng coordinates", () => {
    it("renders a marker for each game that has coordinates", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);
      expect(screen.getByTestId("map-marker")).toBeInTheDocument();
      expect(screen.getByText("Basketball Pickup")).toBeInTheDocument();
    });

    it("marker title includes sport, date and time", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);
      const marker = screen.getByTestId("map-marker");
      expect(marker.getAttribute("title")).toMatch(/Basketball/);
      expect(marker.getAttribute("title")).toMatch(/Today/);
      expect(marker.getAttribute("title")).toMatch(/6:00 PM/);
    });

    it("does not render InfoWindow before a marker is clicked", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);
      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });

    it("does not render the amber banner when all games have coordinates", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);
      expect(
        screen.queryByText(/none have a map location yet/i)
      ).not.toBeInTheDocument();
    });

    it("renders only markers for games that have coordinates (mixed set)", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation, gameWithoutLocation]} />);
      // Only the game with lat/lng gets a marker
      expect(screen.getAllByTestId("map-marker")).toHaveLength(1);
      // Amber banner does NOT show — mappableGames.length is 1 (not 0)
      expect(screen.queryByText(/none have a map location yet/i)).not.toBeInTheDocument();
    });
  });

  describe("Marker interaction – InfoWindow", () => {
    it("opens InfoWindow with game details when a marker is clicked", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);

      fireEvent.click(screen.getByTestId("map-marker"));

      const infoWindow = screen.getByTestId("info-window");
      expect(infoWindow).toBeInTheDocument();
      expect(within(infoWindow).getByText("Basketball Pickup")).toBeInTheDocument();
      expect(within(infoWindow).getByText("Basketball")).toBeInTheDocument();
      expect(within(infoWindow).getByText(/Today at 6:00 PM/)).toBeInTheDocument();
      expect(within(infoWindow).getByText("Central Park")).toBeInTheDocument();
    });

    it("InfoWindow contains a link to the game page", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);
      fireEvent.click(screen.getByTestId("map-marker"));

      const link = screen.getByRole("link", { name: /view game/i });
      expect(link).toHaveAttribute("href", "/games/g1");
    });

    it("closes InfoWindow when the close button is clicked", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);

      fireEvent.click(screen.getByTestId("map-marker"));
      expect(screen.getByTestId("info-window")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("info-window-close"));
      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });

    it("closes InfoWindow when the map background is clicked", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);

      fireEvent.click(screen.getByTestId("map-marker"));
      expect(screen.getByTestId("info-window")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("google-map"));
      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });

    it("selected marker gets a darker background class", () => {
      setApiKey("test-key");
      render(<MapView games={[gameWithLocation]} />);

      // Before selection - unselected color
      const markerDiv = screen.getByText("Basketball Pickup");
      expect(markerDiv.className).toMatch(/bg-emerald-700/);
      expect(markerDiv.className).not.toMatch(/bg-emerald-800/);

      fireEvent.click(screen.getByTestId("map-marker"));

      // After selection - selected color
      expect(markerDiv.className).toMatch(/bg-emerald-800/);
      expect(markerDiv.className).not.toMatch(/bg-emerald-700/);
    });

    it("clicking a second marker updates selection and shows new InfoWindow", () => {
      setApiKey("test-key");
      const game2 = { ...gameWithLocation, id: "g2", title: "Soccer Match", sport: "Soccer" };
      render(<MapView games={[gameWithLocation, game2]} />);

      const markers = screen.getAllByTestId("map-marker");
      fireEvent.click(markers[0]);
      expect(screen.getByTestId("info-window")).toBeInTheDocument();
      expect(within(screen.getByTestId("info-window")).getByText("Basketball Pickup")).toBeInTheDocument();

      fireEvent.click(markers[1]);
      // InfoWindow should now show game 2
      expect(within(screen.getByTestId("info-window")).getByText("Soccer Match")).toBeInTheDocument();
    });
  });

  describe("Custom center and zoom props", () => {
    it("renders without crashing when custom center and zoom are provided", () => {
      setApiKey("test-key");
      render(
        <MapView
          games={[gameWithLocation]}
          center={{ lat: 48.8566, lng: 2.3522 }}
          zoom={14}
        />
      );
      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });
  });
});
