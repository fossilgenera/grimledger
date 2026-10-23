import { describe, expect, it } from "vitest";
import { EMPTY_INDEX, type IndexSnapshot } from "../../../src/data/index/buildIndex";
import { IndexStore } from "../../../src/data/index/IndexStore";

function snapshotWith(clientName: string): IndexSnapshot {
  return {
    clients: {
      items: [
        { path: `${clientName}.md`, name: clientName, status: "active" },
      ],
      skipped: [],
    },
    projects: { items: [], skipped: [] },
    tasks: { items: [], skipped: [] },
    workSessions: { items: [], skipped: [] },
    blockers: { items: [], skipped: [], },
  };
}

describe("IndexStore", () => {
  it("starts with the empty snapshot", () => {
    expect(new IndexStore().snapshot).toBe(EMPTY_INDEX);
  });

  it("holds the snapshot it was given", () => {
    const store = new IndexStore();
    const next = snapshotWith("A");
    store.replace(next);
    expect(store.snapshot).toBe(next);
  });

  it("does not call a listener when it subscribes", () => {
    const store = new IndexStore();
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });
    expect(calls).toBe(0);
  });

  it("calls every listener, in subscription order, with the new snapshot", () => {
    const store = new IndexStore();
    const received: Array<[string, IndexSnapshot]> = [];
    store.subscribe((s) => received.push(["first", s]));
    store.subscribe((s) => received.push(["second", s]));

    const next = snapshotWith("A");
    store.replace(next);

    expect(received).toEqual([
      ["first", next],
      ["second", next],
    ]);
    expect(received[0]?.[1]).toBe(next);
  });

  it("calls listeners once per replace", () => {
    const store = new IndexStore();
    let calls = 0;
    store.subscribe(() => {
      calls += 1;
    });
    store.replace(snapshotWith("A"));
    store.replace(snapshotWith("B"));
    expect(calls).toBe(2);
  });

  it("stops calling a listener after it unsubscribes", () => {
    const store = new IndexStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.replace(snapshotWith("A"));
    unsubscribe();
    store.replace(snapshotWith("B"));
    expect(calls).toBe(1);
  });

  it("allows unsubscribing twice", () => {
    const store = new IndexStore();
    const unsubscribe = store.subscribe(() => {});
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });

  it("only removes its own subscription when the same function is subscribed twice", () => {
    const store = new IndexStore();
    let calls = 0;
    const listener = () => {
      calls += 1;
    };
    const unsubscribeFirst = store.subscribe(listener);
    store.subscribe(listener);

    unsubscribeFirst();
    store.replace(snapshotWith("A"));

    expect(calls).toBe(1);
  });

  it("is safe for a listener to unsubscribe itself during a notification", () => {
    const store = new IndexStore();
    const called: string[] = [];
    const unsubscribeFirst = store.subscribe(() => {
      called.push("first");
      unsubscribeFirst();
    });
    store.subscribe(() => {
      called.push("second");
    });

    store.replace(snapshotWith("A"));
    store.replace(snapshotWith("B"));

    expect(called).toEqual(["first", "second", "second"]);
  });

  it("does not call a listener added during a notification until the next one", () => {
    const store = new IndexStore();
    const called: string[] = [];
    let added = false;
    store.subscribe(() => {
      called.push("first");
      if (!added) {
        added = true;
        store.subscribe(() => {
          called.push("late");
        });
      }
    });

    store.replace(snapshotWith("A"));
    expect(called).toEqual(["first"]);

    store.replace(snapshotWith("B"));
    expect(called).toEqual(["first", "first", "late"]);
  });

  it("calls every listener even if one throws, then rethrows the first error", () => {
    const store = new IndexStore();
    const called: string[] = [];
    store.subscribe(() => {
      called.push("first");
      throw new Error("first failed");
    });
    store.subscribe(() => {
      called.push("second");
      throw new Error("second failed");
    });
    store.subscribe(() => {
      called.push("third");
    });

    const next = snapshotWith("A");
    expect(() => store.replace(next)).toThrow("first failed");

    expect(called).toEqual(["first", "second", "third"]);
    expect(store.snapshot).toBe(next);
  });
});