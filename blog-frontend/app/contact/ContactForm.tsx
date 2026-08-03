"use client";

import { useActionState } from "react";
import { FormEntry, type FormState } from "./actions";
import SubmitButton from "./SubmitButton";

const initialState: FormState = {
  success: false,
  message: "",
};

export default function ContactForm() {
  const [state, formAction] = useActionState(
    FormEntry,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">

      <input
        name="firstName"
        placeholder="First Name"
        className="border p-2 w-full"
      />

      {state.errors?.firstName && (
        <p className="text-red-500">
          {state.errors.firstName[0]}
        </p>
      )}

      <input
        name="lastName"
        placeholder="Last Name"
        className="border p-2 w-full"
      />

      <input
        name="email"
        placeholder="Email"
        className="border p-2 w-full"
      />

      {state.errors?.email && (
        <p className="text-red-500">
          {state.errors.email[0]}
        </p>
      )}

      <textarea
        name="message"
        placeholder="Message"
        className="border p-2 w-full"
      />

      {state.errors?.message && (
        <p className="text-red-500">
          {state.errors.message[0]}
        </p>
      )}

      <SubmitButton />

      {state.message && (
        <p
          className={
            state.success
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}