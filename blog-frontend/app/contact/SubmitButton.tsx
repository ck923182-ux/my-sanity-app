"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white px-5 py-2 rounded"
    >
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}