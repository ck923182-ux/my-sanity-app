import react from "react";
import { Suspense } from "react";
import SlowComponent from "./SlowComponent";

export default function StreamingTestPage() {
  return (
    <main>
      <h1>strinng test </h1>
      <Suspense fallback={<p>Loading post component and server data ....</p>}>
        <SlowComponent />
      </Suspense>
    </main>
  );
}
