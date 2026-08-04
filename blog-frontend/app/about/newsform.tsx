"use client";
import SubmitButton from "../contact/SubmitButton";
import { useActionState } from "react";
import { NewsFormAction, FormState } from "./actions";

export default function NewsForm() {
  const initialState: FormState = {
    success: false,
    message: "",
  };

  const [state, formAction] = useActionState(NewsFormAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input
        name="fullname"
        placeholder="First Name"
        className="border p-2 w-full"
      />
      <input
        name="emailaddress"
        placeholder="Last Name"
        className="border p-2 w-full"
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" required />
        <span>I agree to receive newsletters.</span>
      </label>

      <input
        type="date"
        name="subscribedAt"
        placeholder="subscribedAt"
        className="border p-2 w-full"
      />
      <SubmitButton />
    </form>
  );
}
