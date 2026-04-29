import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ScrollToTopButton } from "./components/ScrollToTopButton";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors theme="light" closeButton />
      <ScrollToTopButton />
    </>
  );
}

export default App;
