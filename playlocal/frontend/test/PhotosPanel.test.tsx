/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PhotosPanel } from "../components/photos/PhotosPanel"; // <-- adjust if needed

// Mock api module used by PhotosPanel (alias import)
const mockListByGame = jest.fn();
const mockRequestUploadSlot = jest.fn();
const mockFinalizeUpload = jest.fn();

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    photos: {
      listByGame: (...args: any[]) => mockListByGame(...args),
      requestUploadSlot: (...args: any[]) => mockRequestUploadSlot(...args),
      finalizeUpload: (...args: any[]) => mockFinalizeUpload(...args),
    },
  },
}));

describe("PhotosPanel Component", () => {
  const gameId = "game-123";

  function makePhoto(mediaId: string, url = `https://cdn.test/${mediaId}.jpg`) {
    return { mediaId, url };
  }

  function getFileInput(): HTMLInputElement {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeInTheDocument();
    return input!;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    // jsdom does not implement these in many setups
    (HTMLElement.prototype as any).scrollIntoView = jest.fn();
    (HTMLElement.prototype as any).scrollBy = jest.fn();
    (HTMLElement.prototype as any).scrollTo = jest.fn();

    // requestAnimationFrame used in component (if any future usage)
    (global as any).requestAnimationFrame = (cb: any) => cb(0);

    // default fetch mock
    (global as any).fetch = jest.fn();
  });

  describe("Initial load / empty state", () => {
    it("shows 'No photos yet.' when list is empty", async () => {
      mockListByGame.mockResolvedValueOnce([]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      await waitFor(() => expect(mockListByGame).toHaveBeenCalledWith(gameId));

      expect(screen.getByText("Game Photos")).toBeInTheDocument();
      expect(screen.getByText(/No photos yet\./i)).toBeInTheDocument();
      expect(screen.getByText(/Anyone can view photos/i)).toBeInTheDocument();
      expect(screen.getByText("0 / 5")).toBeInTheDocument();
    });

    it("shows error if list fails", async () => {
      mockListByGame.mockRejectedValueOnce(new Error("Boom"));

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      await waitFor(() => {
        expect(screen.getByText("Boom")).toBeInTheDocument();
      });
    });
  });

  describe("Photos display / thumbnails", () => {
    it("renders main photo and thumbnails when photos exist", async () => {
      const photos = [makePhoto("m1"), makePhoto("m2")];
      mockListByGame.mockResolvedValueOnce(photos);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      // counter is based on activeIndex slot; default 0 => 1 / photos.length
      expect(screen.getByText("1 / 2")).toBeInTheDocument();

      // thumbnails are rendered with alt "Thumbnail X"
      expect(screen.getByAltText("Thumbnail 1")).toBeInTheDocument();
      expect(screen.getByAltText("Thumbnail 2")).toBeInTheDocument();

      // "Open in new tab" appears when activePhoto exists
      expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    });

    it("clicking a thumbnail slot changes active photo", async () => {
      const photos = [
        makePhoto("m1", "https://cdn.test/one.jpg"),
        makePhoto("m2", "https://cdn.test/two.jpg"),
      ];
      mockListByGame.mockResolvedValueOnce(photos);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);
      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      const mainImg1 = screen.getByAltText("Game photo") as HTMLImageElement;
      expect(mainImg1.src).toContain("https://cdn.test/one.jpg");

      fireEvent.click(screen.getByAltText("Thumbnail 2"));

      const mainImg2 = screen.getByAltText("Game photo") as HTMLImageElement;
      await waitFor(() => {
        expect(mainImg2.src).toContain("https://cdn.test/two.jpg");
      });
    });

    it("activePhoto falls back to first photo when activeIndex points to an empty slot", async () => {
      const photos = [makePhoto("m1", "https://cdn.test/only.jpg")];
      mockListByGame.mockResolvedValueOnce(photos);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      const nextBtn = screen.getByRole("button", { name: "Next thumbnail" });

      // Move to slot index 3 (empty slot because only 1 photo exists)
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      // Counter should remain 1 / 1 because it clamps numerator using min(activeIndex+1, photos.length)
      await waitFor(() => expect(screen.getByText("1 / 1")).toBeInTheDocument());

      // Main photo should still be the first (fallback)
      const mainImg = screen.getByAltText("Game photo") as HTMLImageElement;
      expect(mainImg.src).toContain("https://cdn.test/only.jpg");

      // Open link should still exist
      expect(screen.getByText("Open in new tab")).toBeInTheDocument();
    });

    it("scrollIntoView is invoked when activeIndex changes (selected thumb)", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1"), makePhoto("m2")]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);
      await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

      const nextBtn = screen.getByRole("button", { name: "Next thumbnail" });
      fireEvent.click(nextBtn);

      await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
      expect((HTMLElement.prototype as any).scrollIntoView).toHaveBeenCalled();
    });
  });

  describe("Prev/Next arrow behavior (slot-based)", () => {
    it("Next thumbnail button advances index and scrolls right by THUMB_W+16", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1"), makePhoto("m2")]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);
      await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

      const nextBtn = screen.getByRole("button", { name: "Next thumbnail" });

      fireEvent.click(nextBtn);

      await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());

      // THUMB_W=56, GAP=16 => 72
      expect((HTMLElement.prototype as any).scrollBy).toHaveBeenCalledWith({
        left: 72,
        behavior: "smooth",
      });
    });

    it("Prev thumbnail button moves back and scrolls left by THUMB_W+16", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1"), makePhoto("m2")]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);
      await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

      const nextBtn = screen.getByRole("button", { name: "Next thumbnail" });
      const prevBtn = screen.getByRole("button", { name: "Previous thumbnail" });

      fireEvent.click(nextBtn);
      await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());

      fireEvent.click(prevBtn);
      await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

      expect((HTMLElement.prototype as any).scrollBy).toHaveBeenCalledWith({
        left: -72,
        behavior: "smooth",
      });
    });

    it("Prev is disabled at index 0; Next is disabled only at slot index 4", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1")]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);
      await waitFor(() => expect(screen.getByText("1 / 1")).toBeInTheDocument());

      const prevBtn = screen.getByRole("button", { name: "Previous thumbnail" });
      const nextBtn = screen.getByRole("button", { name: "Next thumbnail" });

      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Move to slot 4
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      await waitFor(() => expect(nextBtn).toBeDisabled());
      expect(prevBtn).not.toBeDisabled();
    });
  });

  describe("Upload UI behavior", () => {
    it("does not show Upload button when canUpload is false", async () => {
      mockListByGame.mockResolvedValueOnce([]);
      const clickSpy = jest.spyOn(HTMLInputElement.prototype, "click");

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      expect(screen.queryByText(/Upload photo/i)).not.toBeInTheDocument();
      expect(clickSpy).not.toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    it("disables upload when maxed (5 photos)", async () => {
      mockListByGame.mockResolvedValueOnce([
        makePhoto("m1"),
        makePhoto("m2"),
        makePhoto("m3"),
        makePhoto("m4"),
        makePhoto("m5"),
      ]);

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());
      expect(screen.getByText(/Max 5 photos reached/i)).toBeInTheDocument();

      const uploadBtn = screen.getByRole("button", { name: /Limit reached/i });
      expect(uploadBtn).toBeDisabled();
    });

    it("clicking an empty slot opens picker when canUpload is true and not maxed", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1")]); // remaining empty slots exist
      const clickSpy = jest.spyOn(HTMLInputElement.prototype, "click");

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      const plusButtons = screen.getAllByText("＋");
      expect(plusButtons.length).toBeGreaterThan(0);

      fireEvent.click(plusButtons[0]);

      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    it("clicking an empty slot also selects it (applies selected styling)", async () => {
      mockListByGame.mockResolvedValueOnce([makePhoto("m1")]);

      render(<PhotosPanel gameId={gameId} canUpload={true} />);
      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      // The first empty slot is slot index 1 => element id="thumb-1"
      const slot1 = document.getElementById("thumb-1") as HTMLButtonElement | null;
      expect(slot1).toBeInTheDocument();

      // Click the empty slot
      fireEvent.click(slot1!);

      // Selected empty slot should have emerald border class
      await waitFor(() => {
        expect(slot1!).toHaveClass("border-emerald-500");
      });
    });
  });

  describe("Upload flow: success + failures", () => {
    it("happy path: request slot -> PUT -> finalize -> refresh", async () => {
      const initialPhotos = [makePhoto("m1", "https://cdn.test/m1.jpg")];
      const refreshedPhotos = [
        makePhoto("m1", "https://cdn.test/m1.jpg"),
        makePhoto("m2", "https://cdn.test/m2.jpg"),
      ];

      mockListByGame.mockResolvedValueOnce(initialPhotos); // initial refresh()
      mockListByGame.mockResolvedValueOnce(refreshedPhotos); // refresh() after upload

      mockRequestUploadSlot.mockResolvedValueOnce({
        mediaId: "m2",
        uploadUrl: "https://s3.test/put",
        objectKey: "games/game-123/photos/m2",
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      mockFinalizeUpload.mockResolvedValueOnce(undefined);

      render(<PhotosPanel gameId={gameId} canUpload={true} />);
      await waitFor(() => expect(screen.getByAltText("Game photo")).toBeInTheDocument());

      const file = new File(["hello"], "photo.jpg", { type: "image/jpeg" });
      const input = getFileInput();

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(mockRequestUploadSlot).toHaveBeenCalledWith(gameId, {
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          sizeBytes: file.size,
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://s3.test/put",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: file,
        }),
      );

      await waitFor(() => {
        expect(mockFinalizeUpload).toHaveBeenCalledWith(gameId, "m2");
      });

      await waitFor(() => {
        expect(screen.getByText("1 / 2")).toBeInTheDocument();
        expect(screen.getByAltText("Thumbnail 2")).toBeInTheDocument();
      });
    });

    it("shows error when uploading non-image file", async () => {
      mockListByGame.mockResolvedValueOnce([]);

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      const badFile = new File(["oops"], "file.txt", { type: "text/plain" });
      const input = getFileInput();

      await act(async () => {
        fireEvent.change(input, { target: { files: [badFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Please upload an image file/i)).toBeInTheDocument();
      });

      expect(mockRequestUploadSlot).not.toHaveBeenCalled();
      expect(mockFinalizeUpload).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("shows error when requestUploadSlot fails", async () => {
      mockListByGame.mockResolvedValueOnce([]);

      mockRequestUploadSlot.mockRejectedValueOnce(new Error("slot error"));

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      const file = new File(["x"], "photo.png", { type: "image/png" });
      const input = getFileInput();

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText("slot error")).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockFinalizeUpload).not.toHaveBeenCalled();
    });

    it("shows error when PUT fails (includes status + body text)", async () => {
      mockListByGame.mockResolvedValueOnce([]);

      mockRequestUploadSlot.mockResolvedValueOnce({
        mediaId: "m99",
        uploadUrl: "https://s3.test/put-fail",
        objectKey: "x",
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "server error",
      });

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      const file = new File(["x"], "photo.png", { type: "image/png" });
      const input = getFileInput();

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Upload failed: 500/i)).toBeInTheDocument();
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      expect(mockFinalizeUpload).not.toHaveBeenCalled();
    });

    it("shows error when finalizeUpload fails (and does not refresh again)", async () => {
      mockListByGame.mockResolvedValueOnce([]); // initial refresh only

      mockRequestUploadSlot.mockResolvedValueOnce({
        mediaId: "m7",
        uploadUrl: "https://s3.test/put-ok",
        objectKey: "x",
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      mockFinalizeUpload.mockRejectedValueOnce(new Error("finalize boom"));

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
      const input = getFileInput();

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText("finalize boom")).toBeInTheDocument();
      });

      // Since finalize failed, refresh() in try block should not run again
      expect(mockListByGame).toHaveBeenCalledTimes(1);
    });
  });

  describe("Max photos guard in onPickFile (isMaxed early-return branch)", () => {
    it("shows max error and blocks requestUploadSlot when user selects a file while already maxed", async () => {
      mockListByGame.mockResolvedValueOnce([
        makePhoto("m1"),
        makePhoto("m2"),
        makePhoto("m3"),
        makePhoto("m4"),
        makePhoto("m5"),
      ]);

      render(<PhotosPanel gameId={gameId} canUpload={true} />);

      // With 5 photos, default activeIndex=0 => 1 / 5
      await waitFor(() => expect(screen.getByText("1 / 5")).toBeInTheDocument());

      const input = getFileInput();
      const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText("This game already has the maximum of 5 photos."),
        ).toBeInTheDocument();
      });

      expect(mockRequestUploadSlot).not.toHaveBeenCalled();
      expect(mockFinalizeUpload).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Refresh button", () => {
    it("clicking Refresh reloads the list", async () => {
      mockListByGame.mockResolvedValueOnce([]);
      mockListByGame.mockResolvedValueOnce([makePhoto("m1")]);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      await waitFor(() => expect(mockListByGame).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

      await waitFor(() => expect(mockListByGame).toHaveBeenCalledTimes(2));
    });

    it("Refresh button is disabled while loading", async () => {
      // Create a pending promise so component stays in loading state
      let resolveList!: (val: any) => void;
      const pending = new Promise((res) => {
        resolveList = res as any;
      });

      mockListByGame.mockReturnValueOnce(pending);

      render(<PhotosPanel gameId={gameId} canUpload={false} />);

      // While pending, it should show "Refreshing..." and be disabled
      const refreshBtn = screen.getByRole("button", { name: /Refreshing/i });
      expect(refreshBtn).toBeDisabled();

      // resolve it so test completes cleanly
      await act(async () => {
        resolveList([]);
      });
    });
  });
});
