export type StepTiming = {
  name: string;
  duration: number;
};

export async function measureStep<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{
  result: T;
  timing: StepTiming;
}> {
  const start = performance.now();

  try {
    const result = await fn();

    return {
      result,
      timing: {
        name,
        duration: Math.round(
          performance.now() - start
        ),
      },
    };
  } catch (error) {
    throw error;
  }
} 