import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ScrollToTopButton } from "./components/ScrollToTopButton";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="light" position="top-right" richColors closeButton />
      <ScrollToTopButton />
    </>
  );
}

export default App;
