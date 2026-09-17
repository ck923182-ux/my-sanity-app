export default async function SlowComponent() {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return (
    <div>
      <h2>Slow Component Loaded 🎉</h2>
      <p>This component took 5 seconds.</p>
    </div>
  );
}