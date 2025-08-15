import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("how-it-works", "routes/howItWorks.tsx"),
  route("partners", "routes/partners.tsx"),
  route("careers", "routes/careers.tsx"),
  route("about-us", "routes/aboutUs.tsx"),
  route("api/getJoke", "routes/api/getJoke.ts"), //TODO: remove this
  route("api/createNotionPageToDB", "routes/api/createNotionPageToDB.ts"),
  route(
    "api/createNotionPageToPartnerDB",
    "routes/api/createNotionPageToPartnerDB.ts"
  ),
] satisfies RouteConfig;
