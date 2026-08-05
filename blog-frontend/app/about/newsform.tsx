"use client";
import SubmitButton from "../contact/SubmitButton";
import { useActionState } from "react";
import { NewsFormAction, FormState } from "./actions";

const initialState: FormState = {
  success: false,
  message: "",
};

export default function NewsForm() {
  const [state, Action] = useActionState(NewsFormAction, initialState);
  return (
    <form action={Action} className="space-y-5">
      <input
        name="fullname"
        placeholder="First Name"
        className="border p-2 w-full"
      />
      {state.errors?.fullname && (
        <p className="text-red-500">{state.errors.fullname[0]}</p>
      )}

      <input
        name="emailaddress"
        placeholder="Email Address"
        className="border p-2 w-full"
      />
      {state.errors?.emailaddress && (
        <p className="text-red-500">{state.errors.emailaddress[0]}</p>
      )}
      <label className="flex items-center gap-2">
        <input type="checkbox" name="consent" />
        <span>I agree to receive newsletters.</span>
      </label>
      {state.errors?.consent && (
        <p className="text-red-500">{state.errors.consent[0]}</p>
      )}

      <input
        type="date"
        name="subscribedAt"
        placeholder="subscribedAt"
        className="border p-2 w-full"
      />
       {state.errors?.subscribedAt && (
        <p className="text-red-500">{state.errors.subscribedAt[0]}</p>
      )}
      <SubmitButton />
    </form>
  );
}
