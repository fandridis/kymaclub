import type { Route } from "./+types/getJoke";

export async function loader({ context }: Route.LoaderArgs) {
  console.log("context: ", context);

  const joke = await fetch("https://api.chucknorris.io/jokes/random");
  const jokeData = await joke.json();
  return jokeData;
}
