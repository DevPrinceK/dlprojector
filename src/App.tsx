import { ControlApp } from "./windows/control/ControlApp";
import { ProjectionApp } from "./windows/projection/ProjectionApp";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoaderSlide } from "./windows/projection/slides/LoaderSlide";

function isProjectionRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("window") === "projection" || window.location.hash === "#projection";
}

export function App() {
  return (
    <ErrorBoundary fallback={<LoaderSlide subtitle="Recovering display..." />}>
      {isProjectionRoute() ? <ProjectionApp /> : <ControlApp />}
    </ErrorBoundary>
  );
}
