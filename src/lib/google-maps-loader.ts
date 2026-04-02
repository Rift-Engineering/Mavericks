import { Loader } from "@googlemaps/js-api-loader";

/**
 * One consistent Loader config for the whole app. The Maps JS API must not be
 * initialised with different options (e.g. with vs without `places`).
 */
export function createGoogleMapsLoader(apiKey: string) {
  return new Loader({
    apiKey,
    version: "weekly",
    libraries: ["places"],
  });
}
