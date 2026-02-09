// Carousel.test.tsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

jest.mock("lucide-react", () => {
  const Icon = (name: string) => (props: any) => (
    <svg data-testid={name} {...props} />
  );
  return { ArrowLeft: Icon("ArrowLeft"), ArrowRight: Icon("ArrowRight") };
});

// ✅ mock the real module path that carousel imports internally
jest.mock("@/components/ui/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// ✅ mock the real module path that carousel imports internally
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

type EmblaHandler = (api: any) => void;
type EmblaHandlersMap = Record<string, Set<EmblaHandler>>;

let emblaHandlers: EmblaHandlersMap;
let canPrev = false;
let canNext = false;

const scrollPrev = jest.fn();
const scrollNext = jest.fn();

const api = {
  canScrollPrev: jest.fn(() => canPrev),
  canScrollNext: jest.fn(() => canNext),
  scrollPrev,
  scrollNext,
  on: jest.fn((evt: string, cb: EmblaHandler) => {
    emblaHandlers[evt] ??= new Set();
    emblaHandlers[evt].add(cb);
  }),
  off: jest.fn((evt: string, cb: EmblaHandler) => {
    emblaHandlers[evt]?.delete(cb);
  }),
};

const carouselRef = jest.fn();

const useEmblaCarouselMock = jest.fn(() => [carouselRef, api]);

jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: (...args: any[]) => useEmblaCarouselMock(...args),
}));

function triggerEmbla(evt: string) {
  const handlers = emblaHandlers[evt] ? Array.from(emblaHandlers[evt]) : [];
  handlers.forEach((cb) => cb(api));
}

function renderBasicCarousel(extra?: Partial<React.ComponentProps<typeof Carousel>>) {
  return render(
    <Carousel {...extra}>
      <CarouselContent data-testid="content-inner">
        <CarouselItem>Slide 1</CarouselItem>
        <CarouselItem>Slide 2</CarouselItem>
      </CarouselContent>

      <CarouselPrevious />
      <CarouselNext />
    </Carousel>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  emblaHandlers = {};
  canPrev = false;
  canNext = false;
});

describe("Carousel", () => {
  test("calls useEmblaCarousel with axis='x' by default (horizontal)", () => {
    renderBasicCarousel();

    expect(useEmblaCarouselMock).toHaveBeenCalledTimes(1);
    const [optsArg] = useEmblaCarouselMock.mock.calls[0];
    expect(optsArg.axis).toBe("x");
  });

  test("calls useEmblaCarousel with axis='y' when orientation='vertical'", () => {
    renderBasicCarousel({ orientation: "vertical" });

    expect(useEmblaCarouselMock).toHaveBeenCalledTimes(1);
    const [optsArg] = useEmblaCarouselMock.mock.calls[0];
    expect(optsArg.axis).toBe("y");
  });

  test("passes through opts while overriding axis based on orientation", () => {
    renderBasicCarousel({ orientation: "vertical", opts: { loop: true, align: "start" as any } });

    const [optsArg] = useEmblaCarouselMock.mock.calls[0];
    expect(optsArg.loop).toBe(true);
    expect(optsArg.align).toBe("start");
    expect(optsArg.axis).toBe("y");
  });

  test("calls setApi(api) when setApi prop is provided", () => {
    const setApi = jest.fn();
    renderBasicCarousel({ setApi });

    expect(setApi).toHaveBeenCalledTimes(1);
    expect(setApi).toHaveBeenCalledWith(api);
  });

  test("registers embla event listeners and cleans up on unmount", () => {
    const { unmount } = renderBasicCarousel();

    // onSelect effect registers reInit + select
    expect(api.on).toHaveBeenCalledWith("reInit", expect.any(Function));
    expect(api.on).toHaveBeenCalledWith("select", expect.any(Function));

    // cleanup only calls off('select', onSelect) in the component code
    unmount();
    expect(api.off).toHaveBeenCalledWith("select", expect.any(Function));
  });

  test("Previous/Next buttons are disabled by default when cannot scroll", () => {
    canPrev = false;
    canNext = false;
    renderBasicCarousel();

    const prev = screen.getByRole("button", { name: /previous slide/i });
    const next = screen.getByRole("button", { name: /next slide/i });

    expect(prev).toBeDisabled();
    expect(next).toBeDisabled();
  });

  test("enables buttons when embla reports it can scroll (select event updates state)", () => {
    renderBasicCarousel();

    const prev = screen.getByRole("button", { name: /previous slide/i });
    const next = screen.getByRole("button", { name: /next slide/i });

    // Flip embla state and trigger select to cause onSelect to run
    canPrev = true;
    canNext = true;

    act(() => {
      triggerEmbla("select");
    });

    expect(prev).toBeEnabled();
    expect(next).toBeEnabled();
  });

  test("clicking Previous/Next calls api.scrollPrev/scrollNext", () => {
    canPrev = true;
    canNext = true;
    renderBasicCarousel();

    const prev = screen.getByRole("button", { name: /previous slide/i });
    const next = screen.getByRole("button", { name: /next slide/i });

    fireEvent.click(prev);
    fireEvent.click(next);

    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });

  test("ArrowLeft/ArrowRight keydown on the carousel container triggers scrollPrev/scrollNext", () => {
    canPrev = true;
    canNext = true;
    renderBasicCarousel();

    const region = screen.getByRole("region");

    // Use a custom event so we can verify preventDefault gets called
    const leftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
    Object.defineProperty(leftEvent, "preventDefault", { value: jest.fn() });

    const rightEvent = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
    Object.defineProperty(rightEvent, "preventDefault", { value: jest.fn() });

    fireEvent(region, leftEvent);
    fireEvent(region, rightEvent);

    expect((leftEvent.preventDefault as any) as jest.Mock).toHaveBeenCalledTimes(1);
    expect((rightEvent.preventDefault as any) as jest.Mock).toHaveBeenCalledTimes(1);

    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).toHaveBeenCalledTimes(1);
  });


  test("CarouselItem applies horizontal vs vertical spacing classes", () => {
    const { rerender } = render(
      <Carousel orientation="horizontal">
        <CarouselContent>
          <CarouselItem data-testid="item" />
        </CarouselContent>
      </Carousel>,
    );

    expect(screen.getByTestId("item")).toHaveClass("pl-4");
    expect(screen.getByTestId("item")).not.toHaveClass("pt-4");

    rerender(
      <Carousel orientation="vertical">
        <CarouselContent>
          <CarouselItem data-testid="item" />
        </CarouselContent>
      </Carousel>,
    );

    expect(screen.getByTestId("item")).toHaveClass("pt-4");
    expect(screen.getByTestId("item")).not.toHaveClass("pl-4");
  });
});
