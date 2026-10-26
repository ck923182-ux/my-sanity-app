
"use client";

import { useActionState } from "react";
import { sayHello } from "./actions";

export default function ServerActionsDemoPage() {
  const [state, formAction, isPending] = useActionState(
    sayHello,
    ""
  );

  return (
    <main>
      <h1>Server Actions Demo</h1>

      <form action={formAction}>
        <label htmlFor="name">Enter your name:</label>

        <input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          required
        />

        <button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Say Hello"}
        </button>
      </form>

      {state && <p>{state}</p>}
    </main>
  );
}
