import CircularLoader from "./circular-loader";

export function LoadingView() {
  return (
    <div className="flex justify-center items-center w-screen h-screen">
      <CircularLoader />
    </div>
  );
}