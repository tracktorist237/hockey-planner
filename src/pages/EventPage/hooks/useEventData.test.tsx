import { act, renderHook, waitFor } from "@testing-library/react";
import { getEvent } from "src/api/events";
import { useEventData } from "src/pages/EventPage/hooks/useEventData";
import { EventDto } from "src/types/events";

jest.mock("src/api/events", () => ({ getEvent: jest.fn() }));
jest.mock("src/utils/share", () => ({ updateMetaTags: jest.fn() }));
const load = getEvent as jest.MockedFunction<typeof getEvent>;
beforeEach(() => load.mockReset());

test.each([false, true])("late event A response cannot replace event B (failure: %s)", async failure => {
  let resolve!: (event: EventDto) => void;
  let reject!: (error: Error) => void;
  const eventB = { id: "B", title: "Event B" } as EventDto;
  load.mockReturnValueOnce(new Promise((done, fail) => { resolve = done; reject = fail; }))
    .mockResolvedValueOnce(eventB);
  const { result, rerender } = renderHook(({ id }) => useEventData(id), { initialProps: { id: "A" } });
  const staleReload = result.current.reloadEvent;
  rerender({ id: "B" });
  await waitFor(() => expect(result.current.event).toEqual(eventB));
  await act(async () => { expect(await staleReload()).toBeNull(); });
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => {
    if (failure) reject(new Error("Event A failed"));
    else resolve({ id: "A" } as EventDto);
  });
  expect(result.current.event).toEqual(eventB);
  expect(result.current.error).toBeNull();
  expect(result.current.loading).toBe(false);
});
