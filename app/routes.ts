import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("visualize/:id", "./routes/visualizer.$id.tsx"),
] satisfies RouteConfig;
